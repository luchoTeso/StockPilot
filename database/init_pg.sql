-- ==========================================
-- STOCKPILOT - ESQUEMA POSTGRESQL COMPLETO
-- ==========================================

-- 0. Limpieza (Opcional, útil para desarrollo)
-- DROP TABLE IF EXISTS session CASCADE;
-- DROP TABLE IF EXISTS Alertas CASCADE;
-- DROP TABLE IF EXISTS Feedback_IA CASCADE;
-- DROP TABLE IF EXISTS Auditoria_IA CASCADE;
-- DROP TABLE IF EXISTS reportes CASCADE;
-- DROP TABLE IF EXISTS VentasProductos CASCADE;
-- DROP TABLE IF EXISTS Ventas CASCADE;
-- DROP TABLE IF EXISTS MovimientosStock CASCADE;
-- DROP TABLE IF EXISTS Historial_Precios CASCADE;
-- DROP TABLE IF EXISTS Ordenes_Detalle CASCADE;
-- DROP TABLE IF EXISTS Ordenes_Compra CASCADE;
-- DROP TABLE IF EXISTS Productos CASCADE;
-- DROP TABLE IF EXISTS Proveedores CASCADE;
-- DROP TABLE IF EXISTS Usuarios CASCADE;
-- DROP TABLE IF EXISTS Tienda CASCADE;

-- 1. TABLA TIENDA
CREATE TABLE IF NOT EXISTS Tienda (
    id_tienda SERIAL PRIMARY KEY,
    nombre_establecimiento VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    anio_creacion INTEGER,
    estado VARCHAR(50) DEFAULT 'Activo',
    documento VARCHAR(50),
    razon_social VARCHAR(255),
    celular VARCHAR(20),
    ciudad VARCHAR(100),
    id_propietario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL
);

-- 2. TABLA USUARIOS
CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombres VARCHAR(255) NOT NULL,
    genero VARCHAR(50),
    correo VARCHAR(255) UNIQUE NOT NULL,
    celular VARCHAR(20),
    rol VARCHAR(50) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_tienda INTEGER NOT NULL REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    session_id VARCHAR(255),
    foto_url TEXT,
    cambio_clave_forzoso BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_expires VARCHAR(100)
);

-- 3. TABLA PROVEEDORES
CREATE TABLE IF NOT EXISTS Proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL,
    nit VARCHAR(50) UNIQUE,
    contacto_nombre VARCHAR(255),
    contacto_principal VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(255),
    email VARCHAR(255),
    direccion TEXT,
    id_tienda INTEGER NOT NULL REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS Productos (
    id_producto SERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    tipo_producto VARCHAR(100),
    precio NUMERIC(15, 2) DEFAULT 0,
    cantidad INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER DEFAULT 200,
    stock_seguridad INTEGER DEFAULT 0,
    lead_time INTEGER DEFAULT 3,
    fecha_entrada DATE DEFAULT CURRENT_DATE,
    fecha_salida TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) DEFAULT 'Disponible',
    id_tienda INTEGER REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    id_proveedor INTEGER REFERENCES Proveedores(id_proveedor) ON DELETE SET NULL,
    fecha_vencimiento DATE,
    frecuencia_compra_dias INTEGER DEFAULT 7,
    costo_compra NUMERIC(15, 2) DEFAULT 0,
    clasificacion_abc VARCHAR(1) DEFAULT 'C',
    precio_original NUMERIC(15, 2),
    fecha_fin_promocion DATE
);

-- 5. TABLA MOVIMIENTOS DE STOCK
CREATE TABLE IF NOT EXISTS MovimientosStock (
    id_movimiento SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES Productos(id_producto) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(50) NOT NULL, -- 'Entrada', 'Salida', 'Ajuste'
    cantidad INTEGER NOT NULL,
    stock_final INTEGER,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
    id_tienda INTEGER REFERENCES Tienda(id_tienda) ON DELETE CASCADE
);

-- 6. TABLA VENTAS
CREATE TABLE IF NOT EXISTS Ventas (
    id_venta SERIAL PRIMARY KEY,
    id_vendedor INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    id_tienda INTEGER NOT NULL REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    fecha_salida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    precio_total NUMERIC(15, 2) NOT NULL
);

-- 7. TABLA VENTAS-PRODUCTOS
CREATE TABLE IF NOT EXISTS VentasProductos (
    id SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL REFERENCES Ventas(id_venta) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES Productos(id_producto) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(15, 2)
);

-- 8. TABLA ORDENES DE COMPRA
CREATE TABLE IF NOT EXISTS Ordenes_Compra (
    id_orden SERIAL PRIMARY KEY,
    id_tienda INTEGER NOT NULL REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    id_proveedor INTEGER NOT NULL REFERENCES Proveedores(id_proveedor) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) DEFAULT 'Borrador', -- 'Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Completada'
    total_estimado NUMERIC(15, 2) DEFAULT 0,
    presupuesto_total NUMERIC(15, 2) DEFAULT 0,
    monto_pagado NUMERIC(15, 2) DEFAULT 0,
    estado_pago VARCHAR(50) DEFAULT 'Pendiente',
    riesgo VARCHAR(50) DEFAULT 'Bajo',
    notas TEXT,
    observaciones TEXT
);

-- 9. TABLA ORDENES DETALLE
CREATE TABLE IF NOT EXISTS Ordenes_Detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_orden INTEGER NOT NULL REFERENCES Ordenes_Compra(id_orden) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES Productos(id_producto) ON DELETE CASCADE,
    cantidad_sugerida INTEGER,
    cantidad_final INTEGER,
    costo_unitario NUMERIC(15, 2),
    sugerencia_ia INTEGER
);

-- 10. TABLA ALERTAS
CREATE TABLE IF NOT EXISTS Alertas (
    id_alerta SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES Productos(id_producto) ON DELETE CASCADE,
    id_tienda INTEGER REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    tipo VARCHAR(50),
    severidad VARCHAR(50),
    mensaje TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resuelta INTEGER DEFAULT 0,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    datos_json TEXT
);

-- 11. TABLA AUDITORIA IA
CREATE TABLE IF NOT EXISTS Auditoria_IA (
    id_auditoria SERIAL PRIMARY KEY,
    fecha_auditoria TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_tienda INTEGER REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    id_orden INTEGER REFERENCES Ordenes_Compra(id_orden) ON DELETE SET NULL,
    motor_ia VARCHAR(100) DEFAULT 'gpt-4o-mini',
    prompt_utilizado TEXT,
    datos_base_json TEXT,
    sugerencia_ia_json TEXT,
    impacto_decision TEXT,
    razon_ia TEXT
);

-- 12. TABLA FEEDBACK IA
CREATE TABLE IF NOT EXISTS Feedback_IA (
    id_feedback SERIAL PRIMARY KEY,
    id_orden INTEGER NOT NULL REFERENCES Ordenes_Compra(id_orden) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES Productos(id_producto) ON DELETE CASCADE,
    cantidad_sugerida INTEGER,
    ventas_reales_periodo INTEGER,
    factor_precision NUMERIC(10, 4),
    dias_con_stock INTEGER DEFAULT 0,
    error_absoluto NUMERIC(10, 4),
    error_porcentual NUMERIC(10, 4),
    bias NUMERIC(10, 4),
    fecha_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. TABLA HISTORIAL PRECIOS
CREATE TABLE IF NOT EXISTS Historial_Precios (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES Productos(id_producto) ON DELETE CASCADE,
    precio_anterior NUMERIC(15, 2),
    precio_nuevo NUMERIC(15, 2),
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT
);

-- 14. TABLA REPORTES
CREATE TABLE IF NOT EXISTS reportes (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_reporte DATE NOT NULL,
    creador VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    id_tienda INTEGER REFERENCES Tienda(id_tienda) ON DELETE CASCADE,
    fecha_inicio DATE,
    fecha_fin DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. CACHÉ IA PERSISTENTE (sobrevive reinicios de Railway)
CREATE TABLE IF NOT EXISTS Cache_IA (
    clave VARCHAR(64) PRIMARY KEY,
    data_hash VARCHAR(32) NOT NULL,
    datos_json TEXT NOT NULL,
    actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. TABLA SESIONES (connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ==========================================
-- 17. ÍNDICES DE RENDIMIENTO MULTI-TIENDA
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_productos_tienda ON Productos(id_tienda);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON Productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_tienda_estado ON Productos(id_tienda, estado);
CREATE INDEX IF NOT EXISTS idx_productos_tienda_nombre ON Productos(id_tienda, nombre_producto);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON Productos(id_proveedor);

CREATE INDEX IF NOT EXISTS idx_ventas_tienda ON Ventas(id_tienda);
CREATE INDEX IF NOT EXISTS idx_ventas_tienda_fecha ON Ventas(id_tienda, fecha_salida DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON Ventas(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_ventasprod_venta ON VentasProductos(id_venta);
CREATE INDEX IF NOT EXISTS idx_ventasprod_producto ON VentasProductos(id_producto);

CREATE INDEX IF NOT EXISTS idx_movimientos_tienda_fecha ON MovimientosStock(id_tienda, fecha_movimiento DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON MovimientosStock(id_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON MovimientosStock(id_usuario);

CREATE INDEX IF NOT EXISTS idx_alertas_tienda_resuelta ON Alertas(id_tienda, resuelta);
CREATE INDEX IF NOT EXISTS idx_alertas_tienda_fecha ON Alertas(id_tienda, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_producto ON Alertas(id_producto);

CREATE INDEX IF NOT EXISTS idx_ordenes_tienda ON Ordenes_Compra(id_tienda);
CREATE INDEX IF NOT EXISTS idx_ordenes_detalle_orden ON Ordenes_Detalle(id_orden);
CREATE INDEX IF NOT EXISTS idx_proveedores_tienda ON Proveedores(id_tienda);

CREATE INDEX IF NOT EXISTS idx_tienda_propietario ON Tienda(id_propietario);
CREATE INDEX IF NOT EXISTS idx_usuarios_tienda ON Usuarios(id_tienda);
CREATE INDEX IF NOT EXISTS idx_historial_producto ON Historial_Precios(id_producto);
CREATE INDEX IF NOT EXISTS idx_reportes_tienda ON reportes(id_tienda);
CREATE INDEX IF NOT EXISTS idx_auditoria_ia_tienda ON Auditoria_IA(id_tienda);

-- ==========================================
-- DATOS SEMILLA (Adaptados a ON CONFLICT)
-- ==========================================

INSERT INTO Tienda (id_tienda, nombre_establecimiento, direccion, anio_creacion, estado)
VALUES (1, 'Supermercado Central', 'Cra 12 # 8-90', 2018, 'Activo')
ON CONFLICT (id_tienda) DO NOTHING;

INSERT INTO Usuarios (id_usuario, nombres, genero, correo, celular, rol, usuario, contrasena, id_tienda)
VALUES (1, 'Carlos Pérez', 'Masculino', 'carlos@mail.com', '3001234567', 'Tendero', 'carlos', '$2b$10$5QFG27VJIG2OmYFHDAc8u.Wjt4IeZW6j30grtaep43RcxIKhp0S2G', 1)
ON CONFLICT (id_usuario) DO NOTHING;

-- ==========================================
-- SINCRONIZAR SECUENCIAS SERIAL
-- Necesario cuando se insertan filas con IDs explícitos: sin esto,
-- el próximo INSERT automático intenta usar id=1 y choca con duplicado.
-- ==========================================
SELECT setval(pg_get_serial_sequence('Tienda', 'id_tienda'), MAX(id_tienda)) FROM Tienda;
SELECT setval(pg_get_serial_sequence('Usuarios', 'id_usuario'), MAX(id_usuario)) FROM Usuarios;
