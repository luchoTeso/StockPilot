---
title: Certificado de Pruebas Unitarias y Aseguramiento de Calidad
author: Sistema de Gestión de Inventario Inteligente (StockPilot)
date: 17/4/2026, 12:52:41 p. m.
---

# 📄 Certificado Oficial de Calidad de Software y Pruebas Unitarias

**Proyecto:** StockPilot — Sistema de Gestión de Inventario Inteligente
**Fecha de Certificación:** 17/4/2026, 12:52:41 p. m.
**Framework de Validación:** Vitest v3
**Entorno de Ejecución:** Node.js (V8 Engine)

---

## 1. Resumen Ejecutivo de Validación

El presente documento certifica la ejecución automatizada de la suite de pruebas unitarias sobre los módulos críticos (Lógica Financiera, Inteligencia Artificial y Seguridad) del sistema **StockPilot**. Las pruebas fueron diseñadas bajo el enfoque de validación de caja blanca y pruebas de límites.

### 1.1. Métricas de Ejecución
- **Total de Escenarios Evaluados:** `50`
- **Tasa de Éxito (Pass Rate):** `100.00%`
- **Escenarios Exitosos:** `50`
- **Escenarios Fallidos:** `0`
- **Tiempo Computacional (Latencia):** `0.06 ms`

### 1.2. Veredicto del Sistema
> **[ESTADO: APROBADO]** ✅  
> La integridad de los algoritmos predictivos, controles de acceso y matemática logística cumple con las especificaciones del diseño arquitectónico. El código está estabilizado y certificado como *Production-Ready* en el ámbito lógico.

## 2. Detalle de Certificación por Módulo (Matriz de Trazabilidad)

A continuación se detalla el comportamiento de cada componente sometido a estrés y validación lógica:

### 2.1 Módulo Subyacente: `logic.test.js`
**Estado del Módulo:** ✅ Aprobado

- ✔️ `[Caso de Prueba]` Sistema de Calidad StockPilot - Pruebas de Lógica: **Debería validar cálculos matemáticos básicos de inventario**
- ✔️ `[Caso de Prueba]` Sistema de Calidad StockPilot - Pruebas de Lógica: **Debería detectar niveles de stock bajo (Lógica de Reorden)**
- ✔️ `[Caso de Prueba]` Sistema de Calidad StockPilot - Pruebas de Lógica: **Debería validar el formato de moneda Colombiana (es-CO)**

### 2.2 Módulo Subyacente: `feedback.test.js`
**Estado del Módulo:** ✅ Aprobado

- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Periodo Objetivo Adaptativo: **Debería usar max(lead_time * 2, 14) → Lead time 7 → 14 días**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Periodo Objetivo Adaptativo: **Debería escalar con lead times largos → Lead time 10 → 20 días**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Periodo Objetivo Adaptativo: **Debería usar mínimo 14 días si lead time es muy corto**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Periodo Objetivo Adaptativo: **Debería usar fallback de 3 si lead time es null/undefined**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Proyección de Ventas: **Debería proyectar ventas si no ha pasado el periodo completo**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Proyección de Ventas: **Debería usar ventas reales si ya pasó el periodo completo**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Proyección de Ventas: **Debería proyectar correctamente con 1 día transcurrido**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Factor de Precisión con Clamping: **Debería calcular factor correcto: IA sugirió 100, se vendieron 50 → 0.5**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Factor de Precisión con Clamping: **Debería calcular factor 1.0 cuando la IA acertó perfectamente**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Factor de Precisión con Clamping: **Debería aplicar clamping mínimo (0.2) si ventas son 0**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Factor de Precisión con Clamping: **Debería aplicar clamping máximo (3.0) si la IA subestimó enormemente**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Factor de Precisión con Clamping: **Debería manejar sugerido = 0 con ventas > 0 → factor fijo 2.0**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Factor de Precisión con Clamping: **Debería manejar ambos en 0 → factor por defecto 1.0**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Veredicto de Precisión: **Factor 1.0 → Acertado**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Veredicto de Precisión: **Factor 0.95 → Acertado (dentro del margen ±10%)**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Veredicto de Precisión: **Factor 0.5 → Sugirió de más**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Veredicto de Precisión: **Factor 1.5 → Sugirió de menos**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Veredicto de Precisión: **Factor 0.2 (mínimo) → Sugirió de más**
- ✔️ `[Caso de Prueba]` Módulo de Feedback IA (feedbackController.js) > Veredicto de Precisión: **Factor 3.0 (máximo) → Sugirió de menos**

### 2.3 Módulo Subyacente: `auth.test.js`
**Estado del Módulo:** ✅ Aprobado

- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireLogin: **Debería permitir el paso si hay userId y la sesión es válida**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireLogin: **Debería denegar acceso si no hay sesión**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireLogin: **Debería denegar acceso si la sesión no tiene userId**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireLogin: **Debería detectar sesión concurrente si isSessionValid es false**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireLogin: **Debería priorizar no_auth sobre concurrent si no hay userId**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireAdmin: **Debería permitir el paso si el rol es Administrador**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireAdmin: **Debería denegar acceso si el rol es Colaborador**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireAdmin: **Debería denegar acceso si no hay sesión**
- ✔️ `[Caso de Prueba]` Middleware de Seguridad - Lógica auth.js > requireAdmin: **Debería denegar acceso si el rol no está definido**

### 2.4 Módulo Subyacente: `alert.test.js`
**Estado del Módulo:** ✅ Aprobado

- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Clasificación ABC Pareto: **Debería asignar A al producto con mayor ingreso (top 80%)**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Clasificación ABC Pareto: **Debería ordenar productos de mayor a menor ingreso**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Clasificación ABC Pareto: **Debería manejar productos sin ventas (velocity = 0)**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Clasificación ABC Pareto: **Debería clasificar correctamente con distribución equilibrada**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Días de Agotamiento: **Debería calcular correctamente con velocidad normal**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Días de Agotamiento: **Debería retornar 999 si la velocidad es prácticamente 0**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Días de Agotamiento: **Debería usar Math.floor (redondeo hacia abajo)**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Stock Logístico: **Debería generar stock_critico si se agota antes de que llegue el proveedor**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Stock Logístico: **Debería generar stock_bajo si estamos en la ventana de reorden**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Stock Logístico: **No debería generar alerta si hay stock suficiente**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Stock Logístico: **Debería ser critico cuando agotamiento = lead time exacto**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Vencimiento (Cruce con Velocidad): **Debería generar vencimiento_critico si vence en ≤7 días y quedarán sobrantes**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Vencimiento (Cruce con Velocidad): **Debería generar vencimiento_proximo si vence en ≤30 días con sobrantes**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Vencimiento (Cruce con Velocidad): **No debería generar alerta si alcanzamos a vender todo**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Alertas de Vencimiento (Cruce con Velocidad): **No debería generar alerta si vence en más de 30 días**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Sobrestock (Capital Estancado): **Debería detectar sobrestock: clase C, sobre máximo, +60 días de stock**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Sobrestock (Capital Estancado): **No debería marcar sobrestock si es clase A (producto importante)**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Sobrestock (Capital Estancado): **No debería marcar sobrestock si no supera el máximo**
- ✔️ `[Caso de Prueba]` Motor Matemático de Alertas (Alert.js) > Sobrestock (Capital Estancado): **No debería marcar sobrestock si se agota en menos de 60 días**


---

### 3. Firma de Aprobación Automatizada
*Documento autogenerado por el pipeline de Integración Continua (CI) de StockPilot.*  
*Generado para su anexo como evidencia técnica en documento de grado.*