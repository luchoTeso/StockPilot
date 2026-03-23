// Temporary script to recreate the database
const db = require('./config/database');
const fs = require('fs');

const sql = fs.readFileSync('./database/init.sql', 'utf8');

// Execute the entire SQL file using db.exec (sqlite3)
db.exec(sql, (err) => {
    if (err) {
        console.error('Error executing SQL:', err.message);
    } else {
        console.log('✅ Database recreated successfully');
    }
    
    // Verify tables exist
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
        if (err) {
            console.error('Error listing tables:', err.message);
        } else {
            console.log('Tables created:', tables.map(t => t.name).join(', '));
        }
        
        // Verify seed data
        db.get("SELECT COUNT(*) as count FROM Usuarios", (err, row) => {
            if (err) console.error('Error counting users:', err.message);
            else console.log('Users seeded:', row.count);
            
            db.get("SELECT COUNT(*) as count FROM Tienda", (err, row) => {
                if (err) console.error('Error counting stores:', err.message);
                else console.log('Stores seeded:', row.count);
                
                db.get("SELECT COUNT(*) as count FROM Productos", (err, row) => {
                    if (err) console.error('Error counting products:', err.message);
                    else console.log('Products seeded:', row.count);
                    
                    db.close(() => {
                        console.log('Done.');
                        process.exit(0);
                    });
                });
            });
        });
    });
});
