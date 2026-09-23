# Plan 16: Fase E — Cierre del ciclo (recepción de mercancía y aprendizaje)

**Estado:** Revisado, sin implementar. Documento original de `implementation_plan.md`, entregado por el usuario, movido aquí y anotado.
**Fecha de revisión:** 2026-09-23
**Depende de:** plan 13 (Fases A a D, ya implementadas en local).

---

## 0. Resumen de la revisión

El plan trae dos ideas sólidas (recepción de mercancía y solicitudes del tendero) y una que **no se debe implementar tal como está** (el punto 2, "Aprendizaje de la IA"): duplica y corrompería un mecanismo que ya existe y ya funciona en este proyecto. El resto del documento no conocía la estructura actual del código (nombres de archivo, columnas, endpoints), así que las secciones 2 a 5 corrigen eso punto por punto. Nada de esto se implementó todavía: es el análisis que pediste antes de escribir código.

## 1. Corrección importante: el punto 2 ("Aprendizaje de la IA") ya existe, y de otra forma

El plan propone: al aprobar/enviar un borrador, comparar `cantidad_sugerida` vs `cantidad_final` y meter esa diferencia en `Feedback_IA`.

**El problema:** `Feedback_IA` no mide "cuánto corrigió el administrador la sugerencia". Mide **cuánto acertó la sugerencia frente a las ventas reales**, evaluando el pedido semanas después de aprobado. Esto ya está implementado y corriendo:

- `controllers/feedbackController.js` → `evaluateOrderInternal`: por cada línea de una orden `Aprobada`/`Completada`/`Parcial`, espera un período (`max(lead_time × 2, 14)` días), suma las ventas reales del producto en ese período, y calcula `factor_precision`, `error_absoluto`, `error_porcentual` y `bias` comparando esas ventas reales contra lo pedido.
- `services/schedulerService.js` → `runDailyAIEvaluation`: corre **todos los días**, sobre todas las órdenes de los últimos 60 días en esos tres estados, y llama a lo anterior.
- `controllers/aiController.js` (la consulta `PrecisionIA`) y `controllers/suppliersController.js` (`factor_ia`) leen el promedio de `factor_precision` de esa tabla para la confianza (%) y para ajustar el punto de reorden.
- **Verificado en la tienda de prueba:** ya hay 4 filas en `Feedback_IA`, generadas por este mecanismo (la orden #3 sigue en `Aprobada`; hubo otras evaluadas mientras estuvieron en ese estado).

Si además se inserta un diferencial "sugerido vs final" en la misma tabla al aprobar, se mezclan dos métricas distintas (una compara contra lo que el administrador tecleó, la otra contra lo que realmente se vendió) y se **contamina** `factor_precision`, que ya alimenta la confianza y el ROP.

**Por qué la confianza sigue en 50%:** no es que falte el mecanismo, es que faltan datos: pocas órdenes han llegado a su fecha de evaluación, y el volumen de ventas de la tienda de prueba es bajo. Con más historial, subirá solo.

**Recomendación:** no tocar `Feedback_IA` ni `factor_precision` en la aprobación. Si se quiere que el administrador vea cuánto ajustó respecto al Consejero, es un dato de otra naturaleza (una métrica de uso/confianza en la IA, no de precisión de inventario) y podría vivir aparte —por ejemplo, en `Auditoria_IA`, que ya guarda `datos_base_json` y `sugerencia_ia_json` de cada borrador— sin tocar la tabla de aprendizaje real.

## 2. Punto 1 (Recepción de mercancía): correcciones técnicas

La idea es correcta; el documento original no conocía estos detalles:

- **Columna real de la nota:** `MovimientosStock` no tiene columna `razon`; el campo se llama `observacion` (así se usa en `controllers/saleController.js`). Se debe escribir ahí el texto `"Orden de Compra #X"`, no crear una columna nueva.
- **No usar `InventoryMovement.create` (`models/InventoryMovement.js`) para esto.** Ese modelo hace su propia lectura+escritura contra el pool de conexiones, fuera de cualquier transacción del que lo llama. Para recibir varias líneas de una orden a la vez, hay que insertar en `MovimientosStock` y actualizar `Productos.cantidad` **dentro de la misma transacción** que cambia el estado de la orden (mismo patrón que ya usa `submitSmartOrder`: `BEGIN` → por cada línea, `INSERT` + `UPDATE` con el `client` de la transacción → `UPDATE Ordenes_Compra` → `COMMIT`, con `ROLLBACK` en el catch). Si se usa el modelo tal cual, una falla a mitad de camino deja movimientos de stock sin la orden marcada como completada, o viceversa.
- **No existe hoy un endpoint que reciba cantidades reales.** `PATCH /api/ordenes/:ordenId/estado` (en `controllers/suppliersController.js`) solo cambia el texto de `estado`, sin validar de dónde viene ni a dónde va (el plan 13, sección 10, ya había señalado esto: "acepta cualquier texto, sin máquina de estados"). Para esta fase conviene:
  - Dejar `PATCH /estado` para las transiciones simples (`Aprobada`/`Rechazada`/`Enviada`, como hoy) y **rechazar** ahí el valor `Completada`.
  - Crear un endpoint dedicado, p. ej. `POST /api/ordenes/:ordenId/completar` con body `{ items: [{ id_producto, cantidad_recibida }] }`, que valide que la orden esté en `Enviada` (o `Aprobada`, ver pregunta abierta 3 más abajo) antes de aceptar la recepción.
- **Bug de paso, no de esta fase pero relevante:** `updateOrderStatus` nunca guarda `fecha_aprobacion` al pasar a `Aprobada` (columna que sí existe en `Ordenes_Compra`). Hoy `evaluateOrderInternal` lo compensa con `COALESCE(fecha_aprobacion, fecha_creacion)`, así que no rompe nada, pero como esta fase toca la máquina de estados de todos modos, es el momento de agregar `fecha_aprobacion = CURRENT_TIMESTAMP` cuando `estado = 'Aprobada'`.
- **Archivo del frontend equivocado.** El plan dice modificar `frontend/src/components/puntoventa/OrdenDetalle.jsx`; ese archivo no existe. El detalle de la orden vive en `frontend/src/components/proveedores/OrdenesHistory.jsx` (ahí es donde, en la Fase D recién implementada, ya se editan cantidades y se muestran los estados). El modal de "Confirmar Recepción" se agrega ahí, o como un componente nuevo que ese archivo abre.
- **No cubierto por el plan: dinero.** Si piden 100 y llegan 80, ¿el `presupuesto_total`/`saldo_pendiente` de la orden (usados en Pagos) se ajustan a lo realmente recibido, o se le sigue cobrando al proveedor lo pedido? Es una decisión de negocio, no técnica; ver preguntas abiertas.

## 3. Punto 3 (Permisos y solicitudes del tendero): correcciones técnicas

- **Hoy el tendero no puede llegar a pedir nada por sí solo**, ni con el plan tal como está escrito: en la Fase B (este mismo ciclo de trabajo) todas las rutas de `routes/ordenBorradorRoutes.js` y de `routes/supplierRoutes.js` quedaron detrás de `requireAdmin`, y en `DashboardPage.jsx` los botones del Consejero están dentro de `{isAdmin && …}`. El plan asume que "el tendero ve el botón pero no puede actuar"; hay que **quitarle `requireAdmin`** a un endpoint nuevo y angosto para que esto funcione, no al que ya existe:
  - No reutilizar `POST /api/ordenes/borrador/desde-consejero` para el tendero: ese endpoint deja fijar cualquier cantidad y agrupa varios productos a la vez, pensado para el administrador.
  - Crear `POST /api/ordenes/borrador/solicitar` (`requireLogin`, sin `requireAdmin`): un producto a la vez, cantidad = la sugerida por el Consejero (no editable por el tendero), marca la línea con `solicitado_por = id_usuario`. El resto de acciones (editar, quitar, aprobar, enviar, completar) se quedan en `requireAdmin`, sin cambios.
- **Notificación al administrador:** el plan recomienda avisar en el ícono de notificaciones; ya existe la pieza para eso (`models/Notification.js`), pero solo en la dirección contraria: `Notification.broadcast` avisa a todos los **Tenderos** de la tienda (se usa así en `sendOrderToSupplier`). Para este caso hace falta la variante que avise a los **Administradores** (mismo patrón, cambiando el filtro `rol = 'Tendero'` por `rol = 'Administrador'`).
- El resto (badge "Solicitado por: Juan", columna `solicitado_por` con FK a `Usuarios`) está bien planteado.

## 4. Esquema: dónde agregar las columnas

Como ya se hizo en las Fases B y en el plan 15 (Fiados), el esquema vive en dos lugares y ambos deben actualizarse:
- `config/database.js` (auto-migración, la que corre en producción): `ALTER TABLE Ordenes_Detalle ADD COLUMN IF NOT EXISTS cantidad_recibida INTEGER;` y `ADD COLUMN IF NOT EXISTS solicitado_por INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL;`.
- `database/init_pg.sql` (instalación nueva con `npm run migrate`): las mismas columnas, en la definición de `Ordenes_Detalle`.

## 5. Preguntas abiertas (las del documento original, más las que salieron de la revisión)

1. **Entregas parciales** (la pregunta 1 original): de acuerdo con la recomendación del documento —cerrar del todo y dejar que el Consejero vuelva a sugerir lo que falte—. Es coherente con cómo ya funciona el motor de reposición (min-max, sin memoria de "pedidos en tránsito").
2. **Notificación al administrador** (la pregunta 2 original): de acuerdo con mostrarla en el ícono de notificaciones, ya hay infraestructura para eso.
3. **¿Desde qué estado se puede "completar"?** El plan no lo dice. Plan 13 propuso la máquina `Borrador → Pendiente|Aprobada → Enviada → Completada`. ¿Solo se puede completar una orden `Enviada`, o también una `Aprobada` que nunca se envió por la app (por ejemplo, se pagó y se recogió en persona)?
4. **¿Se ajusta el dinero en una entrega parcial?** Si llegan 80 de 100, ¿el proveedor cobra por 100 o por 80? Afecta `presupuesto_total`/`saldo_pendiente` y los pagos ya registrados.
5. **¿La cantidad que solicita el tendero es fija (la del Consejero) o también editable por él?** El plan no lo aclara; la recomendación de la sección 3 es dejarla fija para que el tendero no pueda inflar pedidos, y que el administrador ajuste al aprobar.

## 6. Lo que el plan no menciona y conviene agregar al alcance

- Prueba unitaria para el nuevo endpoint de recepción con los mismos casos que ya tiene `tests/business_logic/ordenesBorrador` (por ahora inline en `reposicion.test.js`): cantidad recibida igual, menor y mayor a la pedida; producto ya sin stock de seguridad tras recibir menos de lo esperado.
- Actualizar `docs/planes/13_plan_consejero_ia_a_borrador_de_orden.md` (sección "Estado") cuando esta fase quede implementada, como se hizo con las Fases A-D.

## 7. Siguiente paso

Falta tu respuesta a las preguntas de la sección 5 (sobre todo la 3 y la 4, que no estaban en el documento original) antes de escribir código. Con eso, la implementación seguiría el mismo patrón de las fases anteriores: rama local propia, sin subir a `main` hasta que lo indiques.

---

## Anexo: documento original (`implementation_plan.md`, sin editar)

# Recomendaciones y Plan de Implementación: Fase E (Cierre del Ciclo)

Este documento detalla mis recomendaciones para implementar la **Fase E** del flujo del Consejero IA. El objetivo de esta fase es cerrar completamente el ciclo de compras para que el inventario se actualice automáticamente y la IA aprenda de las decisiones del administrador.

## User Review Required

> [!IMPORTANT]
> Lee las siguientes recomendaciones y confirma si estás de acuerdo con el enfoque antes de empezar a escribir código.

## Open Questions

> [!WARNING]
> Necesitamos definir algunas reglas de negocio para los casos borde de esta fase:
>
> 1. **Entregas parciales:** Si pides 100 y llegan 80, ¿se cierra la orden por completo y se asume que los 20 faltantes no llegarán (y el Consejero los volverá a sugerir si hacen falta), o la orden debe quedar "Parcialmente Completada"? *(Mi recomendación: Cierre total para simplificar; si faltan, el Consejero los sugerirá en la siguiente corrida).*
> 2. **Notificaciones de solicitudes:** Cuando el tendero solicita un producto, ¿se debe enviar una alerta o notificación al administrador, o basta con que el admin lo vea al entrar a la sección de Proveedores/Borradores? *(Mi recomendación: Mostrar una alerta en el ícono de notificaciones).*

---

## 1. Recepción de Mercancía

Actualmente, cuando una orden llega, el administrador marca la orden como completada pero el stock no se actualiza automáticamente.

**Recomendación de Flujo:**
- En la interfaz de detalle de la orden, cambiar el estado a `Completada` abrirá un Modal: **"Confirmar Recepción de Mercancía"**.
- El modal listará los productos esperados, pre-llenando la cantidad recibida con la `cantidad_final` solicitada.
- El administrador podrá editar las cantidades reales recibidas si llegaron menos (o más) unidades.
- **Backend:** Al confirmar, el servidor:
  1. Cambiará el estado de la orden a `Completada`.
  2. Guardará la `cantidad_recibida` en la tabla `Ordenes_Detalle`.
  3. Generará automáticamente las entradas en `MovimientosStock` (Tipo: 'Entrada', Razón: 'Orden de Compra #X') y sumará el stock a la tabla `Productos`.

*Beneficio:* Evitamos que el Consejero IA vuelva a sugerir productos que ya están en la tienda pero que nadie subió al sistema a mano.

---

## 2. Aprendizaje de la IA (Feedback)

El Consejero sugiere cantidades (ej: 50), pero el administrador tiene la última palabra (ej: edita a 70).

**Recomendación de Flujo:**
- Al momento en que el administrador **Aprueba** o **Envía** el borrador (pasando de `Borrador` a `Pendiente`/`Enviada`), el backend comparará silenciosamente `cantidad_sugerida` vs `cantidad_final`.
- Si hay una diferencia (ej: 50 vs 70), se insertará un registro en la tabla `Feedback_IA`.
- En el campo de feedback se registrará el diferencial porcentual o absoluto, lo que alimentará el cálculo de `factor_ia` para futuras recomendaciones.
- *Beneficio:* Con el tiempo, la "confianza" de la IA saldrá del 50% inicial, volviéndose más agresiva o conservadora según el historial real del administrador.

---

## 3. Permisos y Solicitudes del Tendero

Actualmente la página del Consejero en el Dashboard es solo para el administrador, o el tendero solo puede ver las sugerencias sin interactuar.

**Recomendación de Flujo:**
- Habilitar el botón en la vista del tendero, pero cambiar el texto de *"Agregar al pedido"* a *"Solicitar al Administrador"*.
- **Backend:** Añadir una columna `id_usuario_solicita` a la tabla `Ordenes_Detalle` (opcional). Cuando el tendero solicita el producto, el backend lo añade al borrador existente de ese proveedor, marcando la línea como solicitada por un empleado.
- **Frontend:** En la vista de "Proveedores" del administrador, las líneas que fueron añadidas por el tendero aparecerán con un pequeño distintivo o badge (Ej: "Solicitado por: Juan").
- El administrador es el único que puede ver el borrador completo, editar las cantidades finales, aprobarlo y enviarlo al proveedor.

---

## Proposed Changes

Si apruebas el enfoque, estos serán los pasos técnicos:

### Base de Datos & Backend
#### [MODIFY] `config/database.js`
- Añadir columna `cantidad_recibida` a `Ordenes_Detalle`.
- Añadir columna `solicitado_por` a `Ordenes_Detalle` (Foreign Key a `Usuarios`).

#### [MODIFY] `routes/supplierRoutes.js` & `controllers/suppliersController.js`
- Modificar el endpoint de cambio de estado a `Completada` para recibir las cantidades reales e inyectar `MovimientosStock` en una transacción.
- Añadir lógica en la aprobación de la orden para registrar las discrepancias en `Feedback_IA`.

### Frontend
#### [MODIFY] `frontend/src/components/puntoventa/OrdenDetalle.jsx` (o donde viva el detalle)
- Crear el modal de "Recepción de Mercancía" para confirmar cantidades.
- Mostrar badge de "Solicitado por: [Usuario]" si aplica.

#### [MODIFY] `frontend/src/pages/DashboardPage.jsx`
- Ajustar lógica de permisos para que el botón muestre "Solicitar" si el usuario es tendero.

## Verification Plan

### Automated Tests
- Escribir pruebas para verificar que completar una orden genera movimientos de stock y ajusta el saldo del producto correctamente.
- Verificar que aprobar órdenes con cantidades distintas llama a la inserción en `Feedback_IA`.

### Manual Verification
- Ingresar como administrador y completar una orden; ir al inventario y validar que el stock subió.
- Ingresar como tendero, solicitar un producto, y validar que aparece en el borrador del administrador.
