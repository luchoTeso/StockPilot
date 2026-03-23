-- ==========================================
-- ESQUEMA DE BASE DE DATOS - INVENTARIO
-- ==========================================
-- Orden correcto: dependencias primero
-- Usar CREATE TABLE IF NOT EXISTS para seguridad

PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. TABLA TIENDA / ESTABLECIMIENTO (sin dependencias)
-- ==========================================
CREATE TABLE IF NOT EXISTS Tienda (
    id_tienda INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_establecimiento TEXT NOT NULL,
    direccion TEXT,
    anio_creacion INTEGER,
    estado TEXT DEFAULT 'Activo',
    documento TEXT,
    razon_social TEXT,
    celular TEXT,
    ciudad TEXT
);

-- ==========================================
-- 2. TABLA USUARIOS (depende de Tienda)
-- ==========================================
CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres TEXT NOT NULL,
    genero TEXT,
    correo TEXT UNIQUE NOT NULL,
    celular TEXT,
    rol TEXT NOT NULL,
    usuario TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    fecha_registro TEXT DEFAULT (DATE('now')),
    id_tienda INTEGER NOT NULL,
    FOREIGN KEY (id_tienda) REFERENCES Tienda(id_tienda)
);

-- ==========================================
-- 3. TABLA PRODUCTOS (depende de Tienda)
-- ==========================================
CREATE TABLE IF NOT EXISTS Productos (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL,
    nombre_producto TEXT NOT NULL,
    categoria TEXT,
    subcategoria TEXT,
    tipo_producto TEXT,
    precio REAL,
    cantidad INTEGER DEFAULT 0,
    fecha_entrada TEXT DEFAULT (DATE('now')),
    fecha_salida TEXT,
    estado TEXT DEFAULT 'Disponible',
    id_tienda INTEGER,
    FOREIGN KEY (id_tienda) REFERENCES Tienda(id_tienda)
);

-- ==========================================
-- 4. TABLA MOVIMIENTOS DE STOCK (depende de Productos)
-- ==========================================
CREATE TABLE IF NOT EXISTS MovimientosStock (
    id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    tipo_movimiento TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    fecha_movimiento TEXT DEFAULT (DATETIME('now')),
    observacion TEXT,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);

-- ==========================================
-- 5. TABLA VENTAS (depende de Usuarios y Tienda)
-- ==========================================
CREATE TABLE IF NOT EXISTS Ventas (
    id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vendedor INTEGER NOT NULL,
    id_tienda INTEGER NOT NULL,
    fecha_salida TEXT DEFAULT (DATETIME('now')),
    precio_total REAL NOT NULL,
    FOREIGN KEY (id_vendedor) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_tienda) REFERENCES Tienda(id_tienda)
);

-- ==========================================
-- 6. TABLA VENTAS-PRODUCTOS (depende de Ventas y Productos)
-- ==========================================
CREATE TABLE IF NOT EXISTS VentasProductos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES Ventas(id_venta),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);

-- ==========================================
-- 7. TABLA REPORTES (depende de Tienda)
-- ==========================================
CREATE TABLE IF NOT EXISTS reportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_reporte TEXT NOT NULL,
    creador TEXT NOT NULL,
    tipo TEXT,
    id_tienda INTEGER,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    creado_en TEXT DEFAULT (DATETIME('now')),
    FOREIGN KEY (id_tienda) REFERENCES Tienda(id_tienda)
);


-- ==========================================
-- DATOS SEMILLA (solo para desarrollo)
-- ==========================================
-- NOTA: Las contraseñas aquí están hasheadas con bcrypt.
-- '1234' -> hash bcrypt
-- 'admin123' -> hash bcrypt

-- Tiendas de ejemplo
INSERT OR IGNORE INTO Tienda (id_tienda, nombre_establecimiento, direccion, anio_creacion, estado)
VALUES
(1, 'Supermercado Central', 'Cra 12 # 8-90', 2018, 'Activo'),
(2, 'Minimarket San José', 'Calle 3 # 22-15', 2020, 'Activo'),
(3, 'Tienda La 14', 'Av. Libertad # 40-22', 2012, 'Inactivo');

-- Usuarios de ejemplo (contraseñas hasheadas con bcrypt, 10 rounds)
-- carlos: contraseña '1234'
-- admin1: contraseña 'admin123'
INSERT OR IGNORE INTO Usuarios (id_usuario, nombres, genero, correo, celular, rol, usuario, contrasena, id_tienda)
VALUES
(1, 'Carlos Pérez', 'Masculino', 'carlos@mail.com', '3001234567', 'Tendedero', 'carlos',
 '$2b$10$5QFG27VJIG2OmYFHDAc8u.Wjt4IeZW6j30grtaep43RcxIKhp0S2G', 1),
(2, 'Admin Tienda 1', 'Masculino', 'admin1@mail.com', '3009876543', 'Administrador', 'admin1',
 '$2b$10$ZCD660po.viRBuTzzuxMQuK.oaoOe4HyZJ0NiH6ea0Xharb0H.jGK', 1);

-- Productos de ejemplo
INSERT OR IGNORE INTO Productos (id_producto, codigo, nombre_producto, categoria, subcategoria, tipo_producto, precio, cantidad, fecha_entrada, fecha_salida, id_tienda)
VALUES
(1, 'P001', 'Arroz Diana 1Kg', 'Alimentos secos', 'Granos', 'Arroz', 4500, 100, '2025-11-01', '2025-12-13', 1),
(2, 'P002', 'Leche Alquería 1L', 'Lácteos', 'Leche', 'Bebida', 3800, 80, '2025-10-02', '2025-10-03', 1),
(3, 'P003', 'Detergente Ariel 2Kg', 'Aseo', 'Limpieza del hogar', 'Detergente', 12500, 50, '2025-09-03', '2025-10-01', 1);
