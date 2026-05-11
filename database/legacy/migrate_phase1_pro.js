const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'inventario.db');
const db = new sqlite3.Database(dbPath);

console.log('Iniciando migración FASE 1 PRO...');

db.serialize(() => {
    // Añadir stock_seguridad (pueden ser unidades fijas o días, aquí usaremos unidades)
    db.run("ALTER TABLE Productos ADD COLUMN stock_seguridad INTEGER DEFAULT 0;", (err) => {
        if (err && !err.message.includes('duplicate')) {
            console.error('Error al añadir stock_seguridad:', err.message);
        } else {
            console.log('✅ Campo stock_seguridad añadido.');
        }
    });

    // Añadir lead_time (días que tarda el proveedor en entregar)
    db.run("ALTER TABLE Productos ADD COLUMN lead_time INTEGER DEFAULT 3;", (err) => {
        if (err && !err.message.includes('duplicate')) {
            console.error('Error al añadir lead_time:', err.message);
        } else {
            console.log('✅ Campo lead_time añadido.');
        }
        db.close();
    });
});
