# StockPilot — Rediseño visual: revisión del plan y recomendaciones

> **Para el agente:** este documento complementa y **corrige** `implementation_plan remodelación.md`. Donde ambos difieran, prevalece este. Trabaja por fases, un commit por fase (o por grupo de archivos), y no pases a la siguiente sin cumplir los criterios de aceptación de la actual.

> **Estado: verificado sobre el código real** (`frontend.zip`, 52 `.jsx` / 13.000 líneas). Se instaló, se compiló (`npm run build` ✓ en 8,7 s, 2.574 módulos) y se probó la técnica de la Fase 1 en una copia desechable: **`@theme` funciona** con Tailwind v4.2.1 + `@tailwindcss/vite`. Las cifras de este documento salen de ese análisis, no de estimaciones.

## 0. Reglas de trabajo

- Solo cambios de **clases, estilos y tokens**. No modificar lógica, props, rutas ni backend. No agregar dependencias.
- No usar `!important`. No crear ni editar `tailwind.config.js` para colores (Tailwind v4: todo va en `@theme` dentro de `index.css`).
- No reiniciar la paleta por defecto (`--color-*: initial`): la migración es gradual y las clases viejas deben seguir funcionando hasta terminar.
- Nombre de rama sugerido: `feature/rediseno-visual` (sin `ñ`; algunos Git tooling y CI la manejan mal).
- Si un color no aparece en las tablas de este documento, **no improvises**: usa el criterio de la sección 4 o deja un comentario `/* TODO(diseño): ... */` y repórtalo al final.

## 1. Contexto y alcance real (medido)

- **Origen de la paleta:** la nueva landing (`src/pages/LandingPage.jsx`, ya en el proyecto, versión con nav pegajoso y azul `#252C93`). Idea visual: azul esfero, tinta, papel y un amarillo resaltador usado con moderación.
- **Stack confirmado:** React 19, Vite 5.4, Tailwind **v4.2.1** vía plugin `@tailwindcss/vite` (no PostCSS). **No existe `tailwind.config.js`**, así que `@theme` en `index.css` es la única vía. `index.css` son 68 líneas.
- **Línea base:** `npm run build` pasa. Advertencia preexistente de chunks > 500 kB (`index` 650 kB, `ui` 447 kB), ajena a este trabajo.
- **Sin tests:** no hay `*.test.*` ni `*.spec.*`. La carpeta `test-results/` está vacía. No hay riesgo de romper snapshots.
- **Finales de línea CRLF.** Las herramientas deben preservarlos o el diff saldrá con el archivo entero modificado.

### Volumen real de color

**2.991 ocurrencias** de clases de color (la medición previa de 655 contaba *líneas* con un patrón parcial).

| Familia | Ocurrencias | Destino |
|---|---:|---|
| `slate` | 1.489 | neutros → reasignar rampa (matiz azul) |
| `indigo` | 688 | marca → `azul` |
| `rose` | 292 | estado error → `peligro` |
| `emerald` | 260 | estado éxito → `exito` |
| `amber` | 168 | estado aviso → `aviso` |
| `violet` | 32 | marca → `azul` |
| `red` 14, `blue` 14, `orange` 11, `purple` 7, `fuchsia` 7, `sky` 4, `yellow` 3, `cyan` 2 | 62 | casos sueltos, revisar uno a uno |

Tonos dominantes: `slate-100` (267), `slate-400` (252), `slate-800` (226), `indigo-600` (212), `slate-50` (199), `slate-200` (159), `slate-500` (155), `indigo-500` (132).

### Hallazgos que cambian el plan

1. **Los estados ya están ordenados.** `rose`, `emerald` y `amber` se usan de forma consistente como error, éxito y aviso. No hay que "introducir" semántica: basta reasignar esas tres rampas en `@theme` y el trabajo de estados queda hecho sin tocar JSX.
2. **No hay clases dinámicas rotas.** Cero coincidencias de `` bg-${...} ``. `ConfirmDialog.jsx` usa un mapa con nombres de clase completos, que es el patrón correcto. **Este riesgo queda descartado.**
3. **Casi no hay gradientes.** 8 `bg-gradient-to-*` y 15 `from-/via-/to-` de color, en 7 archivos. Era un punto menor, no estructural.
4. **Las sombras de color sí son el rasgo dominante:** **113** (`shadow-indigo-200` 18, `shadow-indigo-100` 18, `shadow-amber-200` 9, `shadow-rose-200` 8, `shadow-emerald-200` 8…) más **15** `shadow-[...]` arbitrarias, incluidas "glows" (`shadow-[0_0_12px_#6366f1]`, `shadow-[0_0_15px_#10b981]`). Esto es lo que da el aire de plantilla, más que los gradientes.
5. **La tipografía es el problema mayor, no el color:** **663** `font-black`, **606** `uppercase`, **478** tamaños por debajo de 12 px (`text-[10px]` 352, `text-[9px]` 104, `text-[8px]` 10), **117** `italic`, **77** `tracking-[...]`. La Fase 3 deja de ser opcional.
6. **La fuente `Inter` se declara pero nunca se carga.** `index.css` pide `'Inter', 'Segoe UI', sans-serif` y no hay ningún `<link>` ni `@font-face`. Hoy la app se ve en Segoe UI (o en el fallback del sistema, distinto en cada equipo). Cargar Archivo no añade una petición nueva: corrige algo que ya estaba mal.
7. **El sidebar no usa `bg-indigo-600/20` en la navegación.** Su fondo es `bg-[#334155]` y el ítem activo es `bg-indigo-600` sólido con `shadow-indigo-600/30` y `ring-indigo-400/20`. El `/20` aparece solo en el selector de tienda (línea ~163). La corrección sobre visibilidad sigue aplicando, pero por otra razón: ver la sección 3.
8. **Solo 3 clases arbitrarias con hex** (`bg-[#334155]`, `border-[#334155]`, `bg-[#f8fafc]`), todas en `Sidebar.jsx` y `DashboardLayout`. Fáciles de migrar.
9. **Hex sueltos: 100 ocurrencias en 13 archivos**, concentradas en gráficas: `AnalyticsDashboardPage` (45), `AprendizajePage` (9), `ReportesPage` (6), `ToastContext` (8). Los más repetidos: `#6366F1` (16), `#10B981` (10), `#1E293B` (8), `#334155` (7), `#64748B` (6).
10. **Radios muy grandes y variados:** `rounded-2xl` 207, `rounded-full` 118, `rounded-[2.5rem]` 57, `rounded-[2rem]` 48, `rounded-3xl` 27, `rounded-[3rem]` 8, más `[1.5rem]`, `[1.8rem]`, `[1.6rem]`, `[1.25rem]`. Conviene reducirlos a una escala de 2 o 3 valores.
11. **Fuera de alcance, pero reportar:** `react-router-dom` y `axios` están en `devDependencies` y son dependencias de ejecución. El build funciona porque Vite los empaqueta, pero la clasificación es incorrecta.

## 2. Respuestas a las preguntas abiertas del plan

| Pregunta | Decisión |
|---|---|
| ¿`@theme` en `index.css`? | **Sí.** Es la forma correcta en Tailwind v4 y habilita `bg-tinta`, `text-azul`, `bg-tinta/60`, etc. |
| ¿Botón primario azul y resaltador solo para alertas? | **Parcialmente.** Azul en superficies claras. **En superficies oscuras el azul no se ve** (azul sobre tinta = 1,52:1): ahí el primario es resaltador con texto tinta. Las alertas usan `peligro` / `aviso`, **no** resaltador. El resaltador se reserva para "lo que hay que hacer ahora" (p. ej. "Pagar ahora" en POS), máximo uno por pantalla. |
| ¿Modales `bg-tinta/60 backdrop-blur`? | **Sí `bg-tinta/60`.** El `backdrop-blur` es opcional (cuesta rendimiento en equipos modestos); solo el color ya cumple. |

## 3. Correcciones al plan original

| Punto del plan | Cambio | Motivo |
|---|---|---|
| Sidebar activo `bg-azul/20` | Usar `bg-white/10` + barra izquierda `border-resaltador` | **Corregido tras ver el código:** la navegación no usa `/20`, usa `bg-indigo-600` sólido. Aun así hay que cambiarlo: azul sobre tinta separa 1,52:1 (hoy indigo sobre `#334155` separa 1,65:1, ya flojo). El texto blanco se lee (11,29:1), pero el pill no se distingue del fondo. Con `bg-white/10` + barra resaltador la separación deja de depender del color. El `bg-indigo-600/20` del selector de tienda (línea ~163) va a `bg-white/10 text-white`. |
| Solo se añade `ambar` | Añadir `exito`, `peligro`, `aviso` **y reasignar las rampas `emerald`, `rose` y `amber`** | El código ya usa esas tres familias con semántica consistente (720 ocurrencias). Reasignarlas resuelve los estados en la Fase 1, sin tocar JSX. |
| "Actualizar gradientes" | **Eliminar sombras de color** (113 con clase + 15 arbitrarias, incluidos los "glows") y los 23 gradientes; tarjetas planas con borde | **Ajustado:** los gradientes eran pocos (23). El rasgo de plantilla son las sombras de color y los glows. |
| Lista de 7 archivos | Alcance real: **2.991 ocurrencias de color en ~46 archivos**, más 1.864 rasgos tipográficos | Ver sección 1. |
| Ningún paso de reasignación | Añadir **Fase 1** (reasignar rampas en `@theme`) | **Probado:** con solo reasignar `@theme`, `.bg-indigo-600` compila a `background-color: var(--color-indigo-600)` con el valor nuevo, y `bg-tinta/60` genera `color-mix(...)` correctamente. Cambia el tono de toda la app sin tocar JSX. |
| Verificación solo visual | Ampliar (build, lint, greps, estados, contraste) | Ver Fase 4. No hay tests: la verificación manual es la única red. |

## 4. Fases

### Fase 0 — Preparación (sin cambios visibles)

El inventario **ya está hecho** (sección 1); no lo repitas. Solo queda:

1. Crear rama `feature/rediseno-visual` (sin `ñ`: algunas herramientas de Git y CI la manejan mal).
2. Confirmar la línea base: `npm install` y `npm run build`. Debe pasar; anota el tamaño del CSS (**113,39 kB / 17,06 kB gzip**) para compararlo al final.
3. Tomar **capturas "antes"** de: Login, Dashboard, Punto de Venta (flujo de cobro), Productos (crear/editar), Alertas, Notificaciones, Tiendas, Auditoría, Analítica (gráficas), Cartera y un modal de confirmación. Sin esto no hay forma de verificar las fases siguientes, porque no hay tests.
4. Configurar el editor para **preservar CRLF** (`.gitattributes` con `*.jsx text eol=crlf` o equivalente), o el diff será ilegible.

### Fase 1 — Tokens y reasignación (un solo archivo: `index.css`)

Objetivo: que toda la app adopte la paleta **sin editar JSX**. Verificado en una copia desechable con Tailwind v4.2.1: las clases `bg-tinta/60`, `text-azul`, `bg-papel`, `border-resaltador`, `ring-azul/30` y `hover:bg-azul` se generan bien, y la reasignación de `indigo-600` y `slate-900` se propaga a todo el CSS compilado.

Sustituir la primera línea de `src/index.css` (`@import "tailwindcss";`) por este bloque, **conservando todo lo que ya hay debajo** (`.grain-bg`, `.scrollbar-hide`, `.scrollbar-premium`), salvo las reglas de `body`, que se reemplazan.

```css
@import "tailwindcss";

@theme {
  /* ── Marca ── */
  --color-tinta: #14173F;
  --color-tinta-2: #3A3F6E;          /* texto secundario */
  --color-azul: #252C93;             /* acción principal en superficies claras */
  --color-azul-hondo: #1C2277;       /* hover / active del azul */
  --color-papel: #EEF0F8;            /* fondo de app */
  --color-resaltador: #FFD84A;       /* acción principal en superficies oscuras / CTA puntual */
  --color-resaltador-hondo: #FFC81A; /* hover del resaltador */

  /* ── Estados: alias semánticos ── */
  --color-exito: #0B6B45;    --color-exito-suave: #DDF3E9;
  --color-peligro: #B42A26;  --color-peligro-suave: #FBE3E1;
  --color-aviso: #8A5300;    --color-aviso-suave: #FFF1D6;
  --color-ambar: #E08A00;    /* SOLO rellenos, barras e íconos. Nunca texto. */

  /* ── Transitorio: indigo y violet pasan a ser UNA familia (matiz ~236°; 600 = azul) ── */
  --color-indigo-50: #EFEFFB;  --color-indigo-100: #DEE0F7; --color-indigo-200: #C3C6EF;
  --color-indigo-300: #989DE2; --color-indigo-400: #6C72D0; --color-indigo-500: #4048BF;
  --color-indigo-600: #252C93; --color-indigo-700: #1D2272; --color-indigo-800: #151A56;
  --color-indigo-900: #0E1139; --color-indigo-950: #090B2B;
  --color-violet-50: #EFEFFB;  --color-violet-100: #DEE0F7; --color-violet-200: #C3C6EF;
  --color-violet-300: #989DE2; --color-violet-400: #6C72D0; --color-violet-500: #4048BF;
  --color-violet-600: #252C93; --color-violet-700: #1D2272; --color-violet-800: #151A56;
  --color-violet-900: #0E1139;
  /* purple-* y fuchsia-* aparecen 14 veces en total: darles los mismos valores. */

  /* ── Neutros con matiz azul (permanente): coherentes con tinta y papel ── */
  --color-slate-50: #F5F6FB;  --color-slate-100: #EEF0F8; --color-slate-200: #DDE0EF;
  --color-slate-300: #C3C7DE; --color-slate-400: #8F94B8; --color-slate-500: #6A6F99;
  --color-slate-600: #4F5480; --color-slate-700: #3A3F6E; --color-slate-800: #24295A;
  --color-slate-900: #14173F; --color-slate-950: #0B0D2B;

  /* ── Estados ya usados con semántica correcta: se realinean al tono nuevo ──
     emerald = éxito · rose = error · amber = aviso.
     Esto resuelve 720 ocurrencias sin tocar JSX. */
  --color-emerald-50: #EAF7F0;  --color-emerald-100: #DDF3E9; --color-emerald-200: #B9E4D0;
  --color-emerald-300: #8ACFB1; --color-emerald-400: #4FAE87; --color-emerald-500: #1F8A61;
  --color-emerald-600: #0B6B45; --color-emerald-700: #085538; --color-emerald-800: #06422C;
  --color-emerald-900: #04301F;
  --color-rose-50: #FDF0EF;  --color-rose-100: #FBE3E1; --color-rose-200: #F5C3BF;
  --color-rose-300: #EC9B95; --color-rose-400: #DC6660; --color-rose-500: #C93F39;
  --color-rose-600: #B42A26; --color-rose-700: #8F201D; --color-rose-800: #6E1917;
  --color-rose-900: #521311;
  --color-amber-50: #FFF8E9;  --color-amber-100: #FFF1D6; --color-amber-200: #FFE0A3;
  --color-amber-300: #FFCE6B; --color-amber-400: #F5AE23; --color-amber-500: #E08A00;
  --color-amber-600: #B86F00; --color-amber-700: #8A5300; --color-amber-800: #6B4000;
  --color-amber-900: #4F2F00;

  /* ── Tipografía (ver Fase 3; declararla aquí no cambia nada hasta cargar la fuente) ── */
  --font-sans: 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

@layer base {
  body { background-color: var(--color-papel); color: var(--color-tinta); }
  :focus-visible { outline: 3px solid var(--color-azul); outline-offset: 2px; }
  [data-surface="dark"] :focus-visible { outline-color: #fff; }
}
```

Además, en esta misma fase:
- **`body` en `index.css`:** reemplazar `color: #1f2937` y `background-color: #f8fafc` por los tokens (quedan dentro de `@layer base`; borrar los de la regla `body` original para no duplicar). Dejar el `font-family` como está hasta la Fase 3.
- **`index.html`:** `<meta name="theme-color" content="#252C93">` (hoy dice `#4f46e5`). Revisar también `public/manifest.json` y el favicon.
- **`data-surface="dark"`:** añadirlo al contenedor del `Sidebar` y a los paneles oscuros de las vistas de autenticación.

**Criterios de aceptación:** `npm run build` sin errores; la app carga con el tono nuevo; **ningún cambio de layout**; capturas "después" comparables con las "antes"; el CSS resultante no debe crecer de forma significativa respecto a los 113 kB de línea base.

### Fase 2 — Migración a tokens, archivo por archivo

Con la Fase 1 hecha, la app ya se ve bien; esta fase deja el código **con nombres honestos** (un `bg-indigo-600` que renderiza `#252C93` es engañoso) y elimina lo decorativo.

**Equivalencias:**

| Actual | Nuevo |
|---|---|
| `bg-indigo-600`, `bg-violet-600` | `bg-azul` |
| `hover:bg-indigo-700` / `violet-700` | `hover:bg-azul-hondo` |
| `text-indigo-*`, `text-violet-*` (500–700) | `text-azul` |
| `bg-indigo-50/100`, `bg-violet-50/100` | `bg-azul/10` |
| `border-indigo-*`, `ring-indigo-*` | `border-azul/30`, `ring-azul/30` |
| `bg-gradient-to-* from-* to-*` | color plano (`bg-azul`, `bg-white` o `bg-tinta`); eliminar `via-*` |
| `shadow-indigo-*` y sombras de color | `shadow-sm` o quitarlas |
| Círculos/blobs decorativos con `blur` | eliminar |
| `bg-slate-900`, `bg-slate-800`, `text-slate-900`, `text-slate-800` | `bg-tinta`, `text-tinta` |
| `text-slate-700` | `text-tinta-2` |
| `slate-50/100/200/300/400/500/600` | **dejar** (ya son neutros con matiz azul; no migrar) |
| Verdes/rojos/ámbar de estado | `exito`/`peligro`/`aviso` (ver reglas) |

**Reglas de componente:**

| Elemento | Clases |
|---|---|
| Botón primario (superficie clara) | `bg-azul text-white hover:bg-azul-hondo` |
| Botón primario sobre oscuro (login, sidebar, modal oscuro) | `bg-resaltador text-tinta hover:bg-resaltador-hondo` |
| CTA puntual de máxima jerarquía (Pagar ahora, Cobrar) — máx. 1 por pantalla | `bg-resaltador text-tinta ring-1 ring-tinta/25 hover:bg-resaltador-hondo` (el anillo es necesario: resaltador sobre blanco es 1,38:1) |
| Botón secundario | `bg-white text-tinta border border-tinta/20 hover:bg-papel` |
| Botón destructivo | `bg-peligro text-white hover:bg-peligro/90` |
| Deshabilitado | `disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed` |
| Badge de éxito / error / aviso | `bg-exito-suave text-exito` / `bg-peligro-suave text-peligro` / `bg-aviso-suave text-aviso` |
| Badge informativo | `bg-azul/10 text-azul` |
| Sidebar (contenedor) | `bg-tinta text-white` + `data-surface="dark"` |
| Sidebar, ítem inactivo | `border-l-4 border-transparent text-white/70 hover:bg-white/10 hover:text-white` |
| Sidebar, ítem activo | `border-l-4 border-resaltador bg-white/10 text-white` (el `border-transparent` en los inactivos evita saltos de layout) |
| Encabezado de tabla | `bg-tinta text-white text-xs font-semibold` |
| Overlay de modal | `bg-tinta/60` (`backdrop-blur-sm` opcional) |
| Tarjeta | `bg-white border border-tinta/10` (sombra como máximo `shadow-sm`, sin gradientes) |
| Input | `border-slate-300 focus:border-azul focus:ring-2 focus:ring-azul/30` |
| Barra de progreso / confianza | relleno `bg-ambar` sobre pista `bg-slate-200` |
| Texto | títulos `text-tinta`; secundario `text-tinta-2` o `text-slate-600`. **Evitar** `text-slate-500` sobre `bg-papel` (4,25:1) y `text-slate-400` para texto útil (2,96:1). |

**Gráficas:** centralizar colores en un archivo, sin hex sueltos en los componentes.

```js
// src/theme/chartColors.js
export const CHART = {
  primary: '#252C93',
  secondary: '#E08A00',
  positive: '#0B6B45',
  negative: '#B42A26',
  soft: '#989DE2',
  neutral: '#8F94B8',
};
export const CHART_SERIES = [CHART.primary, CHART.secondary, CHART.positive, CHART.soft, CHART.neutral];
```

Regla: no depender solo del color; usar leyendas, etiquetas o patrones.

**Sombras y glows (el rasgo de plantilla más fuerte: 128 ocurrencias).**

| Actual | Nuevo |
|---|---|
| `shadow-indigo-100/200`, `shadow-rose-200`, `shadow-emerald-200`, `shadow-amber-200` | `shadow-sm` o quitar |
| `shadow-indigo-600/20`, `shadow-indigo-500/10`, `shadow-*-500/30` | quitar |
| `shadow-[0_0_12px_#6366f1]`, `shadow-[0_0_8px_#10b981]`, `shadow-[0_0_50px_rgba(...)]` (glows) | **eliminar** |
| `shadow-2xl`, `shadow-xl` en tarjetas y modales | `shadow-lg` en modales, `shadow-sm` o nada en tarjetas |

Las sombras neutras suaves (`shadow-slate-200/50`) pueden quedarse.

**Orden de migración** (ocurrencias reales de clases de color por archivo):

| Grupo | Archivos (ocurrencias) |
|---|---|
| **A · Estructura y primera impresión** | `Sidebar` (54, + 3 hex arbitrarios `#334155`), `DashboardLayout`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ForcePasswordPage`, `RegistroTenderoPage` (118), `App.jsx`, `ToastContext` (8 hex) |
| **B · Uso diario** | `DashboardPage` (163), `ProductFormModal` (185), `PuntoVentaPage` y `components/puntoventa/*`, `ProductosPage`, `ProductTable`, `PromoManualModal`, `AlertasPage`, `NotificationCenter` (81), `PaymentModal`, `CashRegisterModal`, `ExpenseModal`, `CameraScannerModal`, `ConfirmDialog`, `CustomSelect`, `CustomDatePicker`, `Tooltip`, `ScrollToTopButton` |
| **C · Resto** | `TiendasPage` (258), `AprendizajePage` (129), `ProfilePage` (123), `ReportesPage` (120), `AuditoriaPage` (119), `MovimientosPage` (118), `AnalyticsDashboardPage` (109), `OrdenesHistory` (104), `SimuladorPage` (100), `CarteraPage` (85), `SmartOrderModal` (68), `AnalisisDetalladoPage`, `ProveedorFormModal`, `ComunicadosPage`, `ProveedoresPage`, `ProveedorGrid`, `proveedores/PaymentModal` |

`TiendasPage` (258 ocurrencias en 681 líneas) y `ProductFormModal` (185 en 708) son los más pesados y de menor visibilidad. Si tienen bloques repetidos, aprovechar para extraer componentes.

**Criterios de aceptación de la Fase 2:**

```powershell
# deben dar 0
Get-ChildItem src -Recurse -Include *.jsx | Select-String -Pattern '-(indigo|violet|purple|fuchsia)-\d' | Measure-Object
Get-ChildItem src -Recurse -Include *.jsx | Select-String -Pattern 'shadow-(indigo|violet|rose|emerald|amber)-\d' | Measure-Object
Get-ChildItem src -Recurse -Include *.jsx | Select-String -Pattern 'shadow-\[0_0_' | Measure-Object
# partida de 2.991 -> debe bajar a las familias neutras y de estado
Get-ChildItem src -Recurse -Include *.jsx | Select-String -Pattern '#(6366f1|4f46e5|4338ca|818cf8|8b5cf6|1e293b|0f172a|334155)' | Measure-Object
```

- Ningún hex de la paleta vieja fuera de `index.css` y `chartColors.js`.
- Las 3 clases arbitrarias (`bg-[#334155]`, `border-[#334155]`, `bg-[#f8fafc]`) migradas a tokens.
- Overlays: los 33 `bg-slate-900/40|50|60` a `bg-tinta/…`.
- Al terminar, **eliminar** del `@theme` los bloques `indigo-*` y `violet-*`. **Conservar** `slate-*`, `emerald-*`, `rose-*` y `amber-*`.
- `npm run build` pasa y el CSS no crece respecto a la línea base.

### Fase 3 — Tipografía y forma (PR aparte, **no opcional**)

El conteo cambia la prioridad: **1.864 rasgos tipográficos** superan en volumen al trabajo de color. Cambiar solo colores dejaría la app igual de genérica.

| Rasgo | Ocurrencias | Acción |
|---|---:|---|
| `font-black` | 663 | → `font-bold` (o `font-semibold`); reservar 800+ para titulares |
| `uppercase` | 606 | quitar salvo en etiquetas muy cortas; usar minúscula normal |
| `text-[10px]` | 352 | → `text-xs` (12 px) |
| `text-[9px]` | 104 | → `text-xs` |
| `italic` | 117 | quitar en la UI (era el rasgo de la landing vieja) |
| `tracking-[...]` | 77 | quitar salvo en etiquetas en mayúscula que sobrevivan |
| `text-[8px]` | 10 | → `text-xs` |

**Fuente.** `index.css` declara `'Inter', 'Segoe UI', sans-serif` pero **Inter nunca se carga**: hoy la app se ve en Segoe UI o en el fallback de cada equipo. Cargar Archivo corrige eso, no añade peso de más.

- En `index.html`, antes de `</head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
```
- En `index.css`, cambiar el `font-family` del `body` a `var(--font-sans)` (el token ya quedó en la Fase 1).
- **Quitar el `@import url(...)` de la línea 368 de `LandingPage.jsx`**, que queda duplicado. Un `@import` dentro de `<style>` bloquea el render y se dispara en cada montaje del componente.

**Utilidad de titulares:**
```css
@utility titular { font-weight: 800; font-stretch: 75%; letter-spacing: -0.005em; line-height: 1; }
```

**Forma.** Hoy hay 10 radios distintos (`rounded-2xl` 207, `rounded-full` 118, `rounded-[2.5rem]` 57, `rounded-[2rem]` 48, `rounded-3xl` 27, `rounded-[3rem]` 8, más `[1.5rem]`, `[1.8rem]`, `[1.6rem]`, `[1.25rem]`). Reducir a tres:

| Uso | Clase |
|---|---|
| Controles (inputs, botones) | `rounded-lg` |
| Tarjetas y modales | `rounded-2xl` |
| Avatares, píldoras, íconos circulares | `rounded-full` |

Todos los `rounded-[Nrem]` (≈115 ocurrencias) van a `rounded-2xl`.

**Movimiento.** Quitar transiciones decorativas (`hover:scale-110`, `hover:-translate-y-*` en tarjetas); conservar las que responden a una acción. Respetar `prefers-reduced-motion`.

**Efectos.** `backdrop-blur` aparece 40 veces (`-sm` 22, `-md` 11, `-xl` 7). Dejar como máximo `backdrop-blur-sm` en overlays de modal y quitar el resto: cuesta rendimiento en los equipos modestos de una tienda. La textura `.grain-bg` de `index.css` también conviene revisarla.

### Fase 4 — Verificación

**No hay tests automáticos en el proyecto**, así que la verificación manual es la única red. No la recortes.

**Automática**
- `npm run build` (línea base: ✓ en 8,7 s, CSS 113,39 kB / 17,06 kB gzip) y `npm run lint`.
- Los greps de los criterios de las Fases 2 y 3.

**Manual** (viewports 1440, 1024 y 390 px)
- Pantallas: Login, Registro, Recuperar contraseña, Dashboard, POS (flujo de cobro completo), Productos (crear/editar), Alertas, Notificaciones, Tiendas, Auditoría, Analítica (gráficas), Cartera, Aprendizaje, Simulador, y los modales (confirmar, pago, caja, escáner).
- Estados en cada una: hover, **foco con Tab**, deshabilitado, error, cargando, vacío.
- Comparar con las capturas "antes".
- Contraste con DevTools en los pares críticos (apéndice A), sobre todo donde hoy se usa `text-slate-400` (**251 ocurrencias**): con la rampa nueva queda en `#8F94B8`, que da 2,96:1 sobre blanco. **Sirve para bordes e íconos decorativos, no para texto.** Revisar cuáles de esas 251 son texto informativo y subirlas a `text-slate-500` o `text-slate-600`.

## 5. Observaciones fuera del alcance visual (reportar, no arreglar aquí)

- **Dashboard → Consejero IA:** una tarjeta muestra "Sugerido: +0u" mientras su texto recomienda aumentar el stock. Contradicción lógica o de datos (revisar el controlador de IA o el mapeo en el frontend). Perjudica la credibilidad de la demo.
- **Dashboard → Consejero IA:** la lista se corta en el borde inferior sin indicador de scroll. Si el `overflow` es intencional, añadir un degradado o sombra; si no, quitar la altura fija.
- **`react-router-dom` y `axios` están en `devDependencies`** y son dependencias de ejecución. El build funciona porque Vite los empaqueta, pero la clasificación es incorrecta y puede fallar en un despliegue con `npm install --production`.
- **Chunks grandes:** `index` 650 kB y `ui` 447 kB sin comprimir. Preexistente y ajeno a este trabajo, pero vale la pena anotarlo (carga diferida de `recharts` en las páginas de analítica).
- **`LandingPage.jsx` carga fuentes con `@import` dentro de un `<style>` en JSX** (línea 368). Bloquea el render. Se resuelve en la Fase 3.

## Apéndice A — Contraste de los pares críticos (WCAG)

| Par (texto / fondo) | Ratio | Uso |
|---|---|---|
| tinta / papel | 15,08 | texto base |
| tinta-2 / papel | 8,72 | texto secundario |
| azul / blanco | 11,29 | botón primario, enlaces |
| blanco / azul | 11,29 | texto sobre botón azul |
| azul-hondo / blanco | 13,60 | hover |
| tinta / resaltador | 12,40 | texto sobre resaltador |
| resaltador / tinta | 12,40 | botón sobre oscuro |
| blanco / tinta | 17,16 | texto sobre sidebar |
| exito / exito-suave | 5,64 | badge |
| peligro / peligro-suave | 5,21 | badge |
| aviso / aviso-suave | 5,67 | badge |
| slate-600 / blanco | 7,21 | texto secundario |
| slate-500 / blanco | 4,83 | límite aceptable |
| **slate-500 / papel** | **4,25** | **no cumple 4,5:1: evitar en texto pequeño** |
| **azul / tinta** | **1,52** | **no usar botones azules sobre fondo oscuro** |
| **resaltador / blanco** | **1,38** | **requiere borde o anillo** |
| **ámbar / blanco** | **2,69** | **solo relleno, nunca texto** |
| **slate-400 / blanco** | **2,96** | **solo decorativo (bordes, íconos), no texto útil — revisar las 251 ocurrencias actuales** |

## Apéndice B — Resumen del esfuerzo medido

| Trabajo | Volumen | Fase | Archivos que hay que tocar |
|---|---:|---|---|
| Tokens y reasignación de rampas | — | 1 | **1** (`index.css`) + `index.html` |
| Migración a nombres semánticos | 2.991 ocurrencias | 2 | ~46 |
| Sombras de color y glows | 128 | 2 | ~25 |
| Gradientes | 23 | 2 | 7 |
| Hex sueltos (gráficas) | 100 | 2 | 13 |
| Tipografía (`font-black`, `uppercase`, tamaños < 12 px, `italic`, `tracking`) | **1.864** | 3 | ~50 |
| Radios | ~466 | 3 | ~50 |
| `backdrop-blur` | 40 | 3 | ~30 |

La Fase 1 es un archivo y cambia el tono de toda la app: hazla y evalúa antes de decidir cuánto de la Fase 2 vale la pena. La Fase 3 es la que de verdad quita el aire de plantilla.
