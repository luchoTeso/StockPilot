const db = require('../config/database');
const { logger } = require('../utils/logger');

// 1. Crear nuevo cliente
exports.createCliente = async (req, res) => {
    const { nombre, celular, limite_credito } = req.body;
    const id_tienda = req.session.tiendaId;

    if (!nombre) {
        return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });
    }

    try {
        const cliente = await db.getAsync(
            `INSERT INTO Clientes (id_tienda, nombre, celular, limite_credito) 
             VALUES (?, ?, ?, ?) RETURNING *`,
            [id_tienda, nombre, celular || null, limite_credito || 0]
        );
        res.json({ success: true, cliente });
    } catch (error) {
        logger.error({ err: error, id_tienda }, 'Error al crear cliente');
        res.status(500).json({ success: false, error: 'Error al registrar cliente' });
    }
};

// 2. Obtener lista de clientes con su saldo pendiente
exports.getClientes = async (req, res) => {
    const id_tienda = req.session.tiendaId;

    try {
        // Obtenemos los clientes y calculamos su deuda: (Total Fiados - Total Abonos)
        const clientesRaw = await db.allAsync(`
            SELECT 
                c.id_cliente, c.nombre, c.celular, c.limite_credito, c.fecha_registro,
                COALESCE(
                    (SELECT SUM(precio_total) FROM Ventas WHERE id_cliente = c.id_cliente AND metodo_pago = 'Fiado'), 0
                ) as total_fiado,
                COALESCE(
                    (SELECT SUM(monto) FROM Abonos WHERE id_cliente = c.id_cliente), 0
                ) as total_abonado
            FROM Clientes c
            WHERE c.id_tienda = ?
            ORDER BY c.nombre ASC
        `, [id_tienda]);

        const clientes = clientesRaw.map(c => ({
            ...c,
            saldo_pendiente: Number(c.total_fiado) - Number(c.total_abonado)
        }));

        res.json({ success: true, clientes });
    } catch (error) {
        logger.error({ err: error, id_tienda }, 'Error al obtener cartera de clientes');
        res.status(500).json({ success: false, error: 'Error al obtener cartera de clientes' });
    }
};

// 3. Obtener detalle e historial de un cliente
exports.getClienteDetalle = async (req, res) => {
    const { id } = req.params;
    const id_tienda = req.session.tiendaId;

    try {
        const clienteRes = await db.getAsync('SELECT * FROM Clientes WHERE id_cliente = ? AND id_tienda = ?', [id, id_tienda]);
        if (!clienteRes) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
        
        const ventasFiadas = await db.allAsync('SELECT id_venta, fecha_salida, precio_total, estado_deuda FROM Ventas WHERE id_cliente = ? AND metodo_pago = ? ORDER BY fecha_salida DESC', [id, 'Fiado']);
        const abonos = await db.allAsync('SELECT id_abono, fecha_abono, monto, metodo_pago FROM Abonos WHERE id_cliente = ? ORDER BY fecha_abono DESC', [id]);
        
        const total_fiado = ventasFiadas.reduce((sum, v) => sum + Number(v.precio_total), 0);
        const total_abonado = abonos.reduce((sum, a) => sum + Number(a.monto), 0);

        res.json({
            success: true,
            cliente: {
                ...clienteRes,
                saldo_pendiente: total_fiado - total_abonado,
                historial_ventas: ventasFiadas,
                historial_abonos: abonos
            }
        });
    } catch (error) {
        logger.error({ err: error, id_tienda }, 'Error al obtener detalle de cliente');
        res.status(500).json({ success: false, error: 'Error al obtener detalle de cliente' });
    }
};

// 4. Registrar Abono (Pago de Fiado)
exports.registrarAbono = async (req, res) => {
    const { id_cliente } = req.params;
    const { monto, metodo_pago } = req.body;
    const id_tienda = req.session.tiendaId;
    const id_usuario = req.session.userId;

    if (!monto || monto <= 0) {
        return res.status(400).json({ success: false, error: 'El monto debe ser mayor a 0' });
    }

    try {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Validar que el cliente existe
            const clienteCheck = await client.query('SELECT * FROM Clientes WHERE id_cliente = ? AND id_tienda = ?', [id_cliente, id_tienda]);
            if (clienteCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
            }

            // Buscar sesión de caja ABIERTA del vendedor/admin para inyectar este ingreso
            const sesionRes = await client.query(
                'SELECT id_sesion FROM SesionCaja WHERE id_tienda = ? AND id_vendedor = ? AND estado = ?',
                [id_tienda, id_usuario, 'Abierta']
            );
            let id_sesion_caja = null;
            if (sesionRes.rows.length > 0) {
                id_sesion_caja = sesionRes.rows[0].id_sesion;
            } else {
                if (metodo_pago === 'Efectivo') {
                     logger.warn({ id_usuario, id_tienda }, 'Registrando abono en efectivo sin caja abierta.');
                }
            }

            // Registrar Abono
            const result = await client.query(
                `INSERT INTO Abonos (id_cliente, id_tienda, id_sesion_caja, monto, metodo_pago, id_usuario_recibe)
                 VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
                [id_cliente, id_tienda, id_sesion_caja, monto, metodo_pago || 'Efectivo', id_usuario]
            );

            await client.query('COMMIT');
            client.release();
            res.json({ success: true, abono: result.rows[0], mensaje: 'Abono registrado correctamente' });
        } catch (innerError) {
            await client.query('ROLLBACK');
            client.release();
            throw innerError;
        }
    } catch (error) {
        logger.error({ err: error, id_tienda }, 'Error al registrar abono');
        res.status(500).json({ success: false, error: 'Error al registrar abono' });
    }
};
