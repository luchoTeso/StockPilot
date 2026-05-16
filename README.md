# StockPilot — Sistema de Gestión de Inventario Inteligente

Sistema integral de gestión de inventario para tiendas y microempresas colombianas, con módulo de Inteligencia Artificial para predicción de reabastecimiento, alertas logísticas automáticas y analítica financiera en tiempo real.

**Desplegado en producción:** [stockpilot.up.railway.app](https://stockpilot.up.railway.app) *(Railway — redeploy automático en cada push a `main`)*

---

## Arquitectura del Sistema

| Capa | Tecnología | Descripción |
|:-----|:-----------|:------------|
| **Frontend** | React 19 + Vite + TailwindCSS | SPA con gráficas interactivas (Recharts) |
| **Backend** | Node.js + Express 4 | API REST con arquitectura MVC |
| **Base de Datos** | PostgreSQL 16 (Railway) | Base de datos relacional en producción |
| **IA** | OpenAI GPT-4o-mini | Motor de sugerencias de reabastecimiento y promociones |
| **Email** | Resend | Envío de notificaciones y órdenes de compra |
| **Sesiones** | connect-pg-simple | Sesiones persistidas en PostgreSQL |
| **Testing** | Vitest + Playwright | Pruebas unitarias (lógica de negocio) + E2E |

```
inventario-node/
├── app.js                    # Punto de entrada del servidor
├── config/
│   ├── database.js           # Pool de conexión PostgreSQL (pg)
│   └── mailer.js             # Cliente Resend para emails
├── controllers/              # Lógica de negocio (MVC)
├── middleware/               # Auth, rate limiting, validación
├── models/                   # Modelos de datos
│   ├── Alert.js              # Motor matemático de alertas (ABC, ROP)
│   ├── Product.js            # CRUD de productos
│   └── products/             # Patrón Factory (Perecedero, Digital, etc.)
├── routes/                   # Endpoints REST
├── database/
│   └── init_pg.sql           # Esquema PostgreSQL completo
├── frontend/                 # Aplicación React (SPA)
│   ├── src/
│   │   ├── pages/            # Vistas principales
│   │   ├── components/       # Componentes reutilizables
│   │   └── context/          # Estado global (Auth, Toast, Sidebar)
│   └── vite.config.js
└── tests/
    └── business_logic/       # Suite de pruebas unitarias
```

---

## Roles del Sistema

| Rol | Acceso |
|:----|:-------|
| **Administrador** | Dashboard, Ventas, Catálogo, Alertas, Mi Tienda, Movimientos, Proveedores AI, Analítica Visual, Simulador AI, Reportes, Auditoría AI, Aprendizaje AI, Colaboradores |
| **Colaborador** | Dashboard, Ventas, Catálogo, Monitor Alertas, Mi Tienda |

---

## Requisitos Previos (Desarrollo Local)

| Herramienta | Versión Mínima |
|:------------|:--------------:|
| **Node.js** | 18+ |
| **npm** | 9+ |
| **PostgreSQL** | 14+ |

---

## Instalación Local

### 1 — Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd inventario-node
```

### 2 — Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3000
SESSION_SECRET=una_frase_secreta_larga

# PostgreSQL (local o remoto)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/stockpilot

# IA (opcional — sin ella el módulo de recomendaciones queda deshabilitado)
OPENAI_API_KEY=sk-...

# Email con Resend (opcional — sin él no se envían correos)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=StockPilot <onboarding@resend.dev>
```

> **Nota:** El sistema arranca sin `OPENAI_API_KEY` ni `RESEND_API_KEY`. Solo quedan deshabilitados el módulo de IA y el envío de emails respectivamente.

### 3 — Inicializar la base de datos

Crea la base de datos y ejecuta el esquema:

```bash
# Crear la BD en PostgreSQL local
psql -U postgres -c "CREATE DATABASE stockpilot;"

# Aplicar el esquema completo
psql -U postgres -d stockpilot -f database/init_pg.sql
```

### 4 — Instalar dependencias

```bash
# Backend
npm install

# Frontend
cd frontend && npm install && cd ..
```

### 5 — Ejecutar el proyecto

Abre **dos terminales**:

```bash
# Terminal 1 — Backend (http://localhost:3000)
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

Ingresa a **http://localhost:5173**.

---

## Usuarios de Prueba

> Estos usuarios existen en el entorno de producción (Railway) para demo.

| Usuario | Contraseña | Rol |
|:--------|:-----------|:----|
| `Carlos Admin` | *(consultar al autor)* | Administrador |
| `María` | *(consultar al autor)* | Colaborador |

---

## Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Con reporte detallado
npx vitest run --reporter=verbose

# Reporte de cobertura (genera coverage/index.html)
npm run test:coverage
```

**Suite de pruebas** (`tests/business_logic/`):

| Archivo | Dominio |
|:--------|:--------|
| `inventory_math.test.js` | Clasificación ABC, agotamiento, alertas logísticas |
| `product_polymorphism.test.js` | Factory Method, herencia, validaciones por tipo |
| `ai_feedback_metrics.test.js` | Precisión IA, clamping, proyección de ventas |
| `dashboard_analytics.test.js` | Pérdidas por vencimiento, nivel de servicio, márgenes |
| `input_sanitization.test.js` | Prevención XSS, validación de entidades |
| `security_auth_rules.test.js` | RBAC, sesiones concurrentes, control de acceso |

---

## Despliegue en Railway

El proyecto usa despliegue continuo: cada `git push` a `main` redespliega automáticamente en Railway.

**Variables de entorno requeridas en Railway:**

```
DATABASE_URL        → provista automáticamente por el plugin de PostgreSQL
SESSION_SECRET      → frase secreta para sesiones
OPENAI_API_KEY      → clave de OpenAI
RESEND_API_KEY      → clave de Resend
RESEND_FROM_EMAIL   → StockPilot <onboarding@resend.dev>
```

---

## Solución de Problemas

### El frontend no conecta con el backend
Verifica que el backend corra en el puerto **3000** y el frontend en **5173**. El proxy de Vite (`vite.config.js`) redirige `/api/*` automáticamente.

### Error de conexión a PostgreSQL
Verifica que `DATABASE_URL` tenga el formato correcto: `postgresql://user:pass@host:port/dbname`.

### El módulo de IA no responde
Confirma que `OPENAI_API_KEY` esté definida en `.env`. Sin ella, el endpoint devuelve un mensaje de error controlado y el resto del sistema funciona con normalidad.

---

*Desarrollado como proyecto de grado — Ingeniería de Software.*
