const db = require('./config/database');

async function audit() {
    try {
        console.log('--- AUDITORÍA DE ESQUEMA REAL ---');
        
        const tables = ['Productos', 'Ventas', 'VentasProductos', 'MovimientosStock'];
        
        for (const table of tables) {
            console.log(`\nTabla: ${table}`);
            const columns = await db.allAsync(`PRAGMA table_info(${table})`);
            columns.forEach(col => {
                console.log(` - ${col.name} (${col.type})`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

audit();
