// config/database.js - ADAPTADOR POSTGRESQL (Compatibilidad SQLite)
require('dotenv').config();
const { Pool } = require('pg');

const isNeon = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 25,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // 20 segundos para tolerar cold starts de Neon Serverless
    ssl: (process.env.NODE_ENV === 'production' || isNeon) ? { rejectUnauthorized: false } : false
});

const bogotaDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' });

/**
 * Traductor seguro de placeholders para PostgreSQL
 * Convierte '?' en '$1', '$2', etc., respetando comillas simples para evitar
 * romper literales de texto que contengan signos de interrogación.
 */
function translateSQL(sql) {
    let index = 1;
    let inString = false;
    let result = '';

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        // Detectar si estamos dentro de una cadena literal (comillas simples)
        if (char === "'" && (i === 0 || sql[i-1] !== '\\')) {
            inString = !inString;
        }
        
        if (char === '?' && !inString) {
            result += `$${index++}`;
        } else {
            result += char;
        }
    }
    return result;
}

const db = {
    /**
     * Ejecuta una query que devuelve múltiples filas (allAsync)
     */
    allAsync: async function(sql, params = []) {
        const pgSql = translateSQL(sql);
        try {
            const result = await pool.query(pgSql, params);
            return result.rows;
        } catch (error) {
            console.error('❌ PG allAsync Error:', { sql: pgSql, error: error.message });
            throw error;
        }
    },

    /**
     * Ejecuta una query que devuelve una sola fila (getAsync)
     */
    getAsync: async function(sql, params = []) {
        const pgSql = translateSQL(sql);
        try {
            const result = await pool.query(pgSql, params);
            return result.rows[0];
        } catch (error) {
            console.error('❌ PG getAsync Error:', { sql: pgSql, error: error.message });
            throw error;
        }
    },

    /**
     * Ejecuta una query de modificación (runAsync)
     * Simula el comportamiento de SQLite devolviendo lastID y changes.
     */
    runAsync: async function(sql, params = []) {
        let pgSql = translateSQL(sql);
        const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
        
        // Inyección de RETURNING para emular lastID de SQLite
        if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
            pgSql += ' RETURNING *';
        }

        try {
            const result = await pool.query(pgSql, params);
            
            // Simular objeto de resultado de SQLite
            // Buscamos el primer campo de la primera fila si fue un INSERT
            let lastID = null;
            if (isInsert && result.rows.length > 0) {
                const firstRow = result.rows[0];
                // Intentamos encontrar una columna que parezca ID (id_..., id, o la primera)
                const idKey = Object.keys(firstRow).find(k => k.toLowerCase().startsWith('id')) || Object.keys(firstRow)[0];
                lastID = firstRow[idKey];
            }

            return {
                lastID: lastID,
                changes: result.rowCount
            };
        } catch (error) {
            console.error('❌ PG runAsync Error:', { sql: pgSql, error: error.message });
            throw error;
        }
    },

    /**
     * Retorna la fecha actual en formato YYYY-MM-DD ajustada a Bogotá
     */
    getBogotaDate: function() {
        return bogotaDateFormatter.format(new Date());
    },

    /**
     * Obtiene un cliente dedicado del pool para transacciones
     * Retorna un objeto con la misma interfaz para evitar romper lógica compleja.
     */
    getClient: async function() {
        const client = await pool.connect();
        
        // Envolver el cliente para que soporte translateSQL automáticamente
        const wrappedClient = {
            query: async (sql, params = []) => {
                return await client.query(translateSQL(sql), params);
            },
            release: () => client.release()
        };
        
        return wrappedClient;
    },

    // Exportar el pool por si se necesita acceso directo (ej: Session Store)
    pool: pool
};

// -----------------------------------------------------------------------------
// AUTO-MIGRACIÓN PARA PRODUCCIÓN (RENDER + NEON SERVERLESS)
// Evita que la app falle si el usuario olvida correr los scripts de migración.
// Incluye reintentos automáticos para tolerar cold starts de Neon.
// -----------------------------------------------------------------------------
(async function autoMigrate() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`⏳ Auto-migration: Verificando esquema en Neon/PostgreSQL (intento ${attempt}/${maxRetries})...`);

            // 1. Asegurar que id_propietario y limite_egreso_tendero existen en Tienda
            await pool.query(`
                ALTER TABLE Tienda 
                ADD COLUMN IF NOT EXISTS id_propietario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS limite_egreso_tendero NUMERIC(15, 2) DEFAULT 150000;
            `);
            
            // 2. Asignar el administrador principal como propietario de las tiendas que no tengan uno
            await pool.query(`
                UPDATE Tienda t
                SET id_propietario = (
                    SELECT id_usuario FROM Usuarios u 
                    WHERE u.id_tienda = t.id_tienda AND u.rol = 'Administrador' 
                    ORDER BY u.id_usuario ASC LIMIT 1
                )
                WHERE t.id_propietario IS NULL;
            `);

            // 3. Crear índices de rendimiento si no existen (Optimizaciones Fase 1)
            await pool.query(`
                ALTER TABLE Productos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(50);
                ALTER TABLE Productos ALTER COLUMN codigo DROP NOT NULL;
                
                CREATE INDEX IF NOT EXISTS idx_productos_tienda ON Productos(id_tienda);
                CREATE INDEX IF NOT EXISTS idx_productos_codigo ON Productos(codigo);
                CREATE INDEX IF NOT EXISTS idx_productos_barcode ON Productos(codigo_barras);
                CREATE INDEX IF NOT EXISTS idx_productos_tienda_estado ON Productos(id_tienda, estado);
                CREATE INDEX IF NOT EXISTS idx_productos_tienda_nombre ON Productos(id_tienda, nombre_producto);
                CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON Productos(id_proveedor);
                
                CREATE INDEX IF NOT EXISTS idx_ventas_tienda ON Ventas(id_tienda);
                CREATE INDEX IF NOT EXISTS idx_ventas_tienda_fecha ON Ventas(id_tienda, fecha_salida DESC);
                CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON Ventas(id_vendedor);
                CREATE INDEX IF NOT EXISTS idx_ventasprod_venta ON VentasProductos(id_venta);
                CREATE INDEX IF NOT EXISTS idx_ventasprod_producto ON VentasProductos(id_producto);
                
                CREATE INDEX IF NOT EXISTS idx_movimientos_tienda_fecha ON MovimientosStock(id_tienda, fecha_movimiento DESC);
                CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON MovimientosStock(id_producto);
                CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON MovimientosStock(id_usuario);
                
                CREATE INDEX IF NOT EXISTS idx_alertas_tienda_resuelta ON Alertas(id_tienda, resuelta);
                CREATE INDEX IF NOT EXISTS idx_alertas_tienda_fecha ON Alertas(id_tienda, fecha_creacion DESC);
                CREATE INDEX IF NOT EXISTS idx_alertas_producto ON Alertas(id_producto);
                
                CREATE INDEX IF NOT EXISTS idx_ordenes_tienda ON Ordenes_Compra(id_tienda);
                CREATE INDEX IF NOT EXISTS idx_ordenes_detalle_orden ON Ordenes_Detalle(id_orden);
                CREATE INDEX IF NOT EXISTS idx_proveedores_tienda ON Proveedores(id_tienda);
                
                CREATE INDEX IF NOT EXISTS idx_tienda_propietario ON Tienda(id_propietario);
                CREATE INDEX IF NOT EXISTS idx_usuarios_tienda ON Usuarios(id_tienda);
                CREATE INDEX IF NOT EXISTS idx_historial_producto ON Historial_Precios(id_producto);
                CREATE INDEX IF NOT EXISTS idx_reportes_tienda ON reportes(id_tienda);
                CREATE INDEX IF NOT EXISTS idx_auditoria_ia_tienda ON Auditoria_IA(id_tienda);
            `);
            
            // 4. Asegurar columnas de 2FA en Usuarios
            await pool.query(`
                ALTER TABLE Usuarios 
                ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
                ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS foto_url TEXT,
                ADD COLUMN IF NOT EXISTS cambio_clave_forzoso BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
                ADD COLUMN IF NOT EXISTS reset_expires VARCHAR(100);
            `);

            // 5. Asegurar esquema para Arqueo de Caja y Facturación POS (Fase 1 y 2)
            await pool.query(`
                CREATE TABLE IF NOT EXISTS SesionCaja (
                    id_sesion SERIAL PRIMARY KEY,
                    id_tienda INTEGER NOT NULL REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
                    id_vendedor INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
                    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fecha_cierre TIMESTAMP,
                    monto_apertura DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                    monto_cierre_declarado DECIMAL(12, 2),
                    monto_cierre_calculado DECIMAL(12, 2),
                    diferencia DECIMAL(12, 2),
                    estado VARCHAR(20) DEFAULT 'ABIERTA',
                    observaciones TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_sesioncaja_tienda_vendedor ON SesionCaja(id_tienda, id_vendedor, estado);

                ALTER TABLE Ventas 
                ADD COLUMN IF NOT EXISTS id_sesion_caja INTEGER REFERENCES SesionCaja(id_sesion) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
                ADD COLUMN IF NOT EXISTS efectivo_recibido DECIMAL(12, 2),
                ADD COLUMN IF NOT EXISTS cambio_devuelto DECIMAL(12, 2),
                ADD COLUMN IF NOT EXISTS id_cliente INTEGER REFERENCES Clientes(id_cliente) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS estado_deuda VARCHAR(50) DEFAULT 'Pagado';

                CREATE INDEX IF NOT EXISTS idx_ventas_sesion_caja ON Ventas(id_sesion_caja);
            `);
            // 6. Asegurar tabla EgresosCaja (Fase 3 - Flujo de Caja Menor)
            await pool.query(`
                CREATE TABLE IF NOT EXISTS EgresosCaja (
                    id_egreso SERIAL PRIMARY KEY,
                    id_sesion_caja INTEGER NOT NULL REFERENCES SesionCaja(id_sesion) ON DELETE CASCADE,
                    id_tienda INTEGER NOT NULL REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
                    id_usuario INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
                    monto NUMERIC(15, 2) NOT NULL,
                    motivo TEXT NOT NULL,
                    categoria VARCHAR(50) DEFAULT 'Otro',
                    foto_soporte TEXT,
                    estado VARCHAR(50) DEFAULT 'Registrado',
                    aprobado_por INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
                    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
                    notas_admin TEXT,
                    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                -- Asegurar que la columna notas_admin exista en BDs antiguas
                ALTER TABLE EgresosCaja ADD COLUMN IF NOT EXISTS notas_admin TEXT;

                CREATE INDEX IF NOT EXISTS idx_egresos_sesion ON EgresosCaja(id_sesion_caja);
                CREATE INDEX IF NOT EXISTS idx_egresos_tienda ON EgresosCaja(id_tienda);
            `);

            // 7. Asegurar tabla NotificacionesUsuario (notificaciones dirigidas a usuarios)
            await pool.query(`
                CREATE TABLE IF NOT EXISTS NotificacionesUsuario (
                    id_notificacion SERIAL PRIMARY KEY,
                    id_usuario INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
                    id_tienda INTEGER REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
                    tipo VARCHAR(50) NOT NULL,
                    titulo VARCHAR(255) NOT NULL,
                    mensaje TEXT NOT NULL,
                    datos_json TEXT,
                    leida INTEGER DEFAULT 0,
                    fecha_lectura TIMESTAMP WITH TIME ZONE,
                    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_notif_usuario ON NotificacionesUsuario(id_usuario, leida);
            `);

            // 7. Asegurar tabla Promociones Manuales (Human-in-the-Loop)
            await pool.query(`
                CREATE TABLE IF NOT EXISTS Promociones_Manuales (
                    id_promocion SERIAL PRIMARY KEY,
                    id_producto INTEGER NOT NULL REFERENCES Productos(id_producto) ON DELETE CASCADE,
                    id_tienda INTEGER NOT NULL REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
                    descuento_porcentaje NUMERIC(5, 2) NOT NULL,
                    precio_anterior NUMERIC(15, 2),
                    precio_nuevo NUMERIC(15, 2),
                    motivo VARCHAR(255),
                    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            
            console.log('✅ Auto-migration: Esquema de Tienda, Usuarios (2FA), Índices, SesionCaja POS, EgresosCaja, NotificacionesUsuario y Promociones_Manuales actualizados exitosamente.');
            return; // Éxito, salir de la función
        } catch (err) {
            console.warn(`⚠️ Auto-migration intento ${attempt}/${maxRetries} falló:`, err.message);
            if (attempt === maxRetries) {
                console.error('❌ Auto-migration error definitivo:', err.message);
            } else {
                // Esperar 3 segundos para que Neon termine su cold-start
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
})();

module.exports = db;