---
title: Certificado de Pruebas Unitarias y Aseguramiento de Calidad
author: Sistema de Gestión de Inventario Inteligente (StockPilot)
date: 24/4/2026
---

# 📄 Certificado Oficial de Calidad de Software y Pruebas Unitarias

**Proyecto:** StockPilot — Sistema de Gestión de Inventario Inteligente
**Fecha de Certificación:** 24/4/2026
**Framework de Validación:** Vitest v4 (Interoperabilidad ESM/CommonJS)
**Motor de Cobertura:** V8 Coverage (Node.js)
**Entorno de Ejecución:** Node.js (V8 Engine)

---

## 1. Resumen Ejecutivo de Validación

El presente documento certifica la ejecución automatizada de la suite de pruebas unitarias sobre los módulos críticos (Lógica Financiera, Inteligencia Artificial, Fábricas Polimórficas y Seguridad) del sistema **StockPilot**. Las pruebas fueron diseñadas bajo el enfoque de validación de caja blanca y pruebas de límites, aplicando el patrón de diseño *Pure Function Extraction* para aislar la lógica de negocio de la capa de persistencia de datos e infraestructura (Express).

### 1.1. Métricas de Ejecución
- **Total de Escenarios Evaluados:** `124`
- **Tasa de Éxito (Pass Rate):** `100.00%`
- **Escenarios Exitosos:** `124`
- **Escenarios Fallidos:** `0`

### 1.2. Veredicto del Sistema
> **[ESTADO: APROBADO]** ✅  
> La integridad de los algoritmos predictivos, controles de acceso, sanitización de entradas, proyección de pérdidas y matemática logística cumple con las especificaciones del diseño arquitectónico. El código está estabilizado y certificado como *Production-Ready* en el ámbito lógico.

---

## 2. Informe de Cobertura de Código

### 2.1. Resultados Globales

| Métrica | Porcentaje | Resultado |
|:--------|:----------:|:--------|
| **Statements (Declaraciones)** | **100%** | Perfecto |
| **Branches (Bifurcaciones)** | **100%** | Perfecto |
| **Functions (Funciones)** | **100%** | Perfecto |
| **Lines (Líneas)** | **100%** | Perfecto |

### 2.2. Resultados por Directorio (Core del Negocio)

| Directorio / Módulo | Statements | Branches | Functions | Lines |
|:--------------------|:----------:|:--------:|:---------:|:-----:|
| `controllers/` | 100% | 100% | 100% | 100% |
| `middleware/` | 100% | 100% | 100% | 100% |
| `models/` | 100% | 100% | 100% | 100% |
| `models/products/` | 100% | 100% | 100% | 100% |

### 2.3. Justificación del Alcance de Cobertura (Separación de Intereses)

El análisis de cobertura se concentra exclusivamente en los archivos que contienen la **lógica de negocio pura** del sistema, es decir, los algoritmos matemáticos, factorías y reglas de decisión que operan de forma independiente a la base de datos y al framework web:

| Archivo evaluado | Justificación de Inclusión (Lógica de Negocio) |
|:-----------------|:--------------|
| `models/Alert.js` | Algoritmos de clasificación ABC, agotamiento y umbrales logísticos. Núcleo matemático de alertas. |
| `models/products/*` | Implementación del patrón de diseño *Factory Method*, herencia y polimorfismo de productos (Digitales, Perecederos, No Perecederos) con sus respectivas reglas de validación y defaults. |
| `controllers/feedbackController.js` | Lógica de evaluación de precisión de IA: periodo adaptativo y clamping (0.2–3.0). Módulo de aprendizaje. |
| `middleware/auth.js` | Reglas de decisión RBAC: validación de sesión y concurrencia. |
| `middleware/validation.js` | Sanitización estricta para la prevención de ataques XSS. |
| `controllers/dashboardController.js` | *(Evaluado por extracción)* Funciones de proyección de pérdida económica, nivel de servicio y margen promedio. |

Los demás componentes del proyecto interactúan directamente con la base de datos SQLite y con los objetos HTTP (`req`, `res`). Incluirlos en la métrica de pruebas unitarias sería un anti-patrón (requeriría simulación masiva o *mocking*). Estos son evaluados a nivel de Pruebas de Integración (donde proceda) o Pruebas End-to-End.

---

## 3. Detalle de Certificación por Dominio de Negocio (Trazabilidad)

Los archivos de prueba han sido renombrados y reestructurados en el directorio `tests/business_logic/` para reflejar el dominio del negocio evaluado, abandonando deliberadamente la nomenclatura técnica de frameworks (evitando carpetas redundantes como `controllers` o `models` en el testing).

### 3.1 Dominio: Matemáticas de Inventario (`inventory_math.test.js`)
**Evaluado:** `models/Alert.js` | **Estado:** ✅ Aprobado (19 tests)
- ✔️ Distribución de Pareto (Clasificación A, B, C basada en ingresos y velocidades).
- ✔️ Modelado probabilístico de agotamiento de días.
- ✔️ Reglas de Alerta de Stock Logístico y Ventanas de Reorden.
- ✔️ Detección matemática de Sobrestock por retención de capital.

### 3.2 Dominio: Polimorfismo de Productos (`product_polymorphism.test.js`)
**Evaluado:** `models/products/ProductFactory.js` (y subclases) | **Estado:** ✅ Aprobado (26 tests)
- ✔️ Enrutamiento de instanciación del Factory Method.
- ✔️ Herencia de validaciones de `ProductBase`.
- ✔️ Reglas específicas para `PerishableProduct` (vencimientos futuros y fallos base).
- ✔️ Reglas de inventario infinito y entrega inmediata para `DigitalProduct`.

### 3.3 Dominio: Métricas de Feedback IA (`ai_feedback_metrics.test.js`)
**Evaluado:** `controllers/feedbackController.js` | **Estado:** ✅ Aprobado (19 tests)
- ✔️ Ajuste adaptativo del periodo objetivo (max(lead_time * 2, 14)).
- ✔️ Ecuación de proyección de ventas sobre demanda inicial.
- ✔️ Restricción matemática de Precisión (Clamping 0.2 - 3.0).
- ✔️ Umbrales de severidad ("Sugirió de más", "Sugirió de menos").

### 3.4 Dominio: Analítica del Dashboard (`dashboard_analytics.test.js`)
**Evaluado:** Fórmulas de `dashboardController.js` | **Estado:** ✅ Aprobado (18 tests)
- ✔️ Proyección financiera de pérdida por vencimiento a 30 días.
- ✔️ Algoritmo de Nivel de Servicio Estimado (Porcentaje de productos sobre ROP).
- ✔️ Cálculo de Tasa de Variación de Ventas intermensual.
- ✔️ Promedios ponderados de Margen de Ganancia.

### 3.5 Dominio: Sanitización de Entrada (`input_sanitization.test.js`)
**Evaluado:** `middleware/validation.js` | **Estado:** ✅ Aprobado (33 tests)
- ✔️ Neutralización estricta de ataques Cross-Site Scripting (XSS).
- ✔️ Escape algorítmico de etiquetas HTML y caracteres especiales.
- ✔️ Validación semántica de entidades (Ventas, Productos, Usuarios, Autenticación).

### 3.6 Dominio: Reglas de Autorización (`security_auth_rules.test.js`)
**Evaluado:** `middleware/auth.js` | **Estado:** ✅ Aprobado (9 tests)
- ✔️ Evaluación del Control de Acceso Basado en Roles (RBAC).
- ✔️ Mitigación y detección de Sesiones Concurrentes.
- ✔️ Manejo de estado de autorización no autenticada.

---

### 4. Firma de Aprobación Automatizada
*Documento autogenerado por el pipeline de Integración Continua (CI) de StockPilot.*  
*Generado para su anexo como evidencia técnica en documento de grado.*