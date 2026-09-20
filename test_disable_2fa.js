const db = require('./config/database');
const bcrypt = require('bcrypt');
require('./app'); // efecto secundario: levanta el servidor

const PORT = process.env.PORT || 3000;

async function runTest() {
    let server;
    try {
        await new Promise(r => setTimeout(r, 2000));

        // 1. Crear tienda de prueba
        await db.runAsync("INSERT INTO Tienda (nombre_establecimiento, direccion) VALUES ('Tienda Test', 'Calle 1')");
        const tienda = await db.getAsync("SELECT id_tienda FROM Tienda ORDER BY id_tienda DESC LIMIT 1");
        
        // 2. Crear usuario Tendero
        const pass = 'contrasena123';
        const hash = await bcrypt.hash(pass, 10);
        await db.runAsync("INSERT INTO Usuarios (nombres, correo, usuario, contrasena, rol, id_tienda, two_factor_enabled) VALUES ('Tendero Test', 'tendero@test.com', 'tenderotest', ?, 'Tendero', ?, false)", [hash, tienda.id_tienda]);
        
        // 3. Login
        const loginRes = await fetch(`http://localhost:${PORT}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: 'tenderotest', password: pass, force: true })
        });
        
        const loginData = await loginRes.json();
        const cookie = loginRes.headers.get('set-cookie');
        console.log('Login status:', loginRes.status, loginData);
        
        // 4. Caso 1: Sin contraseña
        const case1 = await fetch(`http://localhost:${PORT}/api/2fa/disable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
        });
        console.log('Caso 1 (Sin contraseña) - Status:', case1.status, await case1.json());
        
        // 5. Caso 2: Contraseña incorrecta
        const case2 = await fetch(`http://localhost:${PORT}/api/2fa/disable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({ password: 'malpassword' })
        });
        console.log('Caso 2 (Mala contraseña) - Status:', case2.status, await case2.json());
        
        // 6. Caso 3: Contraseña correcta
        const case3 = await fetch(`http://localhost:${PORT}/api/2fa/disable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
            body: JSON.stringify({ password: pass })
        });
        console.log('Caso 3 (Contraseña correcta) - Status:', case3.status, await case3.json());

        // Cleanup
        await db.runAsync("DELETE FROM Usuarios WHERE usuario = 'tenderotest'");
        await db.runAsync("DELETE FROM Tienda WHERE id_tienda = ?", [tienda.id_tienda]);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        if(server) server.close();
        process.exit(0);
    }
}

runTest();
