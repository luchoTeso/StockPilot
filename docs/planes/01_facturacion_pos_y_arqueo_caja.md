# Plan 01: Facturación POS y Arqueo de Caja (Fases 1 y 2)

**Estado:** Implementado y Verificado  
**Fecha:** 2026-09-17  

---

## 1. Contexto y Objetivos
Transformar el módulo de ventas básico en un Punto de Venta (POS) profesional con control de efectivo, sesiones por turno y emisión de recibos físicos en papel térmico.

* **Fase 1 (Cobro POS y Ticket):**
  - Modal de pago (`PaymentModal.jsx`) con desglose de métodos: Efectivo, Tarjeta, Transferencia (Nequi, Daviplata).
  - Cálculo instantáneo de cambio/vuelto.
  - Generación e impresión de ticket térmico (`TicketPrinter.jsx`) en formato estándar de 80mm usando `react-to-print`.
* **Fase 2 (Apertura y Arqueo de Caja):**
  - Obligatoriedad de abrir caja con monto inicial para poder vender.
  - Bloqueo transaccional de ventas si no hay caja abierta.
  - Modal de cierre (`CashRegisterModal.jsx`) con conteo ciego/declarado, cálculo automático del sistema y determinación de faltantes o sobrantes.
  - Pestaña de **Historial de Caja** en Punto de Venta y sección de reportes descargables.

---

## 2. Componentes Modificados y Creados

### Base de Datos (PostgreSQL Neon)
- Tabla `SesionCaja`:
  - `id_sesion` (PK SERIAL)
  - `id_tienda` (FK Tienda)
  - `id_vendedor` (FK Usuarios)
  - `monto_apertura` (NUMERIC)
  - `monto_cierre_declarado` (NUMERIC)
  - `monto_cierre_calculado` (NUMERIC)
  - `fecha_apertura` (TIMESTAMP)
  - `fecha_cierre` (TIMESTAMP NULL)
  - `estado` ('Abierta', 'Cerrada')
- Tabla `Ventas`:
  - `id_sesion_caja` (FK SesionCaja)
  - `metodo_pago` (VARCHAR)
  - `efectivo_recibido` (NUMERIC)
  - `cambio_devuelto` (NUMERIC)

### Backend (Node.js / Express)
- `models/CashRegister.js`: Métodos para apertura, cierre, verificación de turno activo y métricas de caja.
- `controllers/cashRegisterController.js`: Endpoints `/api/caja/abrir`, `/api/caja/cerrar`, `/api/caja/estado`, `/api/caja/historial`.
- `controllers/saleController.js`: Validación obligatoria de caja activa antes de registrar la venta (`POST /api/registrar-venta-carrito`).

### Frontend (React + Tailwind)
- `frontend/src/components/CashRegisterModal.jsx`: Apertura y arqueo de caja con desglose de billetes y resumen.
- `frontend/src/components/PaymentModal.jsx`: Cobro rápido con selección de método de pago y cálculo de vueltos.
- `frontend/src/components/TicketPrinter.jsx`: Formato de tirilla térmica 80mm.
- `frontend/src/pages/PuntoVentaPage.jsx`: Integración de estado de caja, botones alineados e historial de sesiones.
