const fs = require('fs');
const http = require('http');
const FormData = require('form-data');
const path = require('path');

const targetSize = 6 * 1024 * 1024; // 6MB
const filePath = path.join(__dirname, 'dummy_large_file.csv');

console.log('Generando archivo dummy de 6MB...');

// Crear archivo CSV dummy con muchas filas
const writeStream = fs.createWriteStream(filePath);
writeStream.write('codigo,nombre,precio,costo_compra,cantidad,categoria\n');

let currentSize = 0;
let row = 1;
while (currentSize < targetSize) {
    const line = `PROD-${row},Producto de Prueba ${row},100.00,50.00,10,TestCategoria\n`;
    writeStream.write(line);
    currentSize += Buffer.byteLength(line);
    row++;
}
writeStream.end();

writeStream.on('finish', () => {
    console.log(`Archivo generado. Tamaño: ${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB`);
    console.log('Enviando petición a la API local (asegúrate de tener el servidor corriendo en el puerto 3000)...');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const request = http.request({
        method: 'POST',
        host: 'localhost',
        port: 3000,
        path: '/api/test-dos',
        headers: form.getHeaders(),
    });

    form.pipe(request);

    request.on('response', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk.toString());
        res.on('end', () => {
            console.log('\n--- RESULTADO DE LA PRUEBA ---');
            console.log(`Status Code: ${res.statusCode}`);
            if (res.statusCode === 413 || res.statusCode === 500) {
                console.log('✅ PRUEBA EXITOSA: El servidor rechazó el archivo grande.');
            } else {
                console.log('❌ PRUEBA FALLIDA: El servidor aceptó el archivo o dio una respuesta inesperada.');
            }
            console.log(`Body: ${body}`);
            console.log('------------------------------\n');
            
            // Limpiar
            fs.unlinkSync(filePath);
            console.log('Archivo dummy eliminado.');
        });
    });

    request.on('error', (err) => {
        console.error('Error conectando al servidor:', err.message);
        console.log('Por favor, asegúrate de que el backend esté en ejecución (npm start o npm run dev).');
        fs.unlinkSync(filePath);
    });
});
