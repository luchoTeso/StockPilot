// controllers/reportController.js
const Report = require('../models/Report');
const excel = require('exceljs');
const db = require('../config/database');

class ReportController {
    static async createReport(req, res) {
        try {
            const { titulo, descripcion, fecha_reporte, creador, tipo, fecha_inicio, fecha_fin, force } = req.body;
            const id_tienda = req.session.tiendaId; // Fix #19

            if (!titulo || !descripcion || !fecha_reporte || !creador || !tipo) {
                return res.status(400).json({ success: false, error: "Todos los campos obligatorios deben estar presentes" });
            }

            // PRE-VALIDACION: Bloquear guardado si el rango de fechas no tiene datos
            let validationQuery = null;
            let validationParams = [id_tienda];
            const hasDates = fecha_inicio && fecha_fin;

            if (tipo === 'Inventario' && hasDates) {
                validationQuery = `SELECT COUNT(*) as count FROM Productos WHERE id_tienda = ? AND DATE(fecha_entrada) BETWEEN ? AND ?`;
                validationParams.push(fecha_inicio, fecha_fin);
            } else if (tipo === 'Ventas' && hasDates) {
                validationQuery = `SELECT COUNT(*) as count FROM Ventas WHERE id_tienda = ? AND DATE(fecha_salida) BETWEEN ? AND ?`;
                validationParams.push(fecha_inicio, fecha_fin);
            } else if ((tipo === 'Operativo' || tipo === 'Financiero') && hasDates) {
                validationQuery = `
                    SELECT COUNT(m.id_movimiento) as count 
                    FROM MovimientosStock m
                    JOIN Productos p ON m.id_producto = p.id_producto
                    WHERE p.id_tienda = ? AND DATE(m.fecha_movimiento) BETWEEN ? AND ?
                `;
                validationParams.push(fecha_inicio, fecha_fin);
            }

            if (validationQuery && !force) {
                const check = await db.getAsync(validationQuery, validationParams);
                if (!check || check.count === 0) {
                    return res.status(409).json({ 
                        success: false, 
                        requireConfirmation: true,
                        error: `Atención: No hay registros de movimientos para ${tipo} entre el ${fecha_inicio} y el ${fecha_fin}.\nEl documento de Excel descargable estará vacío.\n\n¿Desea crear este reporte de todos modos?` 
                    });
                }
            }

            const reportId = await Report.create({
                titulo,
                descripcion,
                fecha_reporte,
                creador,
                tipo,
                fecha_inicio,
                fecha_fin,
                id_tienda
            });

            res.json({ success: true, id: reportId });
        } catch (error) {
            console.error('Error creando reporte:', error);
            res.status(500).json({ success: false, error: "Error guardando reporte" });
        }
    }

    static async getReports(req, res) {
        try {
            const id_tienda = req.session.tiendaId; // Fix #19
            const reportes = await Report.findByStore(id_tienda);
            res.json(reportes);
        } catch (error) {
            console.error('Error obteniendo reportes:', error);
            res.status(500).json({ success: false, error: "No se pudieron obtener los reportes" });
        }
    }

    static async updateReport(req, res) {
        try {
            const reportId = req.params.id;
            const { titulo, descripcion, fecha_reporte, creador, tipo, fecha_inicio, fecha_fin, force } = req.body;
            const id_tienda = req.session.tiendaId; // Fix #19

            // PRE-VALIDACION: Bloquear guardado si el rango de fechas no tiene datos
            let validationQuery = null;
            let validationParams = [id_tienda];
            const hasDates = fecha_inicio && fecha_fin;

            if (tipo === 'Inventario' && hasDates) {
                validationQuery = `SELECT COUNT(*) as count FROM Productos WHERE id_tienda = ? AND DATE(fecha_entrada) BETWEEN ? AND ?`;
                validationParams.push(fecha_inicio, fecha_fin);
            } else if (tipo === 'Ventas' && hasDates) {
                validationQuery = `SELECT COUNT(*) as count FROM Ventas WHERE id_tienda = ? AND DATE(fecha_salida) BETWEEN ? AND ?`;
                validationParams.push(fecha_inicio, fecha_fin);
            } else if ((tipo === 'Operativo' || tipo === 'Financiero') && hasDates) {
                validationQuery = `
                    SELECT COUNT(m.id_movimiento) as count 
                    FROM MovimientosStock m
                    JOIN Productos p ON m.id_producto = p.id_producto
                    WHERE p.id_tienda = ? AND DATE(m.fecha_movimiento) BETWEEN ? AND ?
                `;
                validationParams.push(fecha_inicio, fecha_fin);
            }

            if (validationQuery && !force) {
                const check = await db.getAsync(validationQuery, validationParams);
                if (!check || check.count === 0) {
                    return res.status(409).json({ 
                        success: false, 
                        requireConfirmation: true,
                        error: `Atención: No hay registros de movimientos para ${tipo} entre el ${fecha_inicio} y el ${fecha_fin}.\nEl documento de Excel descargable estará vacío.\n\n¿Desea guardar esta edición de todos modos?` 
                    });
                }
            }

            const success = await Report.update(reportId, {
                titulo,
                descripcion,
                fecha_reporte,
                creador,
                tipo,
                fecha_inicio,
                fecha_fin
            });

            if (!success) {
                return res.status(404).json({ success: false, error: "Reporte no encontrado" });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error actualizando reporte:', error);
            res.status(500).json({ success: false, error: "Error actualizando reporte" });
        }
    }

    static async deleteReport(req, res) {
        try {
            const reportId = req.params.id;
            const success = await Report.delete(reportId);

            if (!success) {
                return res.status(404).json({ success: false, error: "Reporte no encontrado" });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error eliminando reporte:', error);
            res.status(500).json({ success: false, error: "Error eliminando el reporte" });
        }
    }

    static async downloadReport(req, res) {
        try {
            const reportId = req.params.id;
            const reporte = await Report.findById(reportId);
            
            if (!reporte) {
                return res.status(404).json({ success: false, error: "Reporte no encontrado" });
            }

            const workbook = new excel.Workbook();
            workbook.creator = reporte.creador;
            workbook.created = new Date();
            const sheet = workbook.addWorksheet(reporte.tipo || 'Reporte');

            let query = '';
            let params = [req.session.tiendaId];
            
            // Fechas seguras para SQL query (usando DATE nativo)
            const hasDates = reporte.fecha_inicio && reporte.fecha_fin;

            if (reporte.tipo === 'Inventario') {
                sheet.columns = [
                    { header: 'ID Gen.', key: 'id_producto', width: 10 },
                    { header: 'Código', key: 'codigo', width: 15 },
                    { header: 'Nombre del Producto', key: 'nombre_producto', width: 35 },
                    { header: 'Categoría', key: 'categoria', width: 20 },
                    { header: 'Costo Compra', key: 'costo_compra', width: 15 },
                    { header: 'Precio Venta', key: 'precio', width: 15 },
                    { header: 'Stock Actual', key: 'cantidad', width: 15 },
                    { header: 'F. Vencimiento', key: 'fecha_vencimiento', width: 20 },
                    { header: 'Estado', key: 'estado', width: 15 }
                ];
                query = `SELECT * FROM Productos WHERE id_tienda = ?`;
                
                if (hasDates) {
                    query += ` AND DATE(fecha_entrada) BETWEEN ? AND ?`;
                    params.push(reporte.fecha_inicio, reporte.fecha_fin);
                }
            } else if (reporte.tipo === 'Ventas') {
                sheet.columns = [
                    { header: 'Recibo / Venta', key: 'id_venta', width: 15 },
                    { header: 'F. Transacción', key: 'fecha_salida', width: 25 },
                    { header: 'Producto Vendido', key: 'producto', width: 35 },
                    { header: 'Cant. Items', key: 'cantidad_items', width: 15 },
                    { header: 'Precio Ud. ($)', key: 'precio_unitario', width: 15 },
                    { header: 'Subtotal Producto ($)', key: 'subtotal', width: 20 },
                    { header: 'Gran Total Recibo ($)', key: 'precio_total', width: 20 },
                    { header: 'Vendedor Responsable', key: 'nombres', width: 25 }
                ];
                query = `
                    SELECT v.id_venta, v.fecha_salida, p.nombre_producto as producto, vp.cantidad as cantidad_items, 
                           p.precio as precio_unitario, (vp.cantidad * p.precio) as subtotal, v.precio_total, u.nombres
                    FROM Ventas v
                    JOIN VentasProductos vp ON v.id_venta = vp.id_venta
                    JOIN Productos p ON vp.id_producto = p.id_producto
                    LEFT JOIN Usuarios u ON v.id_vendedor = u.id_usuario
                    WHERE v.id_tienda = ?
                `;
                
                if (hasDates) {
                    query += ` AND DATE(v.fecha_salida) BETWEEN ? AND ?`;
                    params.push(reporte.fecha_inicio, reporte.fecha_fin);
                }
                query += ` ORDER BY v.fecha_salida DESC`;
            } else if (reporte.tipo === 'Operativo' || reporte.tipo === 'Financiero') {
                sheet.columns = [
                    { header: 'ID Mov.', key: 'id_movimiento', width: 12 },
                    { header: 'Producto Modificado', key: 'producto', width: 35 },
                    { header: 'Fluctuación', key: 'tipo_movimiento', width: 20 },
                    { header: 'Cant. Alterada', key: 'cantidad', width: 15 },
                    { header: 'Balance Stock Final', key: 'stock_despues', width: 20 },
                    { header: 'Fecha de Registro', key: 'fecha_movimiento', width: 25 },
                    { header: 'Motivo Técnico', key: 'motivo', width: 30 },
                    { header: 'Operario', key: 'nombres', width: 25 }
                ];
                query = `
                    SELECT m.*, p.nombre_producto as producto, u.nombres 
                    FROM MovimientosStock m
                    JOIN Productos p ON m.id_producto = p.id_producto
                    LEFT JOIN Usuarios u ON m.id_usuario = u.id_usuario
                    WHERE p.id_tienda = ?
                `;
                if (hasDates) {
                    query += ` AND DATE(m.fecha_movimiento) BETWEEN ? AND ?`;
                    params.push(reporte.fecha_inicio, reporte.fecha_fin);
                }
                query += ` ORDER BY m.fecha_movimiento DESC`;
            } else {
                sheet.columns = [{ header: 'Nota', key: 'nota', width: 50 }];
                sheet.addRow({ nota: 'Los reportes genéricos no tienen un volcado de tabla asignado.' });
            }

            if (query) {
                const data = await db.allAsync(query, params);
                data.forEach(row => sheet.addRow(row));
            }

            // UI del documento Excel (Cabecera color violeta acorde a la app)
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Reporte_${reporte.tipo}_${reporte.fecha_reporte}.xlsx"`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Error generando archivo Excel:', error);
            res.status(500).json({ success: false, error: "Fallo al generar el archivo Excel" });
        }
    }
}

module.exports = ReportController;