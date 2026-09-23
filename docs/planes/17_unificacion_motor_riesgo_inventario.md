# Plan 17: Unificación del motor de riesgo de inventario

**Estado:** Propuesta de diseño, sin implementar. Continúa el trabajo ya hecho en la sesión actual (Consejero IA, Proveedores y Detalle de Productos ya comparten `utils/reposicion.js`; el aviso de Catálogo ya lee `/api/alertas`).
**Fecha:** 2026-09-23
**Depende de / relacionado con:** plan 13 (`13_plan_consejero_ia_a_borrador_de_orden.md`) y plan 16 (`16_plan_consejero_ia_fase_e_cierre_del_ciclo.md`), que introdujeron `utils/reposicion.js` como motor único de reposición para el Consejero IA y Proveedores.

---

## 0. Resumen ejecutivo

Hoy conviven **7 cálculos independientes** relacionados con "¿este producto tiene un problema de stock?" (6 de "riesgo/urgencia de quiebre" + 1 de "candidato a promoción" que se apoya en el mismo tipo de velocidad de venta pero resuelve una pregunta distinta y queda fuera del alcance de unificación de este plan).

| # | Fórmula | Ubicación exacta | Qué calcula | Pantallas/endpoints que alimenta |
|---|---|---|---|---|
| 1 | `Alert.determinarAlertaStock` | `models/Alert.js:200-204`, invocada desde `Alert.generate` en `models/Alert.js:81` | Compara **días para agotarse** (`cantidad / velocity_30d`) contra `lead_time` y `lead_time + frecuencia_compra_dias`. Persiste filas reales en `Alertas` (`critico`/`advertencia`). | `GET /api/alertas` y `/api/alertas/stats` (`controllers/alertController.js`) → Monitor Alertas (`frontend/src/pages/AlertasPage.jsx`), campanita (`frontend/src/components/NotificationCenter.jsx`), `alertasCriticas`/`alertasAdvertencia` del Dashboard (`controllers/dashboardController.js:24-26` → `getStats` → `frontend/src/pages/DashboardPage.jsx`), y el aviso superior de Catálogo (`frontend/src/hooks/useProductosPage.js:70-102`, función `verificarAlertas`) |
| 2 | `calcNivelStock` (hook) | `frontend/src/hooks/useProductosPage.js:147-159` | Cliente: `rop = velocity*leadTime + stockSeguridad`, `umbralCritico = max(stockSeguridad, ceil(velocity*2))`, `umbralBajo = max(rop, stockMinimo)`. | Solo **ordena** `listRender` (`useProductosPage.js:345-367`) por urgencia en Catálogo; no se muestra directamente en la UI |
| 3 | `calcNivelStock` (tabla) | `frontend/src/components/productos/ProductTable.jsx:26-30` | Cliente, regla simple: `cantidad <= stock_minimo` → crítico; `cantidad <= stock_minimo*1.5` → bajo. Ignora `velocity`, `lead_time` y `stock_seguridad` aunque le llegan en el objeto `p`. | Etiquetas **"Agotado"/"Por agotarse"/"Pedir Más"/"Suficiente"** y colores de cada fila de Catálogo (`ProductTable.jsx:66-109`) |
| 4 | `calcularReposicion` | `utils/reposicion.js:46-73` (puro, sin BD, con `tests/business_logic/reposicion.test.js`, 93 líneas) | `riesgo` (`CRÍTICO` si `stock <= stockSeguridad`; `MEDIO` si `stock <= rop`; si no `BAJO`), `urgencia` (`Pide hoy`/`Esta semana`/`Puede esperar`), `cantidadBase` a pedir, `rop`, `tendencia` (7d/30d acotada 0.5–2, solo con ≥5 unidades vendidas en 30 días). | Consejero IA (`controllers/aiController.js:187-195`, `getDashboardRecommendations`), Proveedores (`controllers/suppliersController.js:139-143`, `getSupplierForecast`), Detalle de Productos (`controllers/aiController.js:406-413`, `getAnalyticalSnapshot` → `frontend/src/pages/AnalisisDetalladoPage.jsx`, también enlazado desde el botón "Por agotarse"/"Pedir Más" de `ProductTable.jsx:99,104`) |
| 5 | Nivel de Servicio Estimado | `controllers/dashboardController.js:117-134`, función `getAdvancedStats` | SQL propio: `% productos con stock_actual > (velocity_30d*lead_time + stock_seguridad)`. Sin tendencia, sin `factorIA`, sin distinguir crítico/medio. | KPI "Nivel de Servicio Estimado" del Dashboard (`nivelServicio` en la respuesta de `/api/dashboard/advanced-stats` o ruta equivalente) |
| 6 | Ventanas de velocidad/tendencia distintas | Ver tabla de la sección 1.3 | 7 consultas SQL independientes recalculan `velocity_7d`/`velocity_30d` (y a veces 60d/90d) cada una a su manera | Todas las anteriores |
| (7, fuera de alcance) | `getPromotionSuggestions` | `controllers/aiController.js:461-511` | Candidatos a promoción: `trend = v7/v30 < 0.7 && stock>10` (baja rotación), vencimiento próximo, o sobrestock (`stock>50 && v30<1`) | `frontend` de Promociones (no es "riesgo de quiebre", es lo opuesto: exceso/lentitud; se documenta para que no se confunda con las 6 anteriores, no se toca en este plan) |

**Hallazgo adicional verificado (no estaba en el encargo original):** hoy `Alert.js` tiene un **hueco real**, no solo una inconsistencia estética. Ver sección 1.2.

---

## 1. Diagnóstico verificado contra el código real

### 1.1 Confirmación de la fórmula de `utils/reposicion.js`

`calcularReposicion` (`utils/reposicion.js:46-73`) hace, en orden:

```
tendencia = clamp(0.5, 2, v7/v30)          // solo si hay ≥5 unidades vendidas en 30 días, si no = 1
stockObjetivo = v30 * tendencia * diasCobertura[claseABC] + stockSeguridad   // diasCobertura: A=15, B=30, C=45
cantidadBase = max(0, ceil(stockObjetivo - stock))
rop = ceil((v30 * leadTime + stockSeguridad) * factorIA)
riesgo = stock <= stockSeguridad ? 'CRÍTICO' : (stock <= rop ? 'MEDIO' : 'BAJO')
diasParaAgotar = v30 > 0.01 ? floor(stock / v30) : null
urgencia = 'Pide hoy' si (stock<=0) o (sin ventas Y riesgo CRÍTICO) o (diasParaAgotar <= leadTime)
         = 'Esta semana' si diasParaAgotar <= leadTime + 7   // ojo: +7 fijo, no usa frecuencia_compra_dias
         = 'Puede esperar' en otro caso
```

Es el motor **más completo y más nuevo** (tiene ABC, tendencia, `factorIA` de aprendizaje vía `Feedback_IA`, y ya corrige el caso "producto sin ventas pero bajo el mínimo" — commit `a288976`). Confirmado como candidato natural a única fuente de verdad, tal como lo planteaba el encargo.

### 1.2 Hallazgo crítico: `Alert.js` puede **no generar ninguna alerta** para un producto agotado sin historial de ventas

`Alert.calcularDiasAgotamiento(cantidad, velocity30d)` (`models/Alert.js:196-198`) devuelve `999` cuando `velocity30d <= 0.01` (sin ventas). `determinarAlertaStock(diasAgotamiento, leadTime, freqCompra)` (`models/Alert.js:200-204`) solo dispara si `diasAgotamiento <= leadTime` o `<= leadTime + freqCompra`. Con `diasAgotamiento = 999` y valores típicos (`leadTime=3`, `freqCompra=7`), **nunca se cumple ninguna condición**, así que un producto con `cantidad = 0` y **sin ventas registradas** (ej. un producto nuevo, o de rotación tan baja que nunca vendió) **no genera ninguna fila en `Alertas`**: no aparece en Monitor Alertas, no suma a `alertasCriticas` del Dashboard, no dispara la campanita.

En cambio, ese mismo producto:
- En `ProductTable.jsx` sí se ve "Agotado" (`cantidad(0) <= stock_minimo` es trivialmente cierto).
- En el Consejero IA / Detalle de Productos, `calcularReposicion` sí marca `riesgo: 'CRÍTICO'` y `urgencia: 'Pide hoy'` (la rama `stock <= 0` de la línea 68 de `utils/reposicion.js` está pensada exactamente para esto).

Es decir: hoy mismo, para el mismo producto en la misma tienda, **Catálogo y el Consejero dicen "hay un problema urgente" y Monitor Alertas/campanita/Dashboard dicen "todo bien"**. Esto es más grave que una diferencia de umbral: es un falso negativo de notificación. Refuerza que la unificación de `Alert.js` no es solo estética, sino que corrige un bug de negocio real.

### 1.3 Ventanas de tendencia/velocidad: confirmadas 7 consultas SQL independientes

| Consumidor | v7 | v30 | v60/v90 | Otros |
|---|---|---|---|---|
| `models/Alert.js:49-50` (`generate`) | ✅ | ✅ | — | — |
| `controllers/aiController.js:104-134` (`getDashboardRecommendations`) | ✅ | ✅ | ✅/✅ | `qty_30d_total` para el umbral de confianza de tendencia (`ventas30Total`) |
| `controllers/aiController.js:361-372` (`getAnalyticalSnapshot`) | ✅ | ✅ | — | Ya corregido en el commit `80d6131` (antes sumaba TODO el historial en vez de 30 días; también corrigió `days_to_exhaust` llegando como `999999` crudo en vez de "Estable") |
| `controllers/suppliersController.js:94-102` (`getSupplierForecast`) | ✅ | ✅ | — | `factor_ia` desde `Feedback_IA` (últimas 5 evaluaciones) |
| `controllers/dashboardController.js:122` (`getAdvancedStats`) | — | ✅ | — | Sin v7, no puede calcular tendencia |
| `models/Product.js:8-16` (`findByStore`, alimenta `GET /api/productos`) | — | ✅ (`velocity`) | — | Es el campo que llega al frontend como `p.velocity` |
| `controllers/aiController.js:461-482` (`getPromotionSuggestions`, fuera de alcance) | ✅ | ✅ | — | — |

El bug real de esta sesión (`getAnalyticalSnapshot` sumando todo el historial) ya quedó corregido y con capturas de verificación en `docs/planes/img/analisis-*.jpg` (ver commit `80d6131`). Sigue habiendo **7 copias de la misma consulta SQL** con pequeñas variaciones; no es solo redundancia de fórmula sino redundancia de SQL, lo que fue justamente la causa raíz del bug ya corregido — cualquier consulta nueva que se agregue "a mano" corre el mismo riesgo.

### 1.4 Por qué `Alert.js` no se puede reemplazar 1:1 por `utils/reposicion.js`

`Alert.generate` (`models/Alert.js:8-113`) hace 4 cosas que no tienen relación con "¿hay riesgo de quiebre de stock?" y **no deben tocarse**:
- Marca como resueltas todas las alertas vigentes y regenera (ciclo de vida en `Alertas.resuelta`/`fecha_resolucion`).
- Calcula y persiste `clasificacion_abc` en `Productos` (con SQL de ventanas, `Alert.js:14-40`) — dato que además ya reutilizan `aiController` y `suppliersController` vía `p.clasificacion_abc`.
- `determinarAlertaVencimiento` (`Alert.js:206-213`, tipos `vencimiento_critico`/`vencimiento_proximo`) — vencimiento de producto, no relacionado con stock.
- `determinarSobrestock` (`Alert.js:215-217`, tipo `sobrestock`, severidad `info`) — "capital atrapado" (demasiado stock), lo opuesto de un problema de quiebre; `utils/reposicion.js` no calcula esto en absoluto.

Solo `determinarAlertaStock` (las líneas 200-204, invocadas en la línea 81) es candidata a unificarse. Confirma el criterio "quirúrgico" que pedía el encargo.

### 1.5 Riesgo de cambiar `ProductTable.jsx`

`calcNivelStock` de `ProductTable.jsx` (líneas 26-30) es la única de las 6 fórmulas que **no usa velocidad de venta en absoluto**, solo `stock_minimo` (campo editable por el administrador al crear/editar el producto, con default `5` en `database/init_pg.sql:85`). Si se reemplaza por algo basado en `utils/reposicion.js` (que usa `stock_seguridad`/`lead_time`/velocidad), el criterio de "Agotado"/"Por agotarse"/"Pedir Más" deja de depender de un número que el administrador fija a mano y empieza a depender de datos que hoy en algunos productos pueden estar en su valor por defecto (`stock_seguridad = 0`, `lead_time = 3`) sin que el administrador los haya revisado nunca. Esto puede **hacer que productos que hoy se ven "Suficiente" pasen a verse "Pedir Más"** simplemente porque nadie configuró `stock_seguridad`. Es el cambio de UX visible más delicado de todo el plan — necesita datos reales de la tienda de prueba antes de decidir.

---

## 2. Estrategia de unificación por fases

Principio general: **mover el cálculo al backend y dejar que el frontend solo pinte lo que el backend ya decidió**, en vez de intentar compartir código JS entre `utils/reposicion.js` (CommonJS, backend) y React/Vite (frontend), lo que requeriría reconfigurar el bundler para importar fuera de `frontend/src`. Esto también resuelve de una vez el problema de fondo: hoy `GET /api/productos` (`models/Product.js:5-22`) ya trae `velocity`, y el registro completo de `Productos` ya trae `stock_seguridad`, `lead_time` y `clasificacion_abc` (persistida por `Alert.generate`); solo falta que el backend haga la cuenta una vez y el frontend dejo de recalcular.

### Fase 1 — Preparación: extender `utils/reposicion.js` sin tocar ningún consumidor existente

**Qué cambia:** agregar a `utils/reposicion.js` una función pura nueva, p. ej. `clasificarNivelStock({ stock, stockSeguridad, rop })` que devuelva una etiqueta de 3 estados (`'agotado' | 'critico' | 'bajo' | 'ok'`, a definir con el dueño del producto en la pregunta abierta 1) reutilizando exactamente el mismo `riesgo` que ya calcula `calcularReposicion`. No se cambia la firma de `calcularReposicion` ni el `riesgo`/`urgencia` que ya usan el Consejero, Proveedores y Detalle de Productos.

**Archivos que toca:** `utils/reposicion.js`, `tests/business_logic/reposicion.test.js` (casos nuevos).

**Cómo se prueba:** solo pruebas unitarias nuevas en Vitest; cero superficie de UI tocada, cero riesgo de romper algo visible.

**Criterio de "listo":** `npm test` en verde, cobertura de los casos límite de la sección 3 (stock=0 sin ventas, `stockSeguridad=0` por defecto, producto sin `lead_time` configurado).

### Fase 2 — `GET /api/productos` expone el nivel de stock ya calculado (bajo una bandera nueva, sin quitar nada)

**Qué cambia:** `models/Product.js` (`findByStore`) agrega a la consulta las columnas que le faltan (`stock_seguridad`, `lead_time`, `clasificacion_abc`, ya están en `Productos`, solo hay que seleccionarlas — `SELECT p.*` ya las trae, revisar que no se pierdan al mapear) y, en el controlador (`controllers/productController.js`, la ruta que devuelve `GET /api/productos`), se le añade a cada fila un campo nuevo, por ejemplo `nivel_stock` y `urgencia`, calculado con la función de la Fase 1. **Los campos viejos (`cantidad`, `stock_minimo`, etc.) no se quitan.**

**Archivos que toca:** `models/Product.js`, el controlador que sirve `GET /api/productos` (verificar nombre exacto — hoy la ruta vive fuera de `productController.js` según lo revisado; localizar el handler real de `router.get('/')` en `routes/productRoutes.js` antes de escribir código).

**Cómo se prueba:**
- Unitaria: ninguna nueva de peso (es una consulta + una llamada a función ya probada en Fase 1).
- Manual (Playwright, tienda de prueba): pedir `GET /api/productos` y confirmar que la respuesta trae el campo nuevo con el valor esperado para 2-3 productos conocidos (uno "Agotado", uno "Pedir Más", uno "Suficiente" según hoy), sin tocar nada del frontend todavía.

**Criterio de "listo":** el campo nuevo llega correcto y el resto de la respuesta es idéntico byte a byte a como era antes (diff de la respuesta JSON antes/después salvo el campo agregado).

### Fase 3 — Migrar `ProductTable.jsx` y el hook de ordenamiento a leer el campo del backend (cambio de UX visible)

**Qué cambia:** `ProductTable.jsx` deja de calcular `calcNivelStock` localmente y usa `p.nivel_stock`/`p.urgencia` del backend; `useProductosPage.js` hace lo mismo para ordenar `listRender`. Aquí es donde se decide (pregunta abierta 1) si el nuevo criterio puede mover productos entre categorías respecto a hoy.

**Archivos que toca:** `frontend/src/components/productos/ProductTable.jsx` (líneas 26-30 y 66-109), `frontend/src/hooks/useProductosPage.js` (líneas 147-159 y 354-367).

**Cómo se prueba:**
- Unitaria: si existe (o se crea) un test de componente para `ProductTable`, actualizarlo; si no existe, no es bloqueante (hoy no hay tests de componentes React en el repo, según lo revisado — la cobertura está en `tests/business_logic/*.test.js`, backend puro).
- Manual (Playwright, sesión admin, tienda de prueba, **sin tocar la BD a mano**): abrir Catálogo antes y después del cambio, capturar qué productos dicen "Agotado"/"Por agotarse"/"Pedir Más"/"Suficiente" en ambos casos y comparar la lista completa, no solo 2-3 productos. Prestar atención especial a productos con `stock_seguridad = 0` (default), que son los que más probablemente cambien de categoría.

**Criterio de "listo":** el usuario (dueño del producto) revisó la comparación antes/después y aprobó los cambios de categoría, o se ajustaron los umbrales para que coincidan con lo esperado.

### Fase 4 — Unificar `determinarAlertaStock` en `Alert.js` (mayor cuidado: cambia notificaciones)

**Qué cambia:** reemplazar la llamada de `models/Alert.js:81` (`Alert.determinarAlertaStock(diasAgotamiento, leadTime, freqCompra)`) por una que use el `riesgo`/`urgencia` de `calcularReposicion` (o la función de clasificación de la Fase 1), manteniendo intactas las reglas de vencimiento (`determinarAlertaVencimiento`) y sobrestock (`determinarSobrestock`) tal cual están. Esto corrige de paso el hueco descrito en la sección 1.2 (producto agotado sin ventas que hoy no genera alerta).

Como `Alert.generate` ya calcula `v30`/`v7` por su cuenta (`models/Alert.js:49-50`) y ya tiene `clasificacion_abc` recién actualizada en el mismo método, alimentar `calcularReposicion` ahí es directo — no hace falta traer datos nuevos.

**Archivos que toca:** `models/Alert.js` (líneas 62-108, específicamente 80-86), `tests/business_logic/inventory_math.test.js` (ya cubre `determinarAlertaStock` con 4 casos — líneas 123-142 — hay que decidir si se conservan como snapshot del comportamiento viejo o se actualizan al nuevo).

**Cómo se prueba:**
- Unitaria: adaptar/reemplazar los 4 casos de `inventory_math.test.js` (líneas 123-142: "genera stock_critico si se agota antes que el proveedor", "genera stock_bajo en ventana de reorden", "no genera alerta con stock suficiente", "crítico cuando agotamiento = lead time exacto") para reflejar la fórmula nueva, más un caso nuevo explícito para el hueco de la sección 1.2 (producto con `cantidad=0` y `velocity30d=0` **debe** generar `stock_critico`).
- Manual (Playwright, tienda de prueba, cuenta admin y cuenta tendero para ver la campanita de ambos roles): forzar una venta que reduzca el stock de un producto de prueba por debajo del nuevo umbral, disparar `Alert.generate` (vía venta real o `POST /api/alertas/generate` desde `AlertasPage.jsx`), y verificar en Monitor Alertas + campanita + Dashboard que aparece/desaparece exactamente lo esperado. Repetir con un producto sin ventas y stock en 0 para confirmar que ahora sí genera alerta.

**Criterio de "listo":** el conteo de alertas activas antes/después se revisó a mano para la tienda de prueba completa (no solo los productos de prueba), y el dueño del producto aprobó explícitamente cualquier alerta que aparezca o desaparezca respecto a hoy (pregunta abierta 2).

### Fase 5 — `getAdvancedStats` (Nivel de Servicio Estimado) usa el mismo criterio

**Qué cambia:** `controllers/dashboardController.js:117-134` deja de tener su propio SQL de "saludable" y, o bien reutiliza la misma clasificación (trayendo `v7`/`stock_seguridad`/`lead_time`/ABC por fila y aplicando `calcularReposicion` en Node en vez de en SQL), o bien se documenta explícitamente que esta métrica es una **aproximación agregada** (KPI de una sola cifra, no por producto) y se deja como está pero con el mismo `rop` que usa `calcularReposicion` (con `factorIA` y tendencia, si se quiere fidelidad total) en vez de un ROP simplificado sin tendencia.

**Archivos que toca:** `controllers/dashboardController.js` (líneas 117-134), `tests/business_logic/dashboard_analytics.test.js` (ya cubre "Nivel de Servicio Estimado" con 4 casos, líneas 68-93 — hay que decidir si migran a Vitest sobre la función pura extraída o se quedan como test de la fórmula SQL-equivalente).

**Cómo se prueba:**
- Unitaria: actualizar los 4 casos de `dashboard_analytics.test.js` si la fórmula cambia (100% saludable, 0%, 50%, "sin catálogo → 100%").
- Manual (Playwright, tienda de prueba): comparar el porcentaje de "Nivel de Servicio Estimado" antes/después con los mismos datos, y contrastarlo contra el conteo real de `alertasCriticas`/`alertasAdvertencia` del mismo Dashboard — hoy pueden decir cosas contradictorias (ej. "95% de servicio" y "3 alertas críticas" a la vez) porque usan criterios distintos; después de esta fase deberían ser consistentes entre sí.

**Criterio de "listo":** el % de servicio y el conteo de alertas del mismo Dashboard, para la misma tienda al mismo tiempo, cuentan una historia coherente (uno no dice "todo bien" mientras el otro dice "3 críticos").

### Fase 6 — Limpieza y consolidación de las consultas de velocidad (opcional, baja prioridad)

**Qué cambia:** una vez que los 4 consumidores de "riesgo de stock" (Alert, ProductTable, hook de ordenamiento, getAdvancedStats) ya pasan por el mismo cálculo, evaluar si vale la pena extraer las 7 consultas SQL de velocidad (sección 1.3) a una única vista de Postgres o función SQL reutilizable, para que un futuro bug como el de `getAnalyticalSnapshot` (sumar todo el historial) no se pueda repetir en un octavo lugar. Esto es una mejora de mantenibilidad, no de comportamiento — se incluye aquí porque el encargo lo menciona explícitamente, pero no es indispensable para cerrar el problema de negocio.

**Archivos que toca (si se decide hacer):** `database/init_pg.sql`, `config/database.js` (auto-migración), y cada uno de los 7 consumidores listados en la sección 1.3.

**Criterio de "listo":** todas las pantallas siguen mostrando los mismos números que al final de la Fase 5, con una sola definición de "velocidad de 30 días" en el esquema en vez de 7 copias en código de aplicación.

---

## 3. Preguntas abiertas para el usuario

1. **¿Cuántos niveles debe tener la etiqueta unificada de Catálogo?** Hoy `ProductTable.jsx` distingue 4 estados visuales ("Agotado" cuando `cantidad=0`, "Por agotarse", "Pedir Más", "Suficiente" — el primero y el segundo comparten el mismo `nivelStock='critico'` pero cambian el texto según `cantidad===0`). `calcularReposicion` solo tiene 3 (`CRÍTICO`/`MEDIO`/`BAJO`). ¿Se conserva la distinción "Agotado" (stock=0) vs "Por agotarse" (crítico pero >0) como una regla adicional sobre el `riesgo` de `utils/reposicion.js`, o se simplifica a 3 estados?
2. **Cuando dos fórmulas den umbrales distintos hoy para el mismo producto, ¿cuál "gana" al unificar?** En concreto: la ventana `stock_bajo` de `Alert.js` hoy es `lead_time + frecuencia_compra_dias` (variable por producto), mientras que la urgencia "Esta semana" de `utils/reposicion.js` usa `lead_time + 7` (fijo). Para productos con `frecuencia_compra_dias` distinto de 7 (el default), estas dos reglas van a divergir. ¿Se parametriza `calcularReposicion`/su urgencia para aceptar `frecuencia_compra_dias`, o se acepta el default de 7 para todos y se homogeniza el dato en `Productos`?
3. **¿Se deben re-generar/recalcular las alertas históricas ya resueltas, o solo las nuevas?** Al cambiar `determinarAlertaStock` en la Fase 4, las alertas ya marcadas `resuelta=1` con la fórmula vieja quedan en la tabla `Alertas` con `datos_json` que refleja el cálculo anterior. ¿Se dejan como registro histórico intacto (recomendado, no se toca nada retroactivo) o se necesita un script de recálculo?
4. **`stock_minimo` (campo manual del administrador) — ¿sigue existiendo un uso después de unificar `ProductTable.jsx`?** Hoy es la única entrada del administrador para el umbral de Catálogo. Si se reemplaza por `calcularReposicion` (que no usa `stock_minimo` en absoluto, usa `stock_seguridad`+`lead_time`+velocidad), ¿el campo `stock_minimo` se deja de usar del todo, se recicla como sinónimo/valor inicial de `stock_seguridad` para productos que nunca configuraron este último, o se conserva como un piso adicional (`umbralBajo = max(rop, stock_minimo)`, como ya hace el hook de ordenamiento hoy)?
5. **Para el "Nivel de Servicio Estimado" del Dashboard (Fase 5), ¿es aceptable que se vuelva más estricto?** Al día de hoy no usa tendencia ni `factorIA`; si se une al motor completo, algunos productos que hoy cuentan como "saludables" podrían dejar de estarlo (p. ej., productos con tendencia alcista). ¿Se prioriza fidelidad total con el resto del sistema, o se prefiere mantener esta métrica deliberadamente más optimista por ser un KPI de alto nivel?
6. **Alcance de `getPromotionSuggestions` (fórmula 7, hoy fuera de este plan):** ¿confirma el usuario que "candidatos a promoción" (baja rotación/sobrestock/vencimiento próximo) debe seguir siendo una lógica separada de "riesgo de quiebre", o también debería alimentarse del mismo dato de tendencia unificado en una fase futura?

---

## 4. Plan de pruebas (resumen)

**Unitarias nuevas en `tests/business_logic/`:**
- Fase 1: casos de la función de clasificación nueva en `reposicion.test.js` — cubrir explícitamente el caso "sin ventas y stock en 0" (el hallazgo de la sección 1.2).
- Fase 4: actualizar los 4 casos existentes de "Alertas de Stock Logístico" en `inventory_math.test.js` (líneas 123-142) + 1 caso nuevo para el hueco corregido.
- Fase 5: actualizar los 4 casos de "Nivel de Servicio Estimado" en `dashboard_analytics.test.js` (líneas 68-93) si la fórmula deja de ser SQL puro.

**Verificación manual con datos reales (Playwright + tienda de prueba, sin tocar la BD a mano), por fase:**
- Fase 2: comparar respuesta JSON de `GET /api/productos` campo por campo (antes/después, salvo el campo nuevo).
- Fase 3: captura de Catálogo completo (todas las filas, no solo 2-3 productos) antes/después, revisada por el dueño del producto.
- Fase 4: forzar venta real que cruce el nuevo umbral en un producto de prueba; verificar Monitor Alertas, campanita (roles admin y tendero) y contador del Dashboard; caso especial de producto sin ventas y stock 0.
- Fase 5: comparar el % de "Nivel de Servicio Estimado" contra el conteo de `alertasCriticas`/`alertasAdvertencia` del mismo Dashboard para que no se contradigan.

---

## 5. Checklist final de "no se rompió nada" (repetir después de cada fase)

- [ ] **Dashboard** (`frontend/src/pages/DashboardPage.jsx`): el banner de bienvenida, la tarjeta de alertas y el KPI "Nivel de Servicio Estimado" muestran números consistentes entre sí para la tienda de prueba.
- [ ] **Catálogo** (`frontend/src/pages/ProductosPage.jsx` + `ProductTable.jsx`): las etiquetas "Agotado"/"Por agotarse"/"Pedir Más"/"Suficiente" de cada fila, el aviso superior y el orden de la lista coinciden entre sí (mismo criterio) y con lo que espera el dueño del producto.
- [ ] **Monitor Alertas** (`frontend/src/pages/AlertasPage.jsx`): el conteo y contenido de alertas activas (`critico`/`advertencia`/`info`) es el esperado tras forzar `Alert.generate` manualmente.
- [ ] **Campanita de notificaciones** (`NotificationCenter.jsx`): el indicador de "urgente" y el listado de alertas recientes coinciden con Monitor Alertas, para cuenta admin y cuenta tendero.
- [ ] **Detalle de Productos** (`AnalisisDetalladoPage.jsx`): `risk`/`urgencia`/`cantidad_recomendada` de un producto de prueba no cambiaron (esta pantalla ya usa `utils/reposicion.js` desde antes de este plan; solo debe verse afectada si se cambia la firma o el comportamiento de `calcularReposicion` mismo, lo cual este plan evita).
- [ ] **Proveedores** (forecast por proveedor): `nivel_riesgo`/`urgencia`/`cantidad_sugerida` de un producto de prueba conocido no cambiaron por las fases 1-5 (mismo motivo que el punto anterior).
- [ ] `npm test` (Vitest) en verde, incluyendo los archivos tocados en cada fase.

---

## 6. Estimación de esfuerzo relativo por fase

| Fase | Complejidad | Motivo |
|---|---|---|
| 1. Extender `utils/reposicion.js` | **Baja** | Función pura nueva + tests; cero superficie de UI o BD |
| 2. `GET /api/productos` expone el nivel calculado | **Baja-Media** | Requiere ubicar el handler real de la ruta (no confirmado en esta exploración que sea `productController.js`) y verificar que no se rompa el contrato JSON existente |
| 3. Migrar `ProductTable.jsx` + hook de ordenamiento | **Media** | Cambio de UX visible; la parte cara es la verificación manual exhaustiva (todas las filas de Catálogo), no el código |
| 4. Unificar `Alert.js` (`determinarAlertaStock`) | **Media-Alta** | Cambia notificaciones reales a usuarios; requiere decisión de negocio (pregunta 2) antes de escribir código, y verificación en vivo con ventas reales |
| 5. `getAdvancedStats` (Nivel de Servicio) | **Media** | Cambiar de SQL agregado a cálculo por fila en Node tiene un costo de rendimiento a evaluar si el catálogo es grande; la lógica en sí es sencilla |
| 6. Consolidar las 7 consultas de velocidad | **Alta (opcional)** | Toca 7 archivos y potencialmente el esquema (vista SQL); alto riesgo de introducir de nuevo el tipo de bug que ya se corrigió si no se hace con cuidado; no bloquea el resto del plan |

**Orden recomendado:** 1 → 2 → 3 → 4 → 5, dejando 6 como mejora técnica separada y opcional, a decidir después de ver el impacto real de las fases 1-5 en la tienda de prueba.
