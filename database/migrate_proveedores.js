const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'inventario.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error abriendo base de datos:", err);
        process.exit(1);
    }
});

const runMutation = (query) => {
    return new Promise((resolve, reject) => {
        db.run(query, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

async function migrate() {
    console.log("Iniciando inyección estructural para el Módulo de Proveedores e IA...");
    
    try {
        db.serialize(async () => {
            try {
                // 1. Crear Tabla Proveedores
                console.log("1. Creando tabla Proveedores...");
                await runMutation(`
                    CREATE TABLE IF NOT EXISTS Proveedores (
                        id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_tienda INTEGER NOT NULL,
                        nombre_empresa TEXT NOT NULL,
                        contacto_principal TEXT,
                        email TEXT,
                        telefono TEXT,
                        direccion TEXT,
                        calificacion INTEGER DEFAULT 5, /* Eval. 1 a 5 */
                        estado TEXT DEFAULT 'Activo',
                        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(id_tienda) REFERENCES Tiendas(id_tienda)
                    )
                `);

                // 2. Modificar Tabla Productos para ligarlos al Proveedor
                console.log("2. Modificando tabla Productos (Inyección id_proveedor)...");
                try {
                    await runMutation(`ALTER TABLE Productos ADD COLUMN id_proveedor INTEGER REFERENCES Proveedores(id_proveedor)`);
                    console.log("✓ Columna id_proveedor añadida.");
                } catch (e) {
                    if (e.message.includes('duplicate column name')) {
                        console.log("ℹ️ La columna id_proveedor ya existe. Omitiendo.");
                    } else throw e;
                }

                // 3. Crear Tabla Ordenes de Compra (Smart Cart)
                console.log("3. Creando tabla Ordenes_Compra...");
                await runMutation(`
                    CREATE TABLE IF NOT EXISTS Ordenes_Compra (
                        id_orden INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_tienda INTEGER NOT NULL,
                        id_proveedor INTEGER NOT NULL,
                        id_usuario INTEGER NOT NULL,
                        estado TEXT DEFAULT 'Borrador', /* Borrador, Aprobada, Rechazada, Completada */
                        riesgo TEXT DEFAULT 'Desconocido', /* Bajo, Medio, Alto */
                        presupuesto_total REAL DEFAULT 0,
                        notas TEXT,
                        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                        fecha_aprobacion DATETIME,
                        FOREIGN KEY(id_tienda) REFERENCES Tiendas(id_tienda),
                        FOREIGN KEY(id_proveedor) REFERENCES Proveedores(id_proveedor),
                        FOREIGN KEY(id_usuario) REFERENCES Usuarios(id_usuario)
                    )
                `);

                // 4. Crear Tabla Ordenes_Detalle (Los items dentro de la orden)
                console.log("4. Creando tabla Ordenes_Detalle...");
                await runMutation(`
                    CREATE TABLE IF NOT EXISTS Ordenes_Detalle (
                        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_orden INTEGER NOT NULL,
                        id_producto INTEGER NOT NULL,
                        cantidad_base INTEGER NOT NULL, /* Matemático Pura */
                        sugerencia_ia INTEGER,          /* Lo que dijo el oráculo */
                        cantidad_final INTEGER NOT NULL, /* Lo que se aprueba al final */
                        costo_unitario REAL,
                        FOREIGN KEY(id_orden) REFERENCES Ordenes_Compra(id_orden),
                        FOREIGN KEY(id_producto) REFERENCES Productos(id_producto)
                    )
                `);

                // 5. Tabla de Auditoría IA Extrema
                console.log("5. Creando tabla Auditoria_IA...");
                await runMutation(`
                    CREATE TABLE IF NOT EXISTS Auditoria_IA (
                        id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_tienda INTEGER NOT NULL,
                        id_orden INTEGER,
                        prompt_utilizado TEXT,
                        datos_base_json TEXT NOT NULL,
                        sugerencia_ia_json TEXT,  /* Respuesta cruda del oráculo */
                        impacto_decision TEXT,    /* Ej. +20% Aplicado */
                        razon_ia TEXT,
                        fecha_auditoria DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(id_tienda) REFERENCES Tiendas(id_tienda),
                        FOREIGN KEY(id_orden) REFERENCES Ordenes_Compra(id_orden)
                    )
                `);

                console.log("✅ Migración Fase 1 completada con Éxito Supremo.");
                db.close();
            } catch (err) {
                console.error("❌ Error ejecutando migración SQlite:", err);
                db.close();
                process.exit(1);
            }
        });
    } catch (globalErr) {
        console.error("Error Global:", globalErr);
        process.exit(1);
    }
}

migrate();
