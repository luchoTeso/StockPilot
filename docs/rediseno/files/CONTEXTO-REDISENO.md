# StockPilot — Contexto del rediseño visual (traspaso a Claude Code)

> Este documento resume una conversación larga de diseño y análisis con otro asistente. Léelo completo antes de tocar código. Al final hay un orden de trabajo y las reglas que debes respetar.
> **Idioma:** responde al usuario en español y explica el *porqué* de cada cambio, no solo el qué.

## 1. Proyecto

- **StockPilot:** sistema web de inventario para tiendas de alimentos con recomendaciones de IA (reabastecimiento, promociones, riesgo de crédito "fiados"). Proyecto universitario (Práctica de Ingeniería IV, Universidad Central, 2026) con posible continuidad como trabajo de grado.
- **Frontend:** `frontend/` — React 19, Vite 5.4, Tailwind **v4.2.1** vía `@tailwindcss/vite` (no PostCSS), `react-router-dom` 7, `recharts` 3, `lucide-react`. **No existe `tailwind.config.js`**: los tokens van en `@theme` dentro de `src/index.css`.
- **Backend:** Node/Express en `localhost:3000` (Vite proxya `/api`). Las vistas autenticadas necesitan el backend levantado.
- **Entorno del usuario:** Windows (PowerShell). Ruta con espacios y tilde: `c:\Estudio\Práctica de ing\inventario-node\inventario-node\frontend` → entrecomilla las rutas.
- **Los archivos usan CRLF.** Preserva los finales de línea o el diff mostrará archivos enteros modificados.
- **No hay tests** (`*.test.*`/`*.spec.*` no existen). La verificación es `npm run build`, `npm run lint` y revisión visual.

## 2. Objetivo

La interfaz original se sentía genérica ("SaaS con IA"): slate-800 + índigo, degradados y "glows", todo en MAYÚSCULAS ITÁLICAS de peso 900, etiquetas de 8–10 px. Se rediseñó primero la **landing** (`src/pages/LandingPage.jsx`, ya integrada en el proyecto) y ahora se lleva la misma paleta a **toda la app**.

## 3. Sistema de diseño acordado

**Concepto:** el mundo del tendero. Azul del esfero con que se anota el cuaderno, tinta, papel y un amarillo de resaltador usado con moderación. La landing usa una tirilla de caja que se "imprime" como pieza central.

| Token | Valor | Uso |
|---|---|---|
| `tinta` | `#14173F` | texto base, fondos oscuros |
| `tinta-2` | `#3A3F6E` | texto secundario |
| `azul` | `#252C93` | acción principal en superficies **claras** |
| `azul-hondo` | `#1C2277` | hover del azul |
| `papel` | `#EEF0F8` | fondo de la app |
| `resaltador` | `#FFD84A` | acción principal en superficies **oscuras**, CTA puntual, énfasis |
| `resaltador-hondo` | `#FFC81A` | hover |
| `exito` / `peligro` / `aviso` | `#0B6B45` / `#B42A26` / `#8A5300` | estados (con variantes `-suave`) |
| `ambar` | `#E08A00` | solo rellenos, barras, íconos. **Nunca texto.** |

**Decisiones ya tomadas por el usuario:**
- Azul `#252C93` (un poco más profundo que el primer intento `#2830C4`, que le pareció muy encendido).
- Nav de la landing `sticky` con el mismo azul del hero, sin blur ni JS.
- Tipografía objetivo: **Archivo** (condensado, peso 800, minúscula normal para titulares) + IBM Plex Mono solo donde el mono sea el artefacto real (tirilla, nota de credenciales).
- Rama sugerida `feature/rediseno-visual` (sin `ñ`).

**Reglas de contraste ya calculadas (no las contradigas):** azul sobre tinta = **1,52:1** (no usar botones azules sobre fondo oscuro); resaltador sobre blanco = 1,38:1 (necesita anillo/borde); `slate-400` sobre blanco = 2,96:1 (solo decorativo, no texto útil); `slate-500` sobre `papel` = 4,25:1 (evitar en texto pequeño).

## 4. Documentos que acompañan a este (ponlos en `docs/rediseno/`)

1. **`rediseno-visual-recomendaciones.md`** — plan por fases (0–4) con tokens completos, tablas de equivalencias, reglas por componente, orden de migración y criterios de aceptación.
2. **`adenda-plan-rediseno.md`** — cambios posteriores: Fase 1b, botón de cobro, gráficas, `font-outfit`, observaciones.
3. `implementation_plan remodelación.md` — el plan original del usuario. **Prevalece la adenda > el plan de recomendaciones > este.**

Los números de línea que aparecen en esos documentos salen de una copia del código **anterior a la Fase 1**. Localiza por contenido, no por número.

## 5. Estado actual

| Fase | Estado |
|---|---|
| 0 Preparación | Hecha (inventario medido, línea base compilada) |
| **1 Tokens y reasignación de rampas en `index.css`** | **Aplicada por el usuario** y verificada con capturas |
| **1b Superficies con hex fijo** | **Pendiente. Es lo siguiente.** |
| 2 Migración a nombres semánticos | Pendiente (grupos A → B → C) |
| 3 Tipografía y forma | Pendiente, PR aparte, **no opcional** |
| 4 Verificación | Pendiente |

**Qué se vio en las capturas tras la Fase 1** (Dashboard, Login, Recuperación, Registro, POS, modal de pago, Analítico, Auditoría):
- Cambiaron bien: estados (rojo/verde/ámbar), botones y badges azules, neutros de las tarjetas.
- **No cambiaron:** fondos de las vistas de acceso (`linear-gradient(... #1e293b ... #334155 ...)` en línea), sidebar (`bg-[#334155]`), `DashboardLayout` (`bg-[#f8fafc]`) y las gráficas (hex). Resultado: **dos azules oscuros distintos en la misma pantalla** (sidebar gris pizarra junto a paneles en `tinta`).
- **Cuatro botones primarios distintos:** `Cobrar` verde; `Confirmar y Facturar` y `Recuperar mi cuenta` casi negros (`bg-slate-900`); Login y `Activar oferta` azules.
- Recuperación: barra superior en degradado azul→rojo y un "blob" rojo que tiñe el fondo.
- Gráficas del Analítico siguen en la paleta vieja (`#6366f1`, `#10b981`, `#f43f5e`) y chocan con el azul nuevo. Ejes en 8–10 px.

## 6. Hechos medidos sobre el código (zip previo a la Fase 1)

- 52 `.jsx`, ~13.000 líneas. `npm run build` ✓ en 8,7 s; CSS 113,39 kB (17,06 kB gzip). Advertencia preexistente de chunks > 500 kB.
- **2.991** ocurrencias de clases de color: `slate` 1.489, `indigo` 688, `rose` 292, `emerald` 260, `amber` 168, `violet` 32, resto 62.
- **0** clases construidas dinámicamente (`bg-${x}`): riesgo descartado. `ConfirmDialog` usa un mapa con nombres completos, patrón correcto.
- Sombras de color: **113** con clase + 15 arbitrarias (incluye "glows"); gradientes: solo 23. El rasgo de plantilla son las **sombras**, más que los gradientes.
- Tipografía: `font-black` 663, `uppercase` 606, `text-[10px]` 352, `text-[9px]` 104, `italic` 117, `tracking-[…]` 77. **Supera en volumen al trabajo de color.**
- `Inter` se declara en `index.css` pero **nunca se carga** (la app se ve en Segoe UI). `font-outfit` aparece 29 veces y **no está definida en ninguna parte**.
- Radios: 10 valores distintos (`rounded-[2.5rem]` 57, `[2rem]` 48, `3xl` 27, `[3rem]` 8…). Reducir a `lg` / `2xl` / `full`.
- 100 hex sueltos en 13 archivos, 45 en `AnalyticsDashboardPage.jsx`.

## 7. Decisiones pendientes del usuario (pregúntale, no decidas tú)

1. **Botón de `Cobrar` y `Confirmar y Facturar`:** (A) amarillo resaltador con texto tinta y anillo, o (B) mantener verde de la familia `exito` y llevar también `Confirmar y Facturar` a verde. Lo que **no** debe quedar es un flujo con dos colores en pasos consecutivos.
2. Si las gráficas usan amarillo para la serie protagonista sobre el panel oscuro "Ritmo de caja" (recomendado).

## 8. Observaciones fuera del alcance visual (reporta, no arregles sin preguntar)

- **"Sugerido: +0u"** aparece en las 4 tarjetas visibles del Consejero IA, todas "Alta demanda" y con texto que recomienda aumentar stock. Apunta a un problema de mapeo de campo backend→frontend.
- **El sidebar (`z-[200]`) queda por encima del overlay de los modales (`z-[100]`)**: con el modal de pago abierto se puede navegar con un cobro a medias.
- **Auditoría:** 5 tarjetas en `lg:grid-cols-4` dejan la quinta huérfana.
- `react-router-dom` y `axios` están en `devDependencies` y son dependencias de ejecución.
- **Descartado:** el recorte de la lista del Consejero IA en las capturas es un artefacto de la captura de página completa (coincide con el alto del viewport), no un defecto.

## 9. Cómo verificar tú mismo los cambios

Quien te pasó este contexto no pudo abrir un navegador; **tú sí puedes y debes hacerlo**.

1. `npm install`, `npm run build` y `npm run lint` tras cada fase. Compara el tamaño del CSS con la línea base (113 kB); no debe crecer de forma notable.
2. `npm run dev` y revisa en navegador. Para capturas automáticas, instala Playwright como dependencia de desarrollo **local sin commitear** (`npx playwright install chromium`) y captura a 1440×900 y 390×844.
   - Vistas públicas (no necesitan backend): landing, login, registro, recuperación. Lee `src/App.jsx` para las rutas reales.
   - Vistas autenticadas: necesitan el backend en `:3000` y credenciales. **Pídeselas al usuario; nunca las escribas en el código ni las commitees.** Léelas de una variable de entorno.
3. Guarda las capturas en `docs/rediseno/capturas/antes/` y `.../despues/` y muéstraselas al usuario.
4. Greps de aceptación por fase (los comandos están en el plan; usa `Select-String` en PowerShell o `grep -rE` en bash).

## 10. Orden de trabajo inmediato

1. Revisa `git diff` de la Fase 1 y confirma que coincide con el bloque `@theme` del plan. Añade `data-surface="dark"`, el `theme-color` en `index.html` y las reasignaciones de familias sueltas si faltan.
2. **Fase 1b** completa (ver adenda). Cuando termine, captura Login, Recuperación, Registro, Dashboard (sidebar) y Analítico, y confirma que ya no hay dos azules oscuros.
3. Pregunta al usuario la decisión 7.1 antes de tocar el POS.
4. **Fase 2** por grupos A → B → C, **un commit por grupo**. Empieza por `Sidebar` (regla: `border-l-4 border-resaltador bg-white/10`; el azul sobre `tinta` no se distingue).
5. **Fase 3** en una rama/PR aparte: Archivo cargada una sola vez en `index.html`, quitar `font-outfit`, `font-black`/`uppercase`/`italic` decorativos, tamaños < 12 px, radios y `backdrop-blur`. Quitar el `@import` de fuentes de `LandingPage.jsx`.
6. **Fase 4**: matriz de pantallas × estados (hover, foco con Tab, deshabilitado, error, cargando, vacío) × viewports (1440, 1024, 390).

## 11. Reglas de trabajo

- Solo **clases, estilos y tokens**. No cambies lógica, props, rutas ni backend. No agregues dependencias de ejecución.
- No uses `!important`, no crees `tailwind.config.js` para colores y no reinicies la paleta por defecto (`--color-*: initial`).
- Si un color no aparece en las tablas del plan, no improvises: deja `/* TODO(diseño): … */` y repórtalo.
- Después de cada fase entrega al usuario: qué cambiaste y por qué, resultado de `build`/`lint`, capturas antes/después y cualquier decisión que necesites de su parte.
