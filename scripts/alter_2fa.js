const db = require('../config/database');

async function migrate() {
    try {
        console.log('Aplicando ALTER TABLE a Usuarios para 2FA...');
        await db.runAsync(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)`);
        await db.runAsync(`ALTER TABLE Usuarios ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE`);
        console.log('✅ Columnas añadidas exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error alterando la tabla:', err.message);
        process.exit(1);
    }
}

migrate();
