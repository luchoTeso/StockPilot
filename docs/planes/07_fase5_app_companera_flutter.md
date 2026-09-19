# Plan de Expansión: Aplicación Móvil Compañera (Flutter)

## 1. Contexto y Motivación
Actualmente, la lectura de códigos de barras mediante navegadores web en dispositivos móviles se ve limitada por:
1. La falta de acceso directo a las APIs de autoenfoque (autofocus) del hardware de la cámara.
2. El alto consumo de recursos (CPU/Batería) que requiere decodificar video en tiempo real a través de JavaScript y WebAssembly.

Aunque la aplicación web de POS actualiza el escáner al máximo nivel permitido en entornos web (resolución de 720p, API nativa de `BarcodeDetector` y fallback a `ZXing`), para un escenario de alta concurrencia en retail (tiendas), un tendero necesita escaneos instantáneos, tolerantes al movimiento rápido y a distintas condiciones de luz. 

Para lograr la eficiencia de un láser físico usando un celular, se requiere acceso nativo a la cámara.

## 2. Propuesta: Enfoque "App Compañera"
En lugar de reconstruir toda la plataforma administrativa, se recomienda el desarrollo de una **"App Compañera"** (Companion App) móvil, construida en **Flutter**. 

Esta aplicación estará diseñada **exclusivamente para la operación diaria en la tienda (Rol Tendero)**, manteniendo al administrador en la aplicación Web (Dashboard, IA, Reportes, Gráficas).

### Ventajas del enfoque:
- **Desarrollo ágil (Estimado 2-3 semanas):** Al reciclar el 100% de la lógica de negocio actual (API REST Node.js y base de datos PostgreSQL), el esfuerzo se concentra únicamente en la interfaz de usuario.
- **Rendimiento Nativo:** Integración con librerías de Flutter (ej. `ai_barcode_scanner` o `mobile_scanner`) que compilan código nativo de Swift (iOS) y Kotlin (Android), garantizando lectura en milisegundos sin sobrecalentar el dispositivo.
- **UX Especializada:** Interfaces adaptadas ergonómicamente para ser usadas con una sola mano, ideales para trabajo de mostrador.

## 3. Alcance del Producto Mínimo Viable (MVP)
La App Compañera debería incluir únicamente los siguientes módulos para mantener el desarrollo rápido:

1. **Autenticación:**
   - Login con credenciales.
   - Restricción de vistas (solo se permitirá el acceso a usuarios con rol 'Tendero' o 'Administrador' en modo operador).

2. **Módulo de Venta Rápida (POS):**
   - Lector de código de barras a pantalla completa (integración con `ai_barcode_scanner`).
   - Carrito de compras y modificación de cantidades.
   - Confirmación de venta y descuento en base de datos.

3. **Consultas de Inventario:**
   - Buscador de productos por nombre o lectura de código para consultar stock actual y precios.

4. **Centro de Notificaciones:**
   - Recepción de alertas (ej. bajo stock, promociones aprobadas por IA).

## 4. Stack Tecnológico Sugerido
- **Frontend Móvil:** Flutter SDK (Lenguaje Dart).
- **Scanner Core:** `ai_barcode_scanner` (Capa de abstracción sobre `mobile_scanner` optimizada para POS).
- **Comunicación HTTP:** Paquete `http` o `dio` en Flutter para conectarse a las rutas actuales (`/api/ventas`, `/api/productos`, etc.).
- **Backend:** (Reutilizado) Node.js + Express + PostgreSQL.

## 5. Recomendación Hardware vs Software
- **Para PC de Escritorio/Caja:** Se recomienda seguir utilizando la Plataforma Web actual junto a una pistola láser física conectada por USB.
- **Para Movilidad en Tienda:** Se recomienda migrar a la App Compañera en Flutter instalada en smartphones o terminales POS Android (ej. Sunmi, Honeywell).
