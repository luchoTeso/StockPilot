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

            // 1. Asegurar que id_propietario existe en Tienda
            await pool.query(`
                ALTER TABLE Tienda 
                ADD COLUMN IF NOT EXISTS id_propietario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL;
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
                CREATE INDEX IF NOT EXISTS idx_productos_tienda ON Productos(id_tienda);
                CREATE INDEX IF NOT EXISTS idx_productos_codigo ON Productos(codigo);
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
            
            console.log('✅ Auto-migration: Esquema de Tienda e Índices de Rendimiento actualizados exitosamente.');
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