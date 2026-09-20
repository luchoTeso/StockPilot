# StockPilot — Adenda al plan de rediseño visual

> **Para el agente:** esta adenda **complementa** `rediseno-visual-recomendaciones.md`. Asume que la **Fase 1 ya está aplicada** (tokens y reasignación de rampas en `index.css`). Donde haya conflicto con el plan anterior, **prevalece esta adenda**. Cada bloque indica dónde encaja.

## Resumen de cambios

| # | Cambio | Dónde encaja |
|---|---|---|
| 1 | **Fase 1b nueva:** superficies con hex escrito a mano y familias de color sueltas. **Hacerla antes de la Fase 2.** | entre la Fase 1 y la Fase 2 |
| 2 | Regla de overlay de modal (sustituye la anterior) | tabla de reglas de la Fase 2 |
| 3 | Dos reglas nuevas: etiquetas de formulario y placeholders | tabla de reglas de la Fase 2 |
| 4 | Bloque nuevo: unificar el botón primario del flujo de cobro | Fase 2, antes de "Gráficas" |
| 5 | Ampliación de "Gráficas" con los puntos exactos del Analítico | Fase 2, dentro de "Gráficas" |
| 6 | `font-outfit` no existe (29 usos) | Fase 3, antes de "Fuente" |
| 7 | Observaciones fuera de alcance: dos nuevas, una actualizada y una retirada | sección 5 |

---

## 1. Fase 1b (nueva) — va entre la Fase 1 y la Fase 2

Resultado de la Fase 1 ya aplicada: los estados (rojo y verde), los botones y badges azules, y los neutros de tarjetas cambiaron correctamente. **No cambian** los fondos de las vistas de acceso, el sidebar, el fondo del layout ni las gráficas, porque usan hex escrito a mano. Eso es lo que resuelve la Fase 1b y, para las gráficas y los toasts, la Fase 2.

### Fase 1b — Superficies con color fijo (añadida tras ver las capturas de la Fase 1)

Las capturas del Login, Recuperación, Registro y Dashboard mostraron que **la Fase 1 no alcanza a las superficies con hex escrito a mano**. Se ven grises azulados de la paleta vieja junto a tarjetas ya recoloreadas. Confirmado en el código:

| Dónde | Qué hay | Cambio |
|---|---|---|
| `LoginPage.jsx:59`, `ForgotPasswordPage.jsx:100`, `RegisterPage.jsx:77`, `ForcePasswordPage.jsx:53` | `style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)' }}` | Quitar el `style` y usar `bg-tinta` (plano) + `data-surface="dark"` en ese contenedor |
| Mismos archivos (Login 61-63, Forgot 103-104) | "blobs" decorativos `bg-indigo-600/20`, `bg-violet-500/15`, `bg-sky-500/10`, `bg-rose-500/15` con `blur-[80-120px]` | **Eliminar** los `div` (Forgot tiene uno rojo que tiñe el fondo de burdeos) |
| `Sidebar.jsx:89` y `:116` | `bg-[#334155]`, `border-[#334155]` | `bg-tinta`, `border-tinta` |
| `Sidebar.jsx:~190-193` (ítem activo) y `~163` (selector de tienda) | `bg-indigo-600 … shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/20` y `bg-indigo-600/20 text-indigo-300` | Regla de sidebar de la Fase 2: `border-l-4 border-resaltador bg-white/10 text-white` (con `border-transparent` en los inactivos). Necesario en cuanto el fondo pase a tinta: azul sobre tinta separa 1,52:1. |
| `DashboardLayout.jsx:97` | `bg-[#f8fafc]` (pisa el fondo `papel` del `body`) | `bg-papel` |
| `ForgotPasswordPage.jsx:109` | barra superior `bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500` | `bg-azul` plano (Login y Registro ya usan barra plana) |
| `ForgotPasswordPage.jsx:147` | botón principal `bg-slate-900 border border-slate-800` | `bg-azul hover:bg-azul-hondo`, igual que Login. Hoy el flujo de acceso tiene **dos colores de botón primario** (Login azul, Recuperación casi negro). |
| `LoginPage.jsx:110,129` | `shadow-lg shadow-indigo-100` en el botón | quitar la sombra de color |

**Familias sueltas fuera de la Fase 1.** Las capturas del POS muestran, por ejemplo, el ícono naranja de "Fiado" en el tono viejo junto al ámbar nuevo. Añadir al `@theme` estas reasignaciones (mismos valores por tono que la rampa de destino): `orange` (11 usos) → rampa `amber`; `red` (14) → rampa `rose`; `blue` (14), `sky` (4) y `cyan` (2) → rampa `indigo`; `yellow` (3) → rampa `amber`; `purple` y `fuchsia` (14) → rampa `indigo`.

**Orden recomendado:** hacer la Fase 1b **antes** que cualquier otra cosa. En las capturas del Analítico y de Auditoría el sidebar (`#334155`, gris pizarra) convive con paneles y cabeceras de tabla en `tinta` (`#14173F`, azul noche): dos azules oscuros distintos en la misma pantalla.

**Criterios de aceptación de la Fase 1b:** ninguna de las cuatro vistas de acceso muestra gris pizarra ni tonos rojizos; el sidebar y las tarjetas comparten la misma familia de color; el flujo Login → Recuperación → Registro usa un único color de botón primario.

---

## 2. Cambios en la tabla de reglas de componente (Fase 2)

**Sustituir** la fila `Overlay de modal` por:

| Overlay de modal | `bg-tinta/60` (`backdrop-blur-sm` opcional). Hoy es `bg-slate-900/40` o `/50` con blur, y en las capturas se ve como una niebla lavanda; con `/60` y sin blur el modal gana foco. Los 33 overlays existentes (`/40`, `/50`, `/60`) deben unificarse en `/60`. |

**Añadir** estas dos filas (junto a `Input` y `Texto`):

| Etiqueta de formulario | `text-xs font-semibold text-slate-600` (hoy `text-[10px] font-bold text-slate-400 uppercase tracking-widest`: 2,96:1, ilegible) |
| Placeholder | `placeholder:text-slate-500` (en Registro hoy se ve casi invisible) |

---

## 3. Bloque nuevo en la Fase 2 (antes del apartado "Gráficas")

**Flujo de cobro (POS): unificar el botón primario.** Hoy conviven **cuatro** colores de acción principal: `Cobrar` en verde (`emerald`), `Confirmar y Facturar` en `bg-slate-900` (casi negro; `PaymentModal.jsx:183`), `Activar oferta` y Login en azul, y `Recuperar mi cuenta` en `bg-slate-900`. Regla propuesta:

| Botón | Clases |
|---|---|
| `Cobrar` (`CajaRapidaTab.jsx`, ~línea 320) y `Confirmar y Facturar` | `bg-resaltador text-tinta ring-1 ring-tinta/25 hover:bg-resaltador-hondo` — "la acción que mueve dinero" es el único elemento amarillo del POS |
| Resto de acciones principales de la app | `bg-azul text-white hover:bg-azul-hondo` |

**Decisión del usuario:** el verde de `Cobrar` es una convención de POS muy reconocible y ya quedó dentro de la paleta (familia `exito`), así que mantenerlo es defendible. Si se mantiene, `Confirmar y Facturar` debe pasar también a verde (`bg-exito`) y no quedarse en casi negro. Lo que **no** conviene es dejar el flujo con dos colores distintos en pasos consecutivos.

**Selección de método de pago:** los tres estados seleccionados en verde (tile "Efectivo", foco del input, "Cambio a devolver") están bien: en ese contexto el verde significa "dinero recibido", no "primaria".

---

## 4. Ampliación del apartado "Gráficas" (Fase 2)

Añadir al final del apartado, después del código de `chartColors.js` y la regla de no depender solo del color. Añadir además `onDark: '#FFD84A'` al objeto `CHART`.

**Confirmado en las capturas del Analítico:** las gráficas siguen en la paleta vieja (barras periwinkle `#6366f1` con `fillOpacity` .85, línea verde `#10b981`, barras rosadas `#f43f5e`) y **chocan con el azul profundo** de las tarjetas KPI que tienen encima. Puntos exactos en `AnalyticsDashboardPage.jsx`: línea 12 (`A: { main: '#6366f1', light: '#e0e7ff', border: '#c7d2fe', glow: 'shadow-indigo-200/50' }`), 249, 253, 256, 386-394, 443 y 487-488. Mapear: clase A → `CHART.primary`, B → `CHART.secondary`, C → `CHART.neutral`; `<5 días` → `CHART.negative`, `<15` → `CHART.secondary`, `>15` → `CHART.positive`.

**Panel oscuro "Ritmo de caja semanal":** sobre fondo `tinta` el azul `#252C93` no se ve. Usar `CHART.onDark = '#FFD84A'` (resaltador) para la curva y sus degradados de área (`stopColor`). Es la única serie protagonista del panel.

**Tamaño de texto en ejes:** hay `fontSize={8}`, `{9}` y `{10}` (10 ocurrencias en total). Las etiquetas rotadas de los productos se leen mal. Subir todas a `12`.

---

## 5. Fase 3 — añadir antes del párrafo "Fuente"

**Ojo con `font-outfit`:** aparece **29 veces** en el JSX y **no existe en ninguna parte** (ni `@theme`, ni `@font-face`, ni `<link>`). Es una clase sin efecto. Quitarla de los 29 sitios; la tipografía debe salir de `--font-sans`.

---

## 6. Sección 5 (observaciones fuera de alcance) — cambios

**Sustituir** la observación del "+0u" por:

- **Dashboard → Consejero IA:** las capturas nuevas muestran "Sugerido: +0u" en las **cuatro** tarjetas visibles (Arroz Diana, Agua Cristal, Huevos, Coca-Cola), todas "Alta demanda" y con texto que recomienda aumentar el stock. Que ocurra en todas apunta a un problema de **mapeo de campo** entre el backend y el frontend, más que a un dato puntual. Contradicción lógica o de datos (revisar el controlador de IA o el mapeo en el frontend). Perjudica la credibilidad de la demo.

**Retirar** la observación de la lista cortada y dejar solo esta nota:

- ~~**Dashboard → Consejero IA:** la lista se corta en el borde inferior.~~ **Retirada.** Las capturas del Analítico muestran el mismo recorte exactamente a la altura donde termina el sidebar (el alto del viewport), lo que indica un **artefacto de la captura de página completa**, no un defecto del diseño. Si al hacer scroll normal en el navegador la lista se ve completa, ignorar.

**Añadir:**

- **El sidebar queda por encima del overlay de los modales.** `Sidebar.jsx:88` usa `z-[200]` y `PaymentModal.jsx:85` usa `z-[100]`: con el modal de pago abierto el menú lateral sigue visible, sin oscurecer y clicable, así que se puede navegar con un cobro a medias. Subir el overlay por encima del sidebar (p. ej. `z-[300]`) o bajar el sidebar. Es un defecto de UX, no de estilo.
- **Auditoría: 5 tarjetas en un grid de 4 columnas** (`AuditoriaPage.jsx:83`, `lg:grid-cols-4`) dejan la quinta ("Última consulta") sola en una segunda fila. Pasar a `lg:grid-cols-5` o reagrupar.
