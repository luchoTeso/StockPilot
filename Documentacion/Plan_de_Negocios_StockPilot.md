# PLAN DE NEGOCIOS: STOCKPILOT
**Sistema Inteligente de Gestión de Inventarios y Ventas con IA**

---

## MÓDULO 0: DATOS GENERALES

**Localización de la empresa:**
- **Ciudad sede principal:** Bogotá D.C, Colombia (Localidad de Teusaquillo como base administrativa/legal).
- **Cobertura operativa:** Nacional (Operación 100% remota / SaaS con acceso desde cualquier región del país con conexión a internet).
- **Justificación de la ubicación:** Bogotá concentra el 24.7% del total de empresas activas del país (MinCIT, 2023) y es el principal centro de desarrollo tecnológico de Colombia. Aunque el equipo opera bajo una modalidad 100% remota (Home Office) minimizando los gastos fijos, la base administrativa y legal en la capital facilita el networking, cercanía a ecosistemas de emprendimiento (como la Universidad Central) y vinculación de talento joven.

**Sector económico:**
- **Código CIIU:** 6201 - Actividades de desarrollo de sistemas informáticos (software).
- **Clasificación:** Sector Terciario - Servicios de Tecnología de la Información.
- **Justificación:** El proyecto consiste en el desarrollo y comercialización de una plataforma software como servicio (SaaS), actividad que corresponde exactamente a la descripción del código CIIU 6201: "Actividades de desarrollo de sistemas informáticos (software)".

**Descripción del proyecto:**
StockPilot es una plataforma web bajo el modelo Software as a Service (SaaS) diseñada para digitalizar, optimizar y automatizar la gestión de inventarios, ventas y compras de microempresas y pequeñas empresas del sector retail en Colombia, con énfasis en tiendas de barrio, minimercados, ferreterías y distribuidoras de víveres.

El núcleo diferenciador de StockPilot es la integración de un motor de inteligencia artificial predictiva que analiza automáticamente el historial de ventas para calcular velocidades de consumo por producto, logrando:
- Proyectar fechas estimadas de agotamiento y detectar riesgos de desabastecimiento.
- Generar alertas tempranas de vencimiento y sobrestock.
- Sugerir órdenes de compra inteligentes con cantidades óptimas.
- Aprender de sus propias predicciones mediante un bucle de retroalimentación continua (Feedback IA).

---

## MÓDULO I: ¿QUIÉN ES EL PROTAGONISTA?

### 1. Perfil del Cliente y Localización
- **Perfil del Cliente:** Propietarios de tiendas de barrio, minimarkets, ferreterías y comercios minoristas. Hombres y mujeres de 25 a 60 años, que actualmente llevan su contabilidad e inventario en cuadernos o en hojas de cálculo (Excel) muy básicas.
- **Localización:** Zonas urbanas y semi-urbanas de Colombia con acceso a internet.
- **Cliente vs. Consumidor:** El *cliente* es el dueño del negocio (quien paga la suscripción), y el *consumidor* o usuario final es el tendero o cajero que opera el sistema en el día a día.

### 2. Necesidades a Satisfacer
Según metodologías de ideación (Lean Canvas), los tenderos sufren de:
1. **Quiebres de stock:** Pérdida de ventas por no saber qué productos se agotaron.
2. **Capital estancado:** Compra excesiva de productos de baja rotación (sobrestock).
3. **Falta de tiempo:** Hacer el inventario manual toma horas y es propenso a errores humanos.

---

## MÓDULO II: ¿EXISTE OPORTUNIDAD EN EL MERCADO?

### 3. Tendencia y Tamaño del Mercado (TAM, SAM, SOM)
De acuerdo con el Ministerio TIC de Colombia y FENALCO, solo cerca del 30% de las microempresas utilizan software especializado. La necesidad de digitalización en el comercio minorista creció exponencialmente tras la pandemia. 
- **TAM (Mercado Total):** Más de 500,000 tiendas de barrio y comercios minoristas en Colombia.
- **SAM (Mercado Disponible):** ~150,000 tiendas ubicadas en zonas urbanas principales con acceso estable a internet y smartphones.
- **SOM (Mercado Objetivo Inicial):** 120 tiendas en localidades de Bogotá durante el primer año (0.08% del SAM), haciendo el crecimiento altamente realista y alcanzable.

### 4. Análisis de la Competencia
- **Competidores Directos:** Alegra, Siigo, Treinta.
- **Diferencial de StockPilot:** Mientras la competencia se enfoca fuertemente en la *contabilidad fiscal y facturación electrónica*, StockPilot se centra 100% en la **logística operativa y la predicción con IA** (qué comprar, cuándo comprar y alertas de vencimiento), siendo mucho más intuitivo para el tendero de a pie.

---

## MÓDULO III: ¿CUÁL ES MI SOLUCIÓN?

### 5. Propuesta de Solución e Innovación
- **Concepto:** Un Software as a Service (SaaS) de control de inventarios.
- **Propuesta de valor:** "No te quedes sin vender ni compres de más. StockPilot te dice exactamente qué necesita tu tienda usando IA."
- **Componente Innovador:** Integración de un motor de IA que analiza el historial de precios, ventas (*velocity*) y tiempos de entrega (*lead time*) para sugerir órdenes de compra automáticas y evaluar su propia precisión (Feedback IA).

### 6. Nivel de Avance del Proyecto y Arquitectura Tecnológica
- **Avance Técnico (PMV 100% Funcional):** Producto Mínimo Viable desarrollado, desplegado en la nube y sometido a pruebas de carga. Cuenta con cobertura de pruebas E2E y unitarias para asegurar la lógica del negocio.
- **Arquitectura de Software y Stack Tecnológico:**
  - **Frontend (PWA):** Construido con React 19, Vite y TailwindCSS. Está configurado como Aplicación Web Progresiva (PWA), permitiendo su instalación nativa en celulares Android/iOS sin pasar por tiendas de apps, con carga ultrarrápida y cero fricciones.
  - **Backend:** Node.js con Express, protegido por middlewares de seguridad (Helmet, CORS, JWT) y arquitectura basada en controladores y rutas.
  - **Base de Datos:** PostgreSQL en Neon Cloud. Estructura relacional con aislamiento de datos por inquilino (`tienda_id`) para seguridad B2B.
  - **Motor IA:** Integración determinística con la API de OpenAI (GPT-4o-mini).
- **Legal:** En fase de estructuración para constitución como SAS y diseño de la política de tratamiento de datos (Ley 1581).

---

## MÓDULO IV: ¿CÓMO DESARROLLO MI SOLUCIÓN?

### 7. Estrategia de Generación de Ingresos
- **Modelo de Monetización:** Suscripción mensual B2B (SaaS) con un costo promedio de $39,900 COP/mes por tienda. El margen bruto de comercialización se sitúa entre el 70% y el 80%, característico del modelo de software en la nube donde el costo marginal por usuario adicional es cercano a cero.

### 8. Operaciones, Infraestructura y Capacidad Instalada
- **Modelo de Operación 100% Remoto (Home Office):** Las labores de desarrollo, soporte y mantenimiento se gestionan descentralizadamente por los fundadores utilizando sus propios equipos preexistentes (Aporte Propio = $0 COP), eliminando gastos fijos de arrendamiento de oficinas.
- **Inversión Principal Requerida:** La única inversión operativa mensual requerida recae sobre la Infraestructura Cloud (Servidores Render, DB Neon, y Tokens API OpenAI), presupuestada en ~$220,000 COP/mes.
- **Validación de Capacidad (Pruebas de Estrés):** Mediante pruebas de carga en producción con *Autocannon*, se demostró que la infraestructura básica soporta picos de **13 transacciones por segundo (TPS)** con latencias menores a 750ms y un SLA del 100%. Con la meta de 120 tiendas operando, la carga agregada será de apenas 4 TPS, lo que deja una **holgura operativa superior al 70%** para absorber picos comerciales.

### 9. Equipo de Trabajo (Año 1)
- **Director de Tecnología / CTO (Product Owner):** Perfil de Ingeniería de Sistemas. Encargado de la arquitectura de la nube, la IA y la seguridad de la plataforma.
- **Desarrollador FullStack y Soporte:** Desarrollo de mejoras continuas y atención de incidencias técnicas.
- **Líder Comercial (Ventas B2B):** Prospección en campo, demostraciones y *onboarding* de nuevos tenderos.

---

## MÓDULO V: ¿CUÁL ES EL FUTURO DE MI NEGOCIO? 
### (Proyección Financiera y Operativa a 5 Años)

**Objetivo Estratégico:** Escalar el software desde una adopción local hasta posicionarlo como una herramienta líder para minoristas a nivel nacional e internacional.

* **Año 1: Penetración y Adopción Temprana**
  - **Operativo:** Lanzamiento oficial de la plataforma. Configuración de servidores cloud (AWS/Render) de alta disponibilidad.
  - **Comercial:** Estrategia de venta directa en calle (puerta a puerta) y marketing digital local. Meta: 100 tiendas activas.
  - **Financiero:** Flujo de caja apalancado en capital semilla (Ej. Fondo Emprender) para cubrir costos de desarrollo y nómina temprana.

* **Año 2: Consolidación Tecnológica y Retención**
  - **Operativo:** Integración con APIs externas (ej. WhatsApp para alertas automáticas a tenderos). Mejora del modelo de IA con los datos recopilados (Machine Learning aplicado).
  - **Comercial:** Alianzas estratégicas con distribuidoras mayoristas para ofrecer el software a sus clientes. Meta: 500 tiendas activas.
  - **Financiero:** Punto de equilibrio (Break-even). Los ingresos recurrentes (MRR) cubren los costos fijos de la nube y la nómina base.

* **Año 3: Expansión Nacional**
  - **Operativo:** Desarrollo de aplicación móvil nativa para facilitar el registro de ventas desde celulares en comercios pequeños sin PC.
  - **Comercial:** Campañas agresivas de Inbound Marketing y referidos. Apertura en 3 ciudades principales. Meta: 2,000 tiendas activas.
  - **Financiero:** Flujo de caja positivo. Reinversión de utilidades en infraestructura tecnológica y aumento del equipo de soporte al cliente.

* **Año 4: Big Data y Nuevas Líneas de Negocio**
  - **Operativo:** Anonimización de datos masivos (Big Data) para generar reportes sectoriales de consumo.
  - **Comercial:** Venta de insights de mercado a marcas de consumo masivo (FMCG) basados en los datos transaccionales (respetando leyes de privacidad). Meta: 5,000 tiendas activas.
  - **Financiero:** Aumento del ARPU (Ingreso Promedio por Usuario) gracias a nuevas características Premium (Analítica Avanzada).

* **Año 5: Internacionalización y Escalabilidad**
  - **Operativo:** Adaptación fiscal y monetaria del software para otros países de LATAM (México, Perú, Ecuador).
  - **Comercial:** Entrada a nuevos mercados latinoamericanos con problemas similares en el canal tradicional. Meta: 15,000 tiendas activas.
  - **Financiero:** Preparación financiera para una posible ronda de inversión Serie A enfocada en escalamiento regional masivo.

---

## MÓDULO VI: ¿QUÉ RIESGOS ENFRENTO?

### Matriz de Riesgos y Mitigación
1. **Riesgo Técnico:** Caída de los servidores en la nube impidiendo registrar ventas.
   * *Mitigación:* Arquitectura con auto-escalado, balanceadores de carga y copias de seguridad diarias (Backups automáticos en PostgreSQL). Posible implementación de modo "Offline" en el futuro.
2. **Riesgo Comercial:** Alta resistencia al cambio tecnológico por parte de tenderos de edad avanzada.
   * *Mitigación:* Interfaz de usuario (UX/UI) extremadamente intuitiva, capacitaciones personalizadas y diseño adaptado a pantallas táctiles.
3. **Riesgo Financiero:** Alta tasa de cancelación (Churn Rate) si los clientes no ven el valor de la IA.
   * *Mitigación:* El módulo de *Feedback_IA* audita constantemente si la IA está ahorrando dinero a la tienda, permitiendo demostrar el ROI al cliente.

---

## MÓDULO VII: RESUMEN EJECUTIVO
**StockPilot** revoluciona el comercio tradicional al democratizar la Inteligencia Artificial para pequeños y medianos comerciantes. Soluciona el grave problema del control manual de inventario, reduciendo mermas, productos vencidos y pérdida de ventas por falta de stock. Con un modelo SaaS escalable, tecnología moderna (React, Node.js) y proyecciones sólidas de crecimiento, StockPilot no solo organiza negocios, sino que proyecta convertirse en el ecosistema analítico más importante del retail tradicional en los próximos 5 años.

---

## BIBLIOGRAFÍA Y ANEXOS

**Fuentes Teóricas, de Mercado e Industria:**
1. **DANE.** (2022). *Encuesta de Micronegocios (EMICRON) y comercio minorista en Bogotá.*
2. **MinCIT.** (2023). *Reporte de empresas activas y digitalización comercial en Colombia.*
3. **FENALCO.** (2021). *El estado de las tiendas de barrio en Colombia y su perfil sociodemográfico.*
4. **iNNpulsa & Centro Nacional de Consultoría.** (2024). *Estudio de apropiación y transformación digital en Mipymes.*
5. **BID (Banco Interamericano de Desarrollo).** (2021). *Estudios sobre merma y desperdicio de alimentos perecederos en microempresas.*
6. **SENA (Fondo Emprender).** (s.f.). *Guía de formulación de planes de negocio.*
7. **Congreso de la República de Colombia.** (2012). *Ley 1581 de 2012 (Ley de Protección de Datos Personales) y Ley 905 de 2004 (Mipymes).*
8. **Gamma, E., et al.** (1995). *Design Patterns: Elements of Reusable Object-Oriented Software* (Patrones MVC y Factory Method).
9. **Davis, F. D.** (1989). *Modelo de Aceptación Tecnológica (TAM).*
10. **OpenAI.** (2024). *Documentación técnica de modelos de lenguaje de gran escala (GPT-4o-mini).*

**Anexos:**
- Documento de Requerimientos Funcionales y No Funcionales.
- Diagrama Entidad-Relación (ERD) del Sistema.
- Archivo de Evidencia de Pruebas Unitarias (`evidencia_pruebas.json`).
