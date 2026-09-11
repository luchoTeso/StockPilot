const db = require('../config/database');

async function migrate() {
    try {
        console.log('Iniciando migración multi-tienda...');
        
        // 1. Añadir la columna id_propietario si no existe
        console.log('1. Añadiendo columna id_propietario a Tienda...');
        await db.runAsync(`
            ALTER TABLE Tienda 
            ADD COLUMN IF NOT EXISTS id_propietario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL;
        `);

        // 2. Asignar el Administrador más antiguo como propietario de cada tienda existente
        console.log('2. Asignando propietarios a tiendas existentes...');
        await db.runAsync(`
            UPDATE Tienda t 
            SET id_propietario = (
                SELECT u.id_usuario FROM Usuarios u 
                WHERE u.id_tienda = t.id_tienda AND u.rol = 'Administrador'
                ORDER BY u.id_usuario ASC LIMIT 1
            )
            WHERE t.id_propietario IS NULL;
        `);

        console.log('Migración multi-tienda completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

migrate();
