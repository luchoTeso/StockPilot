# Contexto: revisión externa y decisiones (23-sep-2026)

> Documento de contexto para el agente de Claude Code. Resume una sesión de revisión con otro asistente (Claude en Cowork): la revisión del plan 17, las decisiones tomadas, los hallazgos de la encuesta a tenderos y las sugerencias de producto y documentación.
> **Regla general:** verifica cada afirmación contra el código antes de actuar. Los números de línea corresponden al código del 23-sep-2026 y pueden haber cambiado. No escribas código hasta que Luis apruebe el plan revisado.

---

## 1. Fuentes que debes conocer

| Fuente | Qué contiene |
|---|---|
| `docs/planes/17_unificacion_motor_riesgo_inventario.md` | Plan original de unificación del motor de riesgo (debe revisarse con la sección 2 de este documento) |
| `Documentacion/StockPilot_Intervencion_y_Viabilidad.docx` | Nuevo entregable académico: plan de intervención, reporte, análisis de resultados y viabilidad. Léelo con `pandoc -t markdown` si necesitas su contenido |
| `Documentacion/Documento de practica de ingeniera 5 - Gestion de inventarios.md` | Documento académico principal |
| `Documentacion/Plan de Negocio_ StockPilot.md` | Plan de negocio (tiene inconsistencias, ver sección 5) |
| Encuesta a tenderos (Google Forms, no está en el repo) | 15 respuestas, 23-24 de marzo de 2025. Resumen en la sección 4 |

---

## 2. Revisión del plan 17 (motor de riesgo)

### 2.1 Errores factuales del plan (verificados contra el código)

- **E1 (bloqueante): el motor "bueno" tiene el mismo hueco que `Alert.js`.** Con `stock = 0`, sin ventas y `stockSeguridad = 0` (el valor por defecto), `calcularReposicion` devuelve `riesgo: CRÍTICO`, `urgencia: "Puede esperar"` y `cantidadBase: 0`. Toda la urgencia está dentro de `if (cantidadBase > 0)` (`utils/reposicion.js` ~línea 63). El test "Leche Alquería" no lo detecta porque usa `stockSeguridad: 4`. Si la Fase 4 conecta Alert.js a este motor sin corregirlo, el falso negativo continúa.
- **E2: nadie lee `Productos.clasificacion_abc`.** El Consejero y Detalle recalculan el ABC para toda la tienda. `getSupplierForecast` lo recalcula **solo entre los productos de ese proveedor**. Resultado: el mismo producto puede ser A en el Consejero y C en Proveedores (24 frente a 84 unidades sugeridas en una simulación con v = 2/día, stock 10, seguridad 4).
- **E3: el `factorIA` solo llega al motor desde Proveedores** (promedio de las últimas 5 evaluaciones). El Consejero consulta `avg_precision` (promedio de todo el historial) pero no lo pasa al motor; Detalle y `Alert.generate` no lo tienen. El ROP cambia según la pantalla.
- **E4: no se encontró ningún consumidor de `/api/dashboard/stats/advanced` (Nivel de Servicio) ni de `/api/ia/alerts` en `frontend/src`.** Confírmalo con un grep de todo el repositorio. Los tests de `dashboard_analytics.test.js` reimplementan la fórmula dentro del test y no protegen el código de producción.

### 2.2 Omisiones del plan

- **O1 (decisión central):** `riesgo` (basado en stock) y `urgencia` (basada en días) divergen todo el tiempo cuando `stock_seguridad = 0`. Ejemplo: stock 1 y 5 ventas/día da `MEDIO` + "Pide hoy". La Fase 1 **no** debe basar el nivel solo en `riesgo`.
- **O2:** `Alert.generate` solo se ejecuta tras una venta (`saleController.js` ~166, ~286) o con el botón manual. No se ejecuta al recibir órdenes (`suppliersController.js` ~389), en `addStock` (`productController.js` ~314-326) ni al crear o editar productos.
- **O3:** `Alert.generate` no es idempotente. Se lanza sin esperar el resultado, sin transacción ni bloqueo, y dos ventas seguidas pueden duplicar alertas. Además, reinserta todas las alertas activas en cada venta y deshace el "archivar" manual.
- **O4:** `alertasCriticas` incluye `vencimiento_critico`, pero el Dashboard dice "N Productos Agotados" y el banner del Catálogo dice "Riesgo de Quiebre". Además cuenta alertas, no productos distintos.
- **O5:** hay más fórmulas: `Product.findProAlerts` (expuesta en `/api/ia/alerts`), `Product.findBelowMinStock` (sin llamadores), el endpoint de sugerencias de IA del formulario (calcula `stock_minimo` con la fórmula del ROP y sugiere seguridad = 2) y dos valores por defecto distintos para ABC (`'C'` en el esquema, `'A'` en `Alert.js` cuando no hay ventas).
- **O6:** hace falta un diagnóstico de datos antes de la Fase 3: cuántos productos tienen `stock_seguridad = 0` o `lead_time` por defecto.
- **O7:** textos desalineados: el tooltip de `stock_seguridad` en `ProductFormModal.jsx` (~631) y la columna "Alerta Mínima" del Excel (`reportController.js` ~183).
- **O8:** no hay red de seguridad. `Alert.generate` está bajo `/* v8 ignore */`. Propuesta: extraer `evaluarProducto(prod) → alertas[]` como función pura, un modo dry-run que compare las alertas viejas con las nuevas y una variable de entorno para volver atrás.

### 2.3 Decisiones de Luis sobre las 6 preguntas abiertas

1. **Cuatro niveles calculados en el backend:** `agotado | critico | reponer | ok`. `agotado` = stock ≤ 0, sin depender de las ventas ni de `cantidadBase`. **No** mapees el `BAJO` de `reposicion.js` (que significa sano) al `'bajo'` de `ProductTable` (que significa "Pedir Más").
2. **Ventana parametrizada con `frecuencia_compra_dias`** (valor por defecto 7; revisión periódica T + L). No sobrescribas la columna. El formulario no expone este campo; confirma con `SELECT frecuencia_compra_dias, COUNT(*) FROM Productos GROUP BY 1`. Si la ventana deja de ser semanal, renombra "Esta semana" a "En esta compra".
3. **No recalcular alertas resueltas.** Las activas se regeneran solas. Agrega `"motor": "v2"` en el `datos_json` de las nuevas.
4. **`stock_minimo` se conserva como piso solo del nivel `reponer`:** `umbral = max(rop, stock_minimo)`. Nunca lo uses como `stock_seguridad` ni en el nivel crítico. Sirve también como piso de cantidad para productos sin historial. Actualiza el tooltip.
5. **Nivel de Servicio:** primero confirma si alguien lo consume. Si nadie lo hace, propón eliminarlo. Si se mantiene, debe ser el % de productos con nivel `ok` del motor unificado, renombrado a "% de productos sin necesidad de reponer".
6. **Promociones sigue siendo una lógica separada.** En este plan solo se agrega una exclusión: no sugerir promoción si el nivel es `agotado`, `critico` o `reponer`. Ejemplo real: stock 12, v30 = 5/día y v7 = 3/día da candidato a promoción y a la vez "Pide hoy".

### 2.4 Orden de fases propuesto

- **Fase 0 (nueva):** una sola función `leerEntradasMotor(tiendaId, filtro)` (v7, v30, qty30, ABC de la tienda, factor IA) usada por el Consejero, Detalle y Proveedores. Corrige E2 y E3 antes de tocar pantallas.
- **Fase 1:** `clasificarNivel()` con la matriz de estados: agotado = stock ≤ 0; crítico = "Pide hoy"; reponer = días ≤ lead + frecuencia o stock ≤ max(rop, stock_minimo); ok = el resto. Incluye la corrección de E1 y tests con `stockSeguridad: 0`.
- **Fase 2:** `GET /api/productos` expone `nivel_stock` (el handler es `ProductController.getProducts`). Hay que agregar v7 y el factor IA.
- **Fase 2b:** diagnóstico de datos (O6).
- **Fase 3:** Catálogo y hook de ordenamiento, más los textos (O7).
- **Fase 4:** Alert.js en este orden: dry-run con diferencias → transacción + `pg_advisory_xact_lock(id_tienda)` + upsert (O3) → regeneración en eventos de stock (O2) → estadísticas por tipo con `COUNT(DISTINCT id_producto)` (O4).
- **Fase 5:** decidir si se eliminan o reconectan `stats/advanced`, `/api/ia/alerts` y `findBelowMinStock`.
- **Fase 6 (opcional):** vista SQL.

---

## 3. Decisiones y sugerencias de producto

### 3.1 IA predictiva: decisión estratégica
La IA fue una **decisión estratégica del equipo** para diferenciarse de la competencia (Treinta, Chiper) y automatizar la mayoría de los procesos manuales. No fue una necesidad expresada por los tenderos. La encuesta la respalda de forma indirecta (80 % pide registro automatizado; 60 % espera ahorrar tiempo). La propuesta de valor debe comunicarse por el resultado ("te dice qué pedir y cuánto"), no por la tecnología. La IA depende de un registro confiable, así que el registro rápido es una condición previa.

### 3.2 Modo básico: idea en evaluación, sin implementar todavía
Los administradores de microempresas suelen ser personas mayores y 15 módulos son demasiados. La propuesta es **divulgación progresiva**, no eliminar módulos:
- **Modo tienda (por defecto):** 4 acciones grandes: *Vender*, *¿Qué pido?*, *Alertas* y *Recibir mercancía*.
- **Modo avanzado:** simulador, aprendizaje, reportes, promociones y lo demás, para quien lo active.
- Meta: que baste una capacitación de unos 15 minutos. Aprovechar los roles existentes (Administrador y Tendero).
- **Solo diseño y propuesta por ahora.** No implementar sin aprobación.

### 3.3 Adopción: convocatoria pública de prueba gratuita
Todavía **no se ha contactado ninguna tienda**. El plan es publicar la prueba gratuita en canales digitales (grupos de Facebook de comerciantes o del barrio, grupos de WhatsApp de tenderos, Marketplace y la landing con "Explorar Demo"). Recomendaciones:
- Tratarla como un **experimento medido en etapas, con metas fijadas antes de publicar**: visitas → registros → **activación** (≥ 20 productos cargados y ventas registradas durante 7 días; meta ≥ 25 %) → uso a 4 semanas → "¿pagaría $39.900?".
- Riesgo de sesgo: quien la encuentra en internet ya es más digital que el tendero promedio (73 % usa libreta; 20 % no tiene dispositivo).
- Complementar con contacto directo a los **8 encuestados que dijeron que sí se capacitarían**.
- Posible tarea técnica: una consulta o vista que calcule la activación por tienda nueva a partir de los datos existentes (productos y ventas por tienda y por fecha).

### 3.4 Requisitos antes de recibir datos de negocios reales (prioridad alta)
1. **Copias de seguridad:** el mecanismo actual copiaba el archivo SQLite y dejó de funcionar al migrar a PostgreSQL. Reemplazarlo por `pg_dump` programado con almacenamiento externo, o verificar y documentar los respaldos automáticos de Neon.
2. **Política de tratamiento de datos (Ley 1581 de 2012)** publicada en la plataforma, con aceptación al registrarse.

---

## 4. Resumen de la encuesta a tenderos (dato real, n = 15, marzo de 2025)

- **Localidades:** Barrios Unidos (6), Usme (4), Santa Fe (4) y Antonio Nariño (1). Incluye negocios que no son de víveres (cigarrería, papelería).
- **Gestión actual:** 73 % registro manual en papel; 67 % nunca usó una herramienta digital; 67 % tiene celular; 20 % no tiene ningún dispositivo.
- **Dificultades:** errores de registro 53 %; faltantes 33 %; exceso de productos 33 %; caducidad 20 %.
- **Funcionalidades esenciales:** registro automatizado 80 %; alertas de caducidad 53 %; alertas de stock, informes y códigos de barras 40 % cada una. No se preguntó por IA.
- **Obstáculos:** falta de tiempo para aprender 80 %; costo 53 %. Capacitación: sí 53 %, depende de la complejidad 40 %.
- **No hubo preguntas sobre disposición a pagar ni sobre el precio.**

---

## 5. Correcciones pendientes en la documentación

El Plan de Negocio y el Documento 5 contienen afirmaciones que la encuesta real contradice. Ajústalas **solo con aprobación de Luis**, y nunca inventes datos que las reemplacen:
1. "15 entrevistas en Kennedy, Suba y Engativá + 50 encuestas". Lo real son 15 encuestas en las localidades de la sección 4.
2. "Pruebas piloto con 5 tiendas", "NPS 68 con 10 tenderos en Figma" y "88 % lo recomendaría". No hay evidencia: eliminar o marcar como pendiente.
3. 78 % de disposición a pagar, 85 % de interés en IA y 92-100 % de pérdidas por vencimiento. La encuesta no preguntó los dos primeros y el tercero es 20 %.
4. **Cifras financieras inconsistentes:** ingresos del año 1 de $39,9 M frente a $29,9 M; resultado de −$25,9 M frente a −$36,4 M; inversión de $15,85 M frente a $42,78 M. El CAC de $48.300 excluye el salario comercial (con él da ~$274.583). El punto de equilibrio es de ~141 tiendas. Falta la proyección a 5 años que exige la actividad.
5. **Datos técnicos que difieren entre documentos:** 50, 132 o 142 pruebas (el reporte automático `evidencia_pruebas.json` del 20-sep-2026 da 132/132 en 38 suites); 5,8 o 26,5 KLOC; el Plan de Negocio afirma que el sistema es PWA, pero las recomendaciones del Documento 5 lo tratan como trabajo futuro.

---

## 6. Qué te pido ahora

1. Lee este documento y verifica contra el código los puntos de la sección 2 (sobre todo E1-E4).
2. Actualiza `docs/planes/17_...` con las decisiones 2.3 y el orden 2.4, y muéstrame el plan revisado **antes de escribir código**.
3. Propón un plan corto (sin implementar) para: copias de seguridad en PostgreSQL y política de datos (3.4), la métrica de activación (3.3) y el modo básico (3.2).
4. Prepara una lista de los cambios de texto de la sección 5, cada uno con su ubicación exacta en los documentos, para que yo los apruebe.
5. Si algo de este documento no coincide con el código actual, dímelo en lugar de asumirlo.
