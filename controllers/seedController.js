// controllers/seedController.js
const { seed } = require('../database/seed_test_data');

class SeedController {
    /**
     * Ejecutar el seeder de datos de prueba
     * Solo accesible por administradores
     */
    static async runSeed(req, res) {
        try {
            console.log('Seeder iniciado desde la interfaz web...');
            const result = await seed();

            res.json({
                success: true,
                message: 'Datos de prueba cargados exitosamente',
                data: {
                    productos: result.productos,
                    ventas: result.ventas,
                    itemsVenta: result.items,
                    movimientos: result.movimientos,
                },
                credenciales: {
                    admin: { usuario: 'admin', contrasena: 'admin123' },
                    tendero: { usuario: 'tendero1', contrasena: '1234' },
                }
            });
        } catch (error) {
            console.error('Error ejecutando seeder:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cargar datos de prueba'
            });
        }
    }
}

module.exports = SeedController;
