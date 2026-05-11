# 📦 StockPilot — Sistema de Gestión de Inventario Inteligente

Sistema integral de gestión de inventario para tiendas y microempresas colombianas, con módulo de Inteligencia Artificial para predicción de reabastecimiento, alertas logísticas inteligentes y analítica financiera en tiempo real.

---

## 🏗️ Arquitectura del Sistema

| Capa | Tecnología | Descripción |
|:-----|:-----------|:------------|
| **Frontend** | React 19 + Vite + TailwindCSS 4 | SPA con gráficas interactivas (Recharts) |
| **Backend** | Node.js + Express 4 | API REST con arquitectura MVC |
| **Base de Datos** | SQLite 3 | Base de datos embebida (cero configuración) |
| **IA** | OpenAI GPT-4o-mini | Motor de sugerencias de reabastecimiento |
| **Testing** | Vitest + Playwright | Pruebas unitarias (lógica de negocio) + E2E |

```
inventario-node/
├── app.js                    # Punto de entrada del servidor
├── config/                   # Configuración de BD y correo
├── controllers/              # Lógica de rutas (MVC)
├── middleware/                # Autenticación, validación, rate limiting
├── models/                   # Modelos de datos y Factory Method
│   ├── Alert.js              # Motor matemático de alertas (ABC, ROP)
│   ├── Product.js            # CRUD de productos
│   └── products/             # Patrón Factory (Perecedero, Digital, etc.)
├── routes/                   # Definición de endpoints REST
├── services/                 # Tareas programadas (cron jobs)
├── database/
│   ├── init.sql              # Esquema de la base de datos
│   ├── seed_test_data.js     # Datos de prueba (productos, ventas, etc.)
│   └── migrate_*.js          # Scripts de migración incremental
├── frontend/                 # Aplicación React (SPA)
│   ├── src/
│   │   ├── pages/            # Vistas principales
│   │   ├── components/       # Componentes reutilizables
│   │   └── context/          # Estado global (AuthContext)
│   └── vite.config.js
├── tests/
│   └── business_logic/       # Suite de pruebas unitarias (124 escenarios)
└── vitest.config.js          # Configuración de cobertura
```

---

## ⚙️ Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión Mínima | Verificar con |
|:------------|:--------------:|:--------------|
| **Node.js** | 18+ | `node -v` |
| **npm** | 9+ | `npm -v` |
| **Git** | 2+ | `git --version` |

> **Nota:** SQLite viene embebido con el paquete `sqlite3` de npm. **No** necesitas instalar ninguna base de datos por separado.

---

## 🚀 Guía de Instalación Local

### Paso 1 — Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd inventario-node
```

### Paso 2 — Configurar variables de entorno

Copia el archivo de ejemplo y completa tus credenciales:

```bash
# Windows (PowerShell)
copy .env.example .env

# Linux / Mac
cp .env.example .env
```

Abre `.env` con tu editor y rellena los valores:

```env
SESSION_SECRET=una_frase_secreta_cualquiera
PORT=3000
OPENAI_API_KEY=sk-tu_api_key_de_openai
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
```

> **💡 Tip:** Si no tienes API Key de OpenAI, el sistema funciona normalmente sin ella; solo el módulo de IA estará deshabilitado. El correo es opcional; sin él, las alertas semanales no se enviarán.

### Paso 3 — Instalar dependencias del Backend

```bash
npm install
```

### Paso 4 — Inicializar la Base de Datos y Migraciones

La primera vez que ejecutes el proyecto, debes crear las tablas y aplicar las actualizaciones de esquema necesarias:

```bash
npm run migrate
```

Para poblar la base de datos con datos de prueba (productos, ventas, usuarios):

```bash
npm run seed
```

> **Importante:** El comando `migrate` asegura que tu base de datos local tenga todas las columnas y tablas necesarias (como Alertas o Historial de Precios) antes de arrancar.

**Usuarios de prueba creados por el seed:**

| Usuario | Contraseña | Rol |
|:--------|:-----------|:----|
| `admin1` | `admin123` | Administrador |
| `carlos` | `1234` | Tendedero (Colaborador) |

### Paso 5 — Instalar dependencias del Frontend

```bash
cd frontend
npm install
cd ..
```

### Paso 6 — Ejecutar el proyecto

Necesitas **dos terminales** abiertas simultáneamente:

**Terminal 1 — Backend (API REST):**
```bash
npm run dev
```
> Esto levanta Express en `http://localhost:3000` con hot-reload (nodemon).

**Terminal 2 — Frontend (React + Vite):**
```bash
cd frontend
npm run dev
```
> Esto levanta Vite en `http://localhost:5173` con proxy automático al backend.

### Paso 7 — Abrir en el navegador

Ingresa a **[http://localhost:5173](http://localhost:5173)** e inicia sesión con alguno de los usuarios de prueba.

---

## 🧪 Ejecución de Pruebas

El proyecto cuenta con una suite de **124 escenarios** de pruebas unitarias enfocadas en la lógica de negocio, con **100% de cobertura** certificada.

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con reporte detallado (verbose)
npx vitest run --reporter=verbose

# Generar reporte de cobertura de código (abre coverage/index.html)
npm run test:coverage

# Dashboard visual de pruebas en el navegador
npm run test:dashboard
```

**Archivos de prueba** (en `tests/business_logic/`):

| Archivo | Dominio que evalúa |
|:--------|:-------------------|
| `inventory_math.test.js` | Clasificación ABC, agotamiento, alertas logísticas |
| `product_polymorphism.test.js` | Factory Method, herencia, validaciones por tipo |
| `ai_feedback_metrics.test.js` | Precisión de IA, clamping, proyección de ventas |
| `dashboard_analytics.test.js` | Pérdidas por vencimiento, nivel de servicio, márgenes |
| `input_sanitization.test.js` | Prevención XSS, validación de entidades |
| `security_auth_rules.test.js` | RBAC, sesiones concurrentes, control de acceso |

---

## 🌐 URLs de Acceso (Desarrollo)

| Servicio | URL |
|:---------|:----|
| Frontend (UI) | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:3000](http://localhost:3000) |
| Cobertura (después de `test:coverage`) | Abrir `coverage/index.html` en el navegador |

---

## ⚠️ Solución de Problemas Comunes

### ❌ `Error: EADDRINUSE: address already in use :::3000`
El puerto 3000 ya está ocupado. Ciérralo con:
```powershell
# PowerShell (Windows)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### ❌ `npm install` falla con errores de `sqlite3` o `bcrypt`
Estos paquetes requieren compilación nativa. Asegúrate de tener las build tools:
```bash
# Windows: Instalar desde PowerShell con permisos de administrador
npm install --global windows-build-tools
```

### ❌ El frontend no conecta con el backend (Error de red / CORS)
Verifica que:
1. El backend esté corriendo en el puerto **3000** (no otro).
2. El frontend esté corriendo en el puerto **5173**.
3. El archivo `frontend/vite.config.js` tenga el proxy configurado apuntando a `http://localhost:3000`.

### ❌ La base de datos está vacía después de clonar
Ejecuta el seed:
```bash
npm run seed
```

---

## 📄 Documentación Adicional

- `StockPilot_Documentacion_Completa.md` — Documentación técnica exhaustiva del sistema.
- `Reporte_Pruebas_StockPilot.md` — Certificado de calidad con trazabilidad de los 124 escenarios.
- `coverage/index.html` — Reporte interactivo de cobertura de código (generado con `npm run test:coverage`).

---

*Desarrollado como proyecto de grado — Práctica de Ingeniería de Software.*
