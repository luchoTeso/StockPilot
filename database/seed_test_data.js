// database/seed_test_data.js
// Seeder de datos de prueba — Semana 1
// Ejecutar: npm run seed  O  POST /api/admin/seed
//
// Genera:
//   - 1 tienda de viveres en Bogota
//   - 2 usuarios (admin + tendero)
//   - ~40 productos en 6 categorias
//   - ~1800 ventas (90 dias de historial)
//   - Movimientos de inventario
//   - Escenarios para disparar todas las alertas

const db = require('../config/database');
const bcrypt = require('bcrypt');

// =============================================
// HELPERS
// =============================================
function dateStr(date) {
    return date.toISOString().split('T')[0];
}

function dateTimeStr(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return dateStr(d);
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// =============================================
// MIGRACION: Extender tabla Productos
// =============================================
async function runMigration() {
    const columnsToAdd = [
        { name: 'stock_minimo', def: 'INTEGER DEFAULT 5' },
        { name: 'stock_maximo', def: 'INTEGER DEFAULT 200' },
        { name: 'fecha_vencimiento', def: 'TEXT' },
        { name: 'frecuencia_compra_dias', def: 'INTEGER DEFAULT 7' },
        { name: 'costo_compra', def: 'REAL DEFAULT 0' },
        { name: 'stock_seguridad', def: 'INTEGER DEFAULT 0' },
        { name: 'lead_time', def: 'INTEGER DEFAULT 3' },
    ];

    for (const col of columnsToAdd) {
        try {
            await db.runAsync(`ALTER TABLE Productos ADD COLUMN ${col.name} ${col.def}`);
            console.log(`  + Columna '${col.name}' agregada a Productos`);
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log(`  ~ Columna '${col.name}' ya existe, omitida`);
            } else {
                throw e;
            }
        }
    }

    // Extender MovimientosStock
    const movCols = [
        { name: 'id_usuario', def: 'INTEGER' },
        { name: 'id_tienda', def: 'INTEGER' },
    ];
    for (const col of movCols) {
        try {
            await db.runAsync(`ALTER TABLE MovimientosStock ADD COLUMN ${col.name} ${col.def}`);
            console.log(`  + Columna '${col.name}' agregada a MovimientosStock`);
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log(`  ~ Columna '${col.name}' ya existe, omitida`);
            } else {
                throw e;
            }
        }
    }
}

// =============================================
// PRODUCTOS — 40 productos realistas
// =============================================
function getProductos(tiendaId) {
    const hoy = new Date();

    return [
        // === GRANOS Y CEREALES (Alta rotacion - Categoria A) ===
        { codigo: 'GR001', nombre: 'Arroz Diana 1Kg', categoria: 'Granos y cereales', subcategoria: 'Arroz', tipo: 'Grano', precio: 4500, costo: 3200, cantidad: 85, stock_min: 20, stock_max: 150, vencimiento: daysFromNow(180), frecuencia: 7, rotacion: 'A', stock_seguridad: 15, lead_time: 3 },
        { codigo: 'GR002', nombre: 'Arroz Roa 5Kg', categoria: 'Granos y cereales', subcategoria: 'Arroz', tipo: 'Grano', precio: 19500, costo: 14000, cantidad: 30, stock_min: 10, stock_max: 60, vencimiento: daysFromNow(180), frecuencia: 7, rotacion: 'A', stock_seguridad: 8, lead_time: 4 },
        { codigo: 'GR003', nombre: 'Lentejas 500g', categoria: 'Granos y cereales', subcategoria: 'Legumbres', tipo: 'Grano', precio: 3800, costo: 2600, cantidad: 45, stock_min: 15, stock_max: 80, vencimiento: daysFromNow(365), frecuencia: 14, rotacion: 'A', stock_seguridad: 10, lead_time: 5 },
        { codigo: 'GR004', nombre: 'Frijol rojo 500g', categoria: 'Granos y cereales', subcategoria: 'Legumbres', tipo: 'Grano', precio: 4200, costo: 2900, cantidad: 40, stock_min: 15, stock_max: 80, vencimiento: daysFromNow(365), frecuencia: 14, rotacion: 'A', stock_seguridad: 10, lead_time: 5 },
        { codigo: 'GR005', nombre: 'Avena Quaker 400g', categoria: 'Granos y cereales', subcategoria: 'Cereales', tipo: 'Cereal', precio: 5600, costo: 3800, cantidad: 25, stock_min: 10, stock_max: 50, vencimiento: daysFromNow(120), frecuencia: 14, rotacion: 'B', stock_seguridad: 5, lead_time: 7 },
        { codigo: 'GR006', nombre: 'Pasta Doria Espagueti 250g', categoria: 'Granos y cereales', subcategoria: 'Pastas', tipo: 'Pasta', precio: 2800, costo: 1800, cantidad: 60, stock_min: 20, stock_max: 100, vencimiento: daysFromNow(240), frecuencia: 7, rotacion: 'A', stock_seguridad: 15, lead_time: 3 },
        { codigo: 'GR007', nombre: 'Harina de Trigo 1Kg', categoria: 'Granos y cereales', subcategoria: 'Harinas', tipo: 'Harina', precio: 3500, costo: 2200, cantidad: 35, stock_min: 10, stock_max: 60, vencimiento: daysFromNow(180), frecuencia: 14, rotacion: 'B', stock_seguridad: 5, lead_time: 5 },

        // === LACTEOS (Alta rotacion, vencimiento proximo) ===
        { codigo: 'LA001', nombre: 'Leche Alqueria Entera 1L', categoria: 'Lacteos', subcategoria: 'Leche', tipo: 'Bebida', precio: 4200, costo: 3100, cantidad: 3, stock_min: 15, stock_max: 60, vencimiento: daysFromNow(2), frecuencia: 3, rotacion: 'A', stock_seguridad: 12, lead_time: 2 },
        { codigo: 'LA002', nombre: 'Leche Colanta Deslactosada 1L', categoria: 'Lacteos', subcategoria: 'Leche', tipo: 'Bebida', precio: 4800, costo: 3500, cantidad: 8, stock_min: 10, stock_max: 40, vencimiento: daysFromNow(5), frecuencia: 3, rotacion: 'A', stock_seguridad: 8, lead_time: 2 },
        { codigo: 'LA003', nombre: 'Yogurt Alpina 1L', categoria: 'Lacteos', subcategoria: 'Yogurt', tipo: 'Bebida', precio: 5500, costo: 3800, cantidad: 5, stock_min: 8, stock_max: 30, vencimiento: daysFromNow(3), frecuencia: 5, rotacion: 'A', stock_seguridad: 5, lead_time: 2 },
        { codigo: 'LA004', nombre: 'Queso Campesino 500g', categoria: 'Lacteos', subcategoria: 'Queso', tipo: 'Lacteo', precio: 8500, costo: 6000, cantidad: 12, stock_min: 5, stock_max: 25, vencimiento: daysFromNow(6), frecuencia: 7, rotacion: 'B', stock_seguridad: 3, lead_time: 3 },
        { codigo: 'LA005', nombre: 'Mantequilla 250g', categoria: 'Lacteos', subcategoria: 'Mantequilla', tipo: 'Lacteo', precio: 4500, costo: 3200, cantidad: 14, stock_min: 5, stock_max: 25, vencimiento: daysFromNow(15), frecuencia: 14, rotacion: 'B', stock_seguridad: 5, lead_time: 4 },

        // === BEBIDAS (Alta rotacion, algunos sobrestock) ===
        { codigo: 'BE001', nombre: 'Coca-Cola 350ml', categoria: 'Bebidas', subcategoria: 'Gaseosas', tipo: 'Bebida', precio: 2500, costo: 1700, cantidad: 120, stock_min: 30, stock_max: 100, vencimiento: daysFromNow(90), frecuencia: 3, rotacion: 'A', stock_seguridad: 24, lead_time: 2 },
        { codigo: 'BE002', nombre: 'Gaseosa Postobon Manzana 350ml', categoria: 'Bebidas', subcategoria: 'Gaseosas', tipo: 'Bebida', precio: 2300, costo: 1500, cantidad: 95, stock_min: 25, stock_max: 80, vencimiento: daysFromNow(90), frecuencia: 3, rotacion: 'A', stock_seguridad: 24, lead_time: 2 },
        { codigo: 'BE003', nombre: 'Jugo Hit Naranja 1L', categoria: 'Bebidas', subcategoria: 'Jugos', tipo: 'Bebida', precio: 3800, costo: 2600, cantidad: 22, stock_min: 10, stock_max: 40, vencimiento: daysFromNow(30), frecuencia: 7, rotacion: 'B', stock_seguridad: 10, lead_time: 3 },
        { codigo: 'BE004', nombre: 'Agua Cristal 600ml', categoria: 'Bebidas', subcategoria: 'Agua', tipo: 'Bebida', precio: 1500, costo: 800, cantidad: 150, stock_min: 40, stock_max: 120, vencimiento: daysFromNow(365), frecuencia: 3, rotacion: 'A', stock_seguridad: 30, lead_time: 1 },
        { codigo: 'BE005', nombre: 'Cerveza Poker 330ml', categoria: 'Bebidas', subcategoria: 'Cerveza', tipo: 'Bebida', precio: 3200, costo: 2200, cantidad: 48, stock_min: 15, stock_max: 80, vencimiento: daysFromNow(120), frecuencia: 7, rotacion: 'A', stock_seguridad: 24, lead_time: 2 },
        { codigo: 'BE006', nombre: 'Aguardiante Antioqueno 375ml', categoria: 'Bebidas', subcategoria: 'Licores', tipo: 'Bebida', precio: 18000, costo: 13000, cantidad: 10, stock_min: 3, stock_max: 15, vencimiento: null, frecuencia: 14, rotacion: 'C', stock_seguridad: 2, lead_time: 7 },

        // === ASEO (Baja rotacion, sobrestock) ===
        { codigo: 'AS001', nombre: 'Jabon Rey 300g', categoria: 'Aseo', subcategoria: 'Jabon', tipo: 'Limpieza', precio: 2200, costo: 1400, cantidad: 85, stock_min: 10, stock_max: 40, vencimiento: null, frecuencia: 30, rotacion: 'C', stock_seguridad: 12, lead_time: 5 },
        { codigo: 'AS002', nombre: 'Detergente Fab 1Kg', categoria: 'Aseo', subcategoria: 'Detergente', tipo: 'Limpieza', precio: 8500, costo: 5800, cantidad: 30, stock_min: 5, stock_max: 25, vencimiento: null, frecuencia: 30, rotacion: 'C', stock_seguridad: 5, lead_time: 5 },
        { codigo: 'AS003', nombre: 'Papel Higienico Familia x4', categoria: 'Aseo', subcategoria: 'Papel', tipo: 'Higiene', precio: 6500, costo: 4500, cantidad: 20, stock_min: 8, stock_max: 35, vencimiento: null, frecuencia: 14, rotacion: 'B', stock_seguridad: 12, lead_time: 3 },
        { codigo: 'AS004', nombre: 'Cloro Blancox 500ml', categoria: 'Aseo', subcategoria: 'Limpieza', tipo: 'Limpieza', precio: 3200, costo: 2000, cantidad: 18, stock_min: 5, stock_max: 25, vencimiento: null, frecuencia: 30, rotacion: 'C', stock_seguridad: 5, lead_time: 5 },
        { codigo: 'AS005', nombre: 'Cepillo de Dientes Colgate', categoria: 'Aseo', subcategoria: 'Higiene personal', tipo: 'Higiene', precio: 4500, costo: 2800, cantidad: 15, stock_min: 5, stock_max: 20, vencimiento: null, frecuencia: 30, rotacion: 'C', stock_seguridad: 2, lead_time: 15 },

        // === ENLATADOS (Media rotacion) ===
        { codigo: 'EN001', nombre: 'Atun Van Camps 160g', categoria: 'Enlatados', subcategoria: 'Atun', tipo: 'Enlatado', precio: 5800, costo: 4000, cantidad: 35, stock_min: 10, stock_max: 60, vencimiento: daysFromNow(365), frecuencia: 14, rotacion: 'B', stock_seguridad: 6, lead_time: 7 },
        { codigo: 'EN002', nombre: 'Sardina Isabel 170g', categoria: 'Enlatados', subcategoria: 'Sardina', tipo: 'Enlatado', precio: 4200, costo: 2800, cantidad: 28, stock_min: 8, stock_max: 50, vencimiento: daysFromNow(300), frecuencia: 14, rotacion: 'B', stock_seguridad: 6, lead_time: 7 },
        { codigo: 'EN003', nombre: 'Frijoles enlatados Zenú 300g', categoria: 'Enlatados', subcategoria: 'Frijoles', tipo: 'Enlatado', precio: 3500, costo: 2300, cantidad: 22, stock_min: 8, stock_max: 40, vencimiento: daysFromNow(240), frecuencia: 14, rotacion: 'B', stock_seguridad: 4, lead_time: 7 },
        { codigo: 'EN004', nombre: 'Maiz tierno Zenú 300g', categoria: 'Enlatados', subcategoria: 'Maiz', tipo: 'Enlatado', precio: 3200, costo: 2100, cantidad: 18, stock_min: 5, stock_max: 35, vencimiento: daysFromNow(240), frecuencia: 14, rotacion: 'C', stock_seguridad: 4, lead_time: 7 },
        { codigo: 'EN005', nombre: 'Salchicha Ranchera x5', categoria: 'Enlatados', subcategoria: 'Embutidos', tipo: 'Embutido', precio: 5500, costo: 3800, cantidad: 25, stock_min: 8, stock_max: 40, vencimiento: daysFromNow(45), frecuencia: 7, rotacion: 'B', stock_seguridad: 10, lead_time: 3 },

        // === SNACKS Y DULCES (Mixta — algunos agotados) ===
        { codigo: 'SN001', nombre: 'Papas Margarita Natural 30g', categoria: 'Snacks', subcategoria: 'Papas', tipo: 'Snack', precio: 2000, costo: 1300, cantidad: 2, stock_min: 15, stock_max: 60, vencimiento: daysFromNow(60), frecuencia: 7, rotacion: 'A', stock_seguridad: 20, lead_time: 2 },
        { codigo: 'SN002', nombre: 'Galletas Festival Chocolate', categoria: 'Snacks', subcategoria: 'Galletas', tipo: 'Snack', precio: 1200, costo: 750, cantidad: 50, stock_min: 15, stock_max: 80, vencimiento: daysFromNow(90), frecuencia: 7, rotacion: 'A', stock_seguridad: 30, lead_time: 3 },
        { codigo: 'SN003', nombre: 'Chocolate Jet 50g', categoria: 'Snacks', subcategoria: 'Chocolates', tipo: 'Snack', precio: 1800, costo: 1100, cantidad: 7, stock_min: 10, stock_max: 40, vencimiento: daysFromNow(7), frecuencia: 7, rotacion: 'B', stock_seguridad: 12, lead_time: 3 },
        { codigo: 'SN004', nombre: 'Chiclets Adams x3', categoria: 'Snacks', subcategoria: 'Chicles', tipo: 'Snack', precio: 800, costo: 450, cantidad: 40, stock_min: 10, stock_max: 60, vencimiento: daysFromNow(180), frecuencia: 14, rotacion: 'C', stock_seguridad: 12, lead_time: 7 },
        { codigo: 'SN005', nombre: 'Chocoramo', categoria: 'Snacks', subcategoria: 'Ponques', tipo: 'Snack', precio: 2200, costo: 1500, cantidad: 4, stock_min: 10, stock_max: 40, vencimiento: daysFromNow(15), frecuencia: 7, rotacion: 'A', stock_seguridad: 12, lead_time: 2 },

        // === BASICOS HOGAR ===
        { codigo: 'BH001', nombre: 'Aceite Girasol 1L', categoria: 'Basicos hogar', subcategoria: 'Aceites', tipo: 'Aceite', precio: 9500, costo: 6800, cantidad: 18, stock_min: 8, stock_max: 30, vencimiento: daysFromNow(180), frecuencia: 14, rotacion: 'A', stock_seguridad: 6, lead_time: 5 },
        { codigo: 'BH002', nombre: 'Azucar Manuelita 1Kg', categoria: 'Basicos hogar', subcategoria: 'Azucar', tipo: 'Endulzante', precio: 4200, costo: 2900, cantidad: 40, stock_min: 15, stock_max: 60, vencimiento: daysFromNow(365), frecuencia: 7, rotacion: 'A', stock_seguridad: 10, lead_time: 4 },
        { codigo: 'BH003', nombre: 'Sal Refisal 1Kg', categoria: 'Basicos hogar', subcategoria: 'Sal', tipo: 'Condimento', precio: 1800, costo: 1000, cantidad: 25, stock_min: 5, stock_max: 30, vencimiento: null, frecuencia: 30, rotacion: 'C', stock_seguridad: 10, lead_time: 7 },
        { codigo: 'BH004', nombre: 'Cafe Sello Rojo 250g', categoria: 'Basicos hogar', subcategoria: 'Cafe', tipo: 'Bebida', precio: 7800, costo: 5500, cantidad: 6, stock_min: 8, stock_max: 25, vencimiento: daysFromNow(120), frecuencia: 7, rotacion: 'A', stock_seguridad: 5, lead_time: 4 },
        { codigo: 'BH005', nombre: 'Panela redonda 500g', categoria: 'Basicos hogar', subcategoria: 'Panela', tipo: 'Endulzante', precio: 2500, costo: 1600, cantidad: 30, stock_min: 10, stock_max: 50, vencimiento: daysFromNow(90), frecuencia: 14, rotacion: 'B', stock_seguridad: 10, lead_time: 5 },
        { codigo: 'BH006', nombre: 'Huevos x30 unidades', categoria: 'Basicos hogar', subcategoria: 'Huevos', tipo: 'Proteina', precio: 16000, costo: 12000, cantidad: 10, stock_min: 5, stock_max: 20, vencimiento: daysFromNow(12), frecuencia: 7, rotacion: 'A', stock_seguridad: 5, lead_time: 2 },
    ];
}

// =============================================
// GENERAR VENTAS REALISTAS (90 dias)
// =============================================
function generateSalesData(productos, tiendaId, vendedorId) {
    const ventas = [];
    const hoy = new Date();

    // Configurar ventas por tipo de rotacion
    const ventaConfig = {
        'A': { probDiaria: 0.90, minCant: 3, maxCant: 12 },
        'B': { probDiaria: 0.55, minCant: 1, maxCant: 5 },
        'C': { probDiaria: 0.20, minCant: 1, maxCant: 2 },
    };

    for (let dia = 90; dia >= 1; dia--) {
        const fecha = daysAgo(dia);
        const diaSemana = fecha.getDay(); // 0=dom, 6=sab
        const diaDelMes = fecha.getDate();
        const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
        const esQuincena = diaDelMes === 1 || diaDelMes === 2 || diaDelMes === 15 || diaDelMes === 16;

        // Multiplicador por dia
        let multiplicador = 1.0;
        if (esFinDeSemana) multiplicador *= 1.3;
        if (esQuincena) multiplicador *= 1.4;

        // Items de esta venta (agrupados por "transaccion")
        let itemsVenta = [];
        let totalVenta = 0;

        for (const prod of productos) {
            const config = ventaConfig[prod.rotacion];
            let prob = config.probDiaria * multiplicador;

            // Tendencia creciente para ciertos productos (ultimas semanas venden mas)
            if (prod.codigo === 'BE005' || prod.codigo === 'SN002') {
                const semanaDesdeInicio = Math.floor((90 - dia) / 7);
                prob *= (1 + semanaDesdeInicio * 0.05);
            }
            // Tendencia decreciente
            if (prod.codigo === 'AS001' || prod.codigo === 'EN004') {
                const semanaDesdeInicio = Math.floor((90 - dia) / 7);
                prob *= Math.max(0.3, 1 - semanaDesdeInicio * 0.05);
            }

            if (Math.random() < prob) {
                let cantidad = randomInt(config.minCant, config.maxCant);
                cantidad = Math.round(cantidad * multiplicador);
                if (cantidad < 1) cantidad = 1;

                const subtotal = cantidad * prod.precio;
                totalVenta += subtotal;

                itemsVenta.push({
                    productoIndex: productos.indexOf(prod),
                    cantidad: cantidad,
                    subtotal: subtotal,
                });
            }
        }

        // Crear venta si hubo items
        if (itemsVenta.length > 0) {
            // Dividir en 1-4 transacciones por dia
            const numTransacciones = randomInt(1, Math.min(4, itemsVenta.length));
            const itemsPorTransaccion = Math.ceil(itemsVenta.length / numTransacciones);

            for (let t = 0; t < numTransacciones; t++) {
                const items = itemsVenta.slice(t * itemsPorTransaccion, (t + 1) * itemsPorTransaccion);
                if (items.length === 0) break;

                const hora = randomInt(7, 20);
                const minuto = randomInt(0, 59);
                const fechaVenta = new Date(fecha);
                fechaVenta.setHours(hora, minuto, 0, 0);

                const totalTx = items.reduce((s, i) => s + i.subtotal, 0);

                ventas.push({
                    fecha: dateTimeStr(fechaVenta),
                    vendedorId,
                    tiendaId,
                    total: totalTx,
                    items: items,
                });
            }
        }
    }

    return ventas;
}

// =============================================
// EJECUTAR SEEDER
// =============================================
async function seed() {
    console.log('');
    console.log('===========================================');
    console.log(' SEEDER DE DATOS DE PRUEBA — Semana 1');
    console.log('===========================================');
    console.log('');

    // 1. Migracion
    console.log('[1/6] Ejecutando migracion de esquema...');
    await runMigration();

    // 2. Limpiar datos existentes (orden inverso de dependencias)
    console.log('[2/6] Limpiando datos existentes...');
    await db.runAsync('DELETE FROM Auditoria_IA');
    await db.runAsync('DELETE FROM Ordenes_Detalle');
    await db.runAsync('DELETE FROM Ordenes_Compra');
    await db.runAsync('DELETE FROM VentasProductos');
    await db.runAsync('DELETE FROM Ventas');
    await db.runAsync('DELETE FROM MovimientosStock');
    await db.runAsync('DELETE FROM reportes');
    await db.runAsync('DELETE FROM Productos');
    await db.runAsync('DELETE FROM Proveedores');
    await db.runAsync('DELETE FROM Usuarios');
    await db.runAsync('DELETE FROM Tienda');
    console.log('  Tablas limpiadas.');

    // 3. Crear tienda
    console.log('[3/6] Creando tienda y usuarios...');
    const tiendaResult = await db.runAsync(
        `INSERT INTO Tienda (nombre_establecimiento, direccion, anio_creacion, estado)
         VALUES (?, ?, ?, ?)`,
        ['Distribuidora La Esperanza', 'Calle 38 Sur #79D-10, Kennedy, Bogota', 2020, 'Activo']
    );
    const tiendaId = tiendaResult.lastID;
    console.log(`  Tienda creada (ID: ${tiendaId})`);

    // 4. Crear usuarios
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashTendero = await bcrypt.hash('1234', 10);

    const adminResult = await db.runAsync(
        `INSERT INTO Usuarios (nombres, genero, correo, celular, rol, usuario, contrasena, id_tienda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Carlos Administrador', 'Masculino', 'admin@distribuidora.com', '3001234567', 'Administrador', 'admin', hashAdmin, tiendaId]
    );
    const adminId = adminResult.lastID;

    const tenderoResult = await db.runAsync(
        `INSERT INTO Usuarios (nombres, genero, correo, celular, rol, usuario, contrasena, id_tienda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Maria Tendero', 'Femenino', 'tendero@distribuidora.com', '3009876543', 'Tendedero', 'tendero1', hashTendero, tiendaId]
    );
    const tenderoId = tenderoResult.lastID;
    console.log(`  Admin creado (ID: ${adminId}) — usuario: admin / admin123`);
    console.log(`  Tendero creado (ID: ${tenderoId}) — usuario: tendero1 / 1234`);

    // 4.5 Insertar Proveedores
    console.log('[*] Insertando proveedores MOCK...');
    const provs = [
        ['Distribuidora Andina SAS', 'Alberto Fernandez', 'ventas@andinasas.com', '3001112233'],
        ['Lácteos del Valle', 'Sofía Gomez', 'sgomez@lacteosvalle.com', '3204445566'],
        ['Comercializadora El Trébol', 'Carlos Ruiz', 'contacto@eltrebol.co', '3157778899']
    ];
    const provIds = [];
    for (const p of provs) {
        const res = await db.runAsync(
            `INSERT INTO Proveedores (id_tienda, nombre_empresa, contacto_principal, email, telefono, estado) VALUES (?, ?, ?, ?, ?, 'Activo')`,
            [tiendaId, p[0], p[1], p[2], p[3]]
        );
        provIds.push(res.lastID);
    }
    console.log(`  ${provIds.length} proveedores creados.`);

    // 5. Insertar productos
    console.log('[4/6] Insertando productos (~40)...');
    const productosData = getProductos(tiendaId);
    const productIds = [];

    for (let idx = 0; idx < productosData.length; idx++) {
        const p = productosData[idx];
        const randomProvId = provIds[idx % provIds.length];
        
        const result = await db.runAsync(
            `INSERT INTO Productos (codigo, nombre_producto, categoria, subcategoria, tipo_producto, precio, cantidad, fecha_entrada, estado, id_tienda, stock_minimo, stock_maximo, fecha_vencimiento, frecuencia_compra_dias, costo_compra, stock_seguridad, lead_time, id_proveedor)
             VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'), 'Disponible', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.codigo, p.nombre, p.categoria, p.subcategoria, p.tipo, p.precio, p.cantidad, tiendaId, p.stock_min, p.stock_max, p.vencimiento, p.frecuencia, p.costo, p.stock_seguridad || 0, p.lead_time || 3, randomProvId]
        );
        productIds.push(result.lastID);
    }
    console.log(`  ${productIds.length} productos insertados.`);

    // 6. Generar ventas
    console.log('[5/6] Generando historial de ventas (90 dias)...');
    const ventasData = generateSalesData(productosData, tiendaId, adminId);
    let totalVentas = 0;
    let totalItems = 0;

    for (const venta of ventasData) {
        const ventaResult = await db.runAsync(
            `INSERT INTO Ventas (id_vendedor, id_tienda, fecha_salida, precio_total)
             VALUES (?, ?, ?, ?)`,
            [venta.vendedorId, venta.tiendaId, venta.fecha, venta.total]
        );
        const ventaId = ventaResult.lastID;
        totalVentas++;

        for (const item of venta.items) {
            await db.runAsync(
                `INSERT INTO VentasProductos (id_venta, id_producto, cantidad)
                 VALUES (?, ?, ?)`,
                [ventaId, productIds[item.productoIndex], item.cantidad]
            );
            totalItems++;
        }
    }
    console.log(`  ${totalVentas} ventas generadas con ${totalItems} items.`);

    // 7. Generar movimientos de inventario
    console.log('[6/6] Generando movimientos de inventario...');
    let totalMovimientos = 0;

    for (let i = 0; i < productosData.length; i++) {
        const p = productosData[i];
        const pId = productIds[i];

        // Entrada inicial (hace 90 dias)
        await db.runAsync(
            `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, fecha_movimiento, observacion, id_usuario, id_tienda)
             VALUES (?, 'Entrada', ?, ?, ?, ?, ?)`,
            [pId, p.cantidad + randomInt(20, 80), dateTimeStr(daysAgo(90)), 'Stock inicial', adminId, tiendaId]
        );
        totalMovimientos++;

        // 2-4 reabastecimientos durante los 90 dias
        const numReabastecimientos = randomInt(2, 4);
        for (let r = 0; r < numReabastecimientos; r++) {
            const diaReab = randomInt(10, 80);
            await db.runAsync(
                `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, fecha_movimiento, observacion, id_usuario, id_tienda)
                 VALUES (?, 'Entrada', ?, ?, ?, ?, ?)`,
                [pId, randomInt(10, 50), dateTimeStr(daysAgo(diaReab)), 'Reabastecimiento', adminId, tiendaId]
            );
            totalMovimientos++;
        }

        // 1 ajuste para algunos productos
        if (Math.random() < 0.3) {
            await db.runAsync(
                `INSERT INTO MovimientosStock (id_producto, tipo_movimiento, cantidad, fecha_movimiento, observacion, id_usuario, id_tienda)
                 VALUES (?, 'Ajuste', ?, ?, ?, ?, ?)`,
                [pId, randomInt(-5, 5), dateTimeStr(daysAgo(randomInt(5, 30))), 'Ajuste por conteo fisico', adminId, tiendaId]
            );
            totalMovimientos++;
        }
    }
    console.log(`  ${totalMovimientos} movimientos generados.`);

    // Resumen final
    console.log('');
    console.log('===========================================');
    console.log(' SEEDER COMPLETADO');
    console.log('===========================================');
    console.log(`  Tienda:       1 (ID: ${tiendaId})`);
    console.log(`  Usuarios:     2 (admin + tendero)`);
    console.log(`  Productos:    ${productIds.length}`);
    console.log(`  Ventas:       ${totalVentas}`);
    console.log(`  Items venta:  ${totalItems}`);
    console.log(`  Movimientos:  ${totalMovimientos}`);
    console.log('');
    console.log('  Credenciales:');
    console.log('    Admin:   admin / admin123');
    console.log('    Tendero: tendero1 / 1234');
    console.log('===========================================');
    console.log('');

    return {
        tiendaId,
        productos: productIds.length,
        ventas: totalVentas,
        items: totalItems,
        movimientos: totalMovimientos,
    };
}

// =============================================
// EJECUCION DIRECTA (npm run seed)
// =============================================
if (require.main === module) {
    seed()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error en seeder:', err);
            process.exit(1);
        });
}

module.exports = { seed };
