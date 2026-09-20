# Rediseño Visual Completo (feature/rediseño-visual)

Este plan describe la estrategia para aplicar la nueva paleta de colores semántica (diseñada para la Landing Page) a toda la aplicación de StockPilot.

## User Review Required

> [!WARNING]
> Dado que estamos usando **Tailwind CSS v4** (importado vía `@import "tailwindcss";` en `index.css`), la configuración de colores personalizados ya no se hace en `tailwind.config.js`, sino directamente en el CSS con la directiva `@theme`.
> ¿Estás de acuerdo con inyectar las variables directamente en `index.css` usando `@theme`?

## Open Questions

> [!IMPORTANT]
> 1. Para los botones de acción principal (ej. "Iniciar Sesión", "Registrar Venta"), propongo usar el color **Azul (`#252C93`)** con texto blanco, y reservar el **Resaltador (`#FFD84A`)** solo para alertas, insignias o acciones muy puntuales (ej. "Pagar ahora" en el POS). ¿Te parece bien esta distribución?
> 2. Para los fondos modales oscuros (ej. `bg-slate-900/40 backdrop-blur`), propongo cambiar a `bg-tinta/60 backdrop-blur`. ¿Estás de acuerdo?

## Proposed Changes

---

### Configuración Global (Tailwind v4)

Inyectaremos la nueva paleta de colores en Tailwind v4 para poder usar clases como `bg-tinta`, `text-azul`, `bg-papel`.

#### [MODIFY] [index.css](file:///c:/Estudio/Práctica de ing/inventario-node/inventario-node/frontend/src/index.css)
- Añadir un bloque `@theme` con las variables de color:
  - `--color-tinta: #14173F;`
  - `--color-tinta-2: #3A3F6E;`
  - `--color-azul: #252C93;`
  - `--color-papel: #EEF0F8;`
  - `--color-resaltador: #FFD84A;`
  - `--color-ambar: #E08A00;`
- Cambiar el `background-color` global del `body` a `var(--color-papel)`.
- Cambiar el color de texto global de `#1f2937` a `var(--color-tinta)`.

---

### Vistas de Autenticación

Reemplazo de los fondos oscuros genéricos por el color corporativo.

#### [MODIFY] [LoginPage.jsx](file:///c:/Estudio/Práctica de ing/inventario-node/inventario-node/frontend/src/pages/LoginPage.jsx)
- Cambiar fondos oscuros de `bg-slate-900`/`bg-slate-800` a `bg-tinta`.
- Cambiar botones primarios (`bg-indigo-600`/`bg-violet-600`) a `bg-azul`.
- Cambiar textos de encabezado a `text-tinta`.

#### [MODIFY] [RegisterPage.jsx](file:///c:/Estudio/Práctica de ing/inventario-node/inventario-node/frontend/src/pages/RegisterPage.jsx)
- Aplicar los mismos reemplazos que en `LoginPage`.

#### [MODIFY] [ForgotPasswordPage.jsx](file:///c:/Estudio/Práctica de ing/inventario-node/inventario-node/frontend/src/pages/ForgotPasswordPage.jsx)
- Aplicar los mismos reemplazos que en `LoginPage`.

---

### Componentes Base

El menú lateral es clave para la identidad de la app.

#### [MODIFY] [Sidebar.jsx](file:///c:/Estudio/Práctica de ing/inventario-node/inventario-node/frontend/src/components/Sidebar.jsx)
- Cambiar el fondo del sidebar de `bg-slate-900` (o similar) a `bg-tinta`.
- Cambiar el estado activo (`bg-indigo-600/20` o similar) a `bg-azul/20` o un borde izquierdo color `resaltador`.

---

### Vistas Internas Principales (Ejemplos de alto impacto)

Reemplazar `slate-900` de las tablas y encabezados.

#### [MODIFY] [DashboardPage.jsx](file:///c:/Estudio/Práctica de ing/inventario-node/inventario-node/frontend/src/pages/DashboardPage.jsx)
- Cambiar `text-slate-900` en títulos a `text-tinta`.
- Actualizar gradientes/fondos de las tarjetas de sugerencias IA.

#### [MODIFY] Tablas en General (ej. [AuditoriaPage.jsx](file:///c:/Estudio/Práctica de ing/inventario-node/inventario-node/frontend/src/pages/AuditoriaPage.jsx), etc.)
- En las cabeceras de tabla `<thead>`, cambiar `bg-slate-900` a `bg-tinta`.

## Verification Plan

### Automated Tests
- No hay tests unitarios que dependan de estilos CSS, por lo que la suite debería pasar.

### Manual Verification
- Levantar el servidor en desarrollo (`npm run dev`).
- Comprobar visualmente que el login, sidebar y tablas carguen la paleta correcta.
- Verificar que las transparencias (modales con `bg-tinta/60`) funcionen como se espera en Tailwind v4.
