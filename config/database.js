// config/database.js - ADAPTADOR POSTGRESQL (Compatibilidad SQLite)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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

module.exports = db;