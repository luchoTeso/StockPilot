// controllers/exportController.js
const fs = require('fs');
const path = require('path');
const excel = require('exceljs');
const Sale = require('../models/Sale');
const Report = require('../models/Report');

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

// Asegurar que la carpeta exports existe
if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

class ExportController {
    /**
     * Exporta las ventas de la tienda del usuario a CSV
     * y guarda el archivo en la carpeta exports/
     */
    static async exportSales(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const ventas = await Sale.findByStore(id_tienda);

            if (!ventas || ventas.length === 0) {
                return res.status(404).json({ success: false, error: 'No hay ventas para exportar' });
            }

            // Generar contenido Excel
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Historial de Ventas');
            
            worksheet.columns = [
                { header: 'Descripción del Producto', key: 'producto', width: 40 },
                { header: 'Categoría Comercial', key: 'categoria', width: 25 },
                { header: 'Unidades Vendidas', key: 'cantidad', width: 20 },
                { header: 'Ingreso Bruto ($)', key: 'precio_total', width: 20 },
                { header: 'Fecha de Transacción', key: 'fecha', width: 25 }
            ];
            
            // Apply header styling
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            ventas.forEach(v => {
                worksheet.addRow({
                    producto: v.nombre_producto,
                    categoria: v.categoria,
                    cantidad: v.cantidad,
                    precio_total: v.precio_total,
                    fecha: v.fecha_salida
                });
            });

            // Generar nombre de archivo con fecha y hora
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T');
            const filename = `ventas_${timestamp[0]}_${timestamp[1].substring(0, 8)}.xlsx`;
            const filePath = path.join(EXPORTS_DIR, filename);

            // Guardar archivo
            await workbook.xlsx.writeFile(filePath);

            res.json({
                success: true,
                message: `Archivo exportado correctamente`,
                filename: filename,
                path: `exports/${filename}`,
                totalRegistros: ventas.length
            });
        } catch (error) {
            console.error('Error exportando ventas:', error);
            res.status(500).json({ success: false, error: 'Error exportando ventas' });
        }
    }

    /**
     * Exporta los reportes de la tienda del usuario a CSV
     * y guarda el archivo en la carpeta exports/
     */
    static async exportReports(req, res) {
        try {
            const id_tienda = req.session.tiendaId;
            const reportes = await Report.findByStore(id_tienda);

            if (!reportes || reportes.length === 0) {
                return res.status(404).json({ success: false, error: 'No hay reportes para exportar' });
            }

            // Generar contenido CSV
            const headers = 'ID,Título,Descripción,Fecha,Creador,Tipo,Fecha de Creación\n';
            const rows = reportes.map(r => {
                const titulo = (r.titulo || '').replace(/"/g, '""');
                const descripcion = (r.descripcion || '').replace(/"/g, '""');
                const creador = (r.creador || '').replace(/"/g, '""');
                const tipo = (r.tipo || '').replace(/"/g, '""');
                return `${r.id},"${titulo}","${descripcion}","${r.fecha_reporte}","${creador}","${tipo}","${r.creado_en || ''}"`;
            }).join('\n');

            const csvContent = headers + rows;

            // Generar nombre de archivo
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T');
            const filename = `reportes_${timestamp[0]}_${timestamp[1].substring(0, 8)}.csv`;
            const filePath = path.join(EXPORTS_DIR, filename);

            // Guardar archivo
            fs.writeFileSync(filePath, '\uFEFF' + csvContent, 'utf8');

            res.json({
                success: true,
                message: `Archivo exportado correctamente`,
                filename: filename,
                path: `exports/${filename}`,
                totalRegistros: reportes.length
            });
        } catch (error) {
            console.error('Error exportando reportes:', error);
            res.status(500).json({ success: false, error: 'Error exportando reportes' });
        }
    }

    /**
     * Lista todos los archivos exportados
     */
    static async listExports(req, res) {
        try {
            const files = [];
            for (const f of fs.readdirSync(EXPORTS_DIR)) {
                if (f.endsWith('.csv') || f.endsWith('.xlsx')) {
                    const stats = fs.statSync(path.join(EXPORTS_DIR, f));
                    files.push({
                        filename: f,
                        size: (stats.size / 1024).toFixed(1) + ' KB',
                        createdAt: stats.mtime.toISOString()
                    });
                }
            }
            files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            res.json({ success: true, files });
        } catch (error) {
            console.error('Error listando archivos:', error);
            res.status(500).json({ success: false, error: 'Error listando archivos exportados' });
        }
    }

    /**
     * Descargar un archivo exportado
     */
    static async downloadExport(req, res) {
        try {
            const filename = req.params.filename;

            // Prevenir path traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({ success: false, error: 'Nombre de archivo inválido' });
            }

            const filePath = path.join(EXPORTS_DIR, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
            }

            res.download(filePath, filename);
        } catch (error) {
            console.error('Error descargando archivo:', error);
            res.status(500).json({ success: false, error: 'Error descargando archivo' });
        }
    }
}

module.exports = ExportController;
