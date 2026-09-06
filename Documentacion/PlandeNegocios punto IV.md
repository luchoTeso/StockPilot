**IV. ¿CÓMO DESARROLLO MI SOLUCIÓN?**

### **9. ¿Cómo obtendrá ingresos? Describa la estrategia de generación de ingresos para su proyecto.**

**Modelo de negocio / Cobro:** Suscripción mensual bajo esquema Software as a Service (SaaS) B2B. Se manejan planes flexibles desde $39,900 COP/mes por tienda (con opción de planes superiores según el número de sucursales, usuarios adicionales y volumen de consultas al copiloto de IA).

**Estrategia de mercadeo y ventas:**

* **Canales de comercialización:** Venta directa digital mediante landing page optimizada, prospección directa en campo en localidades con alta densidad comercial en Bogotá (Kennedy, Suba, Engativá, Barrios Unidos) y alianzas estratégicas con asociaciones de comerciantes y distribuidores mayoristas de abarrotes.
* **Estrategias de atracción:** Demostración interactiva sin barreras ("Explorar Demo"), periodo de prueba guiado (15 días gratis), testimoniales de tenderos pioneros y atención personalizada vía WhatsApp Business.

---

### **10. Describa las condiciones comerciales que aplican para el portafolio de sus productos**

#### **Cliente (B2B - Propietarios de Tiendas / Microempresarios / Distribuidoras)**

* **Volúmenes y frecuencia de compra:** Suscripción recurrente mensual (con descuento por pago anual adelantado).
* **Características exigidas para la compra:** Plataforma intuitiva que no requiera conocimientos técnicos ni capacitaciones complejas, costo accesible, funcionamiento fluido desde cualquier navegador móvil o de escritorio, y respuesta inmediata en el registro de movimientos.
* **Sitio de compra:** Plataforma Web oficial de StockPilot (Landing Page con pasarela integrada).
* **Forma de pago:** Pagos electrónicos automáticos (PSE, tarjetas de crédito/débito, Nequi, Daviplata) mediante pasarelas de pago colombianas.
* **Precio:** Plan Base: $39,900 COP/mes por establecimiento de comercio.
* **Requisitos post-venta:** Mesa de ayuda y soporte técnico vía chat/WhatsApp, videos tutoriales de onboarding y actualizaciones periódicas sin costo adicional.
* **Garantías:** Disponibilidad de servicio (SLA) del 99.5%, copias de seguridad automáticas diarias de la base de datos y cifrado de contraseñas/datos sensibles.
* **Margen de comercialización:** 70% a 80% (Margen bruto característico del modelo SaaS, donde el costo marginal por nuevo usuario es principalmente infraestructura en nube y tokens de IA).
* **Validación de mercado:** Entrevistas directas con tenderos de Bogotá, encuestas sobre uso de herramientas digitales en microempresas (respaldadas en datos de iNNpulsa y DANE) y pruebas piloto en puntos de venta reales.

#### **Consumidor (Tendero / Administrador de Punto de Venta / Cajero)**

* **¿Dónde compra / usa?:** Directamente en el mostrador del negocio mediante el smartphone, tablet o computador del punto de venta.
* **Características exigidas:** Carga ultrarrápida, interfaz semaforizada para vencimientos y stock crítico, sugerencias claras en lenguaje natural y mínimo consumo de datos móviles.
* **Frecuencia de uso:** Diaria y continua durante la jornada comercial (apertura, registro de ventas, recepción de mercancía y balance de cierre).
* **Precio:** Incluido en la suscripción contratada por el negocio.

---

### **11. Proyección de cantidades y precios de venta (mensual) y justificación**

* **Proyección de cantidades (Año 1):** Crecimiento escalonado y orgánico:
  * Mes 1 - 3: 10 a 25 tiendas activas (Fase piloto y validación en localidades piloto).
  * Mes 4 - 6: 25 a 50 tiendas activas (Consolidación de referidos y prospección en campo).
  * Mes 7 - 12: 50 a 120 tiendas activas (Maduración comercial y canal digital).
* **Proyección precios de venta:** $39,900 COP / suscripción mensual promedio.
* **Forma de pago:** Contado (pago anticipado al inicio de cada mes de servicio).
* **Justificación técnica y comercial:**
  * Bogotá cuenta con más de 45,000 tiendas de barrio y minimercados registrados. Capturar 120 tiendas en el primer año representa menos del 0.3% del mercado potencial de la ciudad, una meta conservadora y alcanzable con un solo asesor de campo y pauta digital localizada.
  * *Soportes:* Reportes del DANE sobre digitalización en micronegocios, boletines de FENALCO ("Fenaltiendas") y métricas de retención de las pruebas piloto.

---

### **12. Normatividad que debe cumplirse para el portafolio**

| Tipo de Normatividad | Identificación de la Norma, Procesos, Costos y Tiempos |
| :--- | :--- |
| **Empresarial (Constitución)** | Ley 1258 de 2008 (Sociedades por Acciones Simplificadas - SAS) y Ley 905 de 2004 (Mipymes). Registro en Cámara de Comercio de Bogotá y matrícula mercantil. Costo: ~$350,000 COP. Tiempo: 3 a 5 días hábiles. |
| **Tributaria y Facturación** | Estatuto Tributario, Decreto 410 de 1971 (Código de Comercio) y resoluciones de facturación electrónica DIAN. Inscripción en RUT con responsabilidad de servicios digitales. Tiempo: 1 día. |
| **Protección de Datos Personales** | Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013 (Habeas Data). Política de Tratamiento de Información, términos de servicio y aviso de privacidad implementados en la plataforma. Costo: Asesoría legal inicial (~$500,000 COP). |
| **Comercio Electrónico y Seguridad** | Ley 527 de 1999 (Mensajes de datos y comercio electrónico). Implementación de certificados SSL/TLS, almacenamiento seguro de credenciales con bcrypt y pasarelas de pago certificadas PCI-DSS. |
| **Registro de Marca y Propiedad Intelectual** | Decisión 486 de la Comunidad Andina y normatividad de la SIC. Registro de marca mixta "StockPilot" ante la Superintendencia de Industria y Comercio. Costo: ~$1,150,000 COP (tarifa preferencial para microempresas). Tiempo: 6 a 8 meses. |
| **Laboral** | Código Sustantivo del Trabajo. Contratación formal del equipo con pago de seguridad social integral (salud, pensión, ARL, parafiscales). |

---

### **13. Condiciones técnicas más importantes que se requieren para la operación**

* **Arquitectura del Sistema:** Arquitectura desacoplada cliente-servidor basada en micro-servicios modulares con patrón MVC y Factory Method, permitiendo escalar el frontend y la API de manera independiente.
* **Stack Tecnológico:**
  * **Backend:** Node.js con framework Express, middleware de seguridad (Helmet, CORS, Rate-Limiting) y autenticación JWT con roles jerárquicos (RBAC).
  * **Frontend:** Single Page Application (SPA) con React 19, Vite y TailwindCSS, optimizada para carga rápida y consumo eficiente en dispositivos móviles.
  * **Base de Datos:** PostgreSQL 15 en la nube, con modelos relacionales normalizados, integridad referencial y aislamiento multi-tenant por tienda (`tienda_id`).
  * **Motor de Inteligencia Artificial:** Integración con OpenAI API (modelo GPT-4o-mini), complementado con categorización analítica ABC y sistema de caché determinístico para optimización de consumo de tokens.
* **SLA y Tiempos de Respuesta:** Latencia media en API menor a 200ms en operaciones de lectura y menos de 350ms en transacciones de escritura. Tasa de disponibilidad objetivo (SLA) del 99.5%.

---

### **14. Requerimientos en Infraestructura, Maquinaria, Equipos y Activos**

#### **14.1 ¿Es necesario un lugar físico de operación?**

* **Respuesta:** No es necesario / Operación 100% Remota (Home Office).
* **Justificación:** Al ser una plataforma nativa digital (SaaS en la nube) desarrollada en el marco de la carrera de ingeniería, las operaciones de programación, despliegue y soporte técnico se gestionan de forma remota y descentralizada por el equipo fundador desde sus propios domicilios. No se requiere arrendar ni adecuar un local comercial u oficina física.

#### **14.2 Requerimientos de inversión**

| Tipo de Activo | Descripción | Cantidad | Valor Unitario* | Observación / Requisitos técnicos |
| :--- | :--- | :--- | :--- | :--- |
| **Maquinaria y Equipo** | Laptops para desarrollo y soporte técnico | 2 | $0 COP (Aporte propio) | Equipos preexistentes propiedad de los fundadores (Intel Core i7 / AMD Ryzen, 16GB RAM). No requieren inversión nueva. |
| **Infraestructura Cloud** | Servidores, Base de Datos PostgreSQL y consumo API IA | 12 (meses) | $220,000 COP/mes | Nube con alta disponibilidad (Render, Neon), gestionado con backups diarios y tokens de OpenAI. |
| **Comunicaciones** | Enlace de internet fibra óptica | 12 (meses) | $0 COP (Aporte propio) | Conexión de uso doméstico asumida por los fundadores. |
| **Muebles y Enseres** | Puestos de trabajo (sillas, escritorios) | 2 | $0 COP (Aporte propio) | Adecuaciones preexistentes en los domicilios del equipo. |
| **Gastos Preoperativos** | Trámites legales y dominios web | 1 | $500,000 COP | Compra de dominio, certificados SSL y registros básicos. |

*\*Se resalta que la mayor parte de la infraestructura física ya está cubierta como aporte del equipo emprendedor, concentrando los gastos únicamente en la infraestructura Cloud.*

#### **14.3 Condiciones técnicas de infraestructura y áreas**

* **Área requerida:** No aplica un área comercial. Se utilizan los espacios de trabajo (Home Office) de los integrantes del equipo.
* **Uso del suelo (POT):** No aplica al no requerir un establecimiento físico abierto al público ni instalaciones industriales.

#### **14.4 ¿Importación de activos?**

* **Respuesta:** NO.
* **Justificación:** Toda la infraestructura física ya está en el país. Los servicios de software e infraestructura cloud se pagan bajo suscripción digital mensual.

---

### **15. ¿Cuál es el proceso que se debe seguir para la producción del bien o servicio?**

**Bien / Servicio:** Servicio continuo de software en la nube (StockPilot SaaS)  
**Unidades a producir:** Disponibilidad ininterrumpida 24/7 y atención a tiendas suscritas.

| Actividad del proceso | Tiempo estimado | Cargos que participan | N° de personas | Equipos y herramientas / Capacidad |
| :--- | :--- | :--- | :--- | :--- |
| **1. Prospección y alta de cliente (Onboarding)** | 25 min | Líder Comercial / Soporte | 1 | CRM / Panel administrativo / WhatsApp Business |
| **2. Configuración inicial de tienda y usuarios** | 10 min | Soporte Técnico | 1 | API StockPilot (Módulo de Tiendas y Permisos) |
| **3. Carga de catálogo y saldos de inventario** | 45 min | Asesor de Soporte + Tendero | 1 | Módulo de Productos / Plantilla de importación masiva |
| **4. Capacitación básica y entrega de accesos** | 20 min | Líder Comercial / Soporte | 1 | Guía interactiva / Smartphone del cliente |
| **5. Operación automática y alertas inteligentes** | Continuo (24/7) | Sistema automatizado | - | Servidores cloud, motor de inventarios y OpenAI API |
| **6. Mantenimiento, pruebas CI/CD y copias de seguridad** | 4 horas / semana | CTO / Desarrollador | 2 | Repositorio GitHub, suite de pruebas automatizadas y panel cloud |
| **Total tiempo de activación por cliente nuevo:** | **~1.7 Horas** | | | |

---

### **16. ¿Cuál es la capacidad productiva de la empresa?**

* **Capacidad instalada del sistema (Infraestructura Cloud):**  
  A diferencia de una empresa manufacturera tradicional, en una solución de base tecnológica (SaaS) la capacidad instalada se cuantifica en **concurrencia de usuarios, transacciones procesadas por segundo (RPS) y tiempo de respuesta (latencia)** del servidor y la base de datos relacional.  
  La infraestructura base en la nube (Render + Neon PostgreSQL) cuenta con una capacidad instalada comprobada para despachar entre **13 y 25 transacciones por segundo en su configuración básica**, lo que equivale a una capacidad nominal de procesamiento superior a **1,000,000 de transacciones mensuales** en un único nodo de servicio, escalable vertical u horizontalmente según la demanda sin suspender la operación.

* **Validación empírica mediante pruebas de esfuerzo (Benchmarking en Producción):**  
  Para sustentar técnicamente la capacidad instalada con datos reales de campo, se ejecutaron pruebas de estrés y carga sobre el entorno activo en producción (`https://stockpilot-qg0s.onrender.com/`) utilizando la herramienta industrial **Autocannon** con conexiones concurrentes sostenidas:

  | Métrica Técnica Evaluada | Prueba 1: Carga Moderada (5 Conexiones Concurrentes) | Prueba 2: Carga Pico (10 Conexiones Concurrentes) |
  | :--- | :--- | :--- |
  | **Duración del test** | 10 segundos continuos | 10 segundos continuos |
  | **Peticiones completadas** | 52 transacciones | 139 transacciones |
  | **Throughput (RPS)** | 4.7 req / segundo | **12.9 req / segundo** (~774 transacciones/minuto) |
  | **Latencia promedio** | 1,044 ms (absorbiendo warm-up de conexión) | **747 ms** (Mediana: 686 ms; Mejor: 359 ms) |
  | **Percentil 97.5% (p97.5)** | 4.4 segundos | **2.02 segundos** |
  | **Tasa de errores / caídas** | **0% (100% de disponibilidad)** | **0% (100% de disponibilidad)** |

* **Capacidad utilizada proyectada (Año 1):**  
  * *Meta comercial al Año 1:* 120 tiendas suscritas activas.  
  * *Demanda operativa estimada:* Una tienda de barrio promedio registra entre 40 y 60 transacciones diarias distribuidas en una jornada comercial de 12 horas (~0.05 a 0.08 solicitudes/segundo por tienda).  
  * *Porcentaje de uso de la capacidad instalada:* Con las 120 tiendas operando simultáneamente, la demanda pico agregada del sistema se estima entre **2 y 4 solicitudes por segundo**. Esto demuestra que durante el Año 1, StockPilot operará utilizando entre el **15% y el 30% de la capacidad de su infraestructura básica**, garantizando un **margen de holgura superior al 70%** para absorber picos comerciales (fines de semana, quincenas y fechas festivas) con un nivel de servicio (SLA) del 99.5%.

---

### **17. Equipo de trabajo**

#### **17.1 Perfil del emprendedor, rol y dedicación**

* **Perfil:** Ingeniero(a) de Sistemas con formación sólida en arquitectura de software web, bases de datos relacionales, seguridad informática e integración de modelos de Inteligencia Artificial.
* **Rol:** Director de Tecnología (CTO) y Gerente de Producto (Product Owner).
* **Dedicación:** Tiempo completo (44 horas semanales).

#### **17.2 Cargos requeridos para la operación (Año 1)**

| Nombre del Cargo | Funciones principales | Perfil (Formación y Experiencia) | Tipo de Contratación | Dedicación | Valor Remuneración (Inc. Seg. Social) | Mes Vinculación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Director de Tecnología / CTO** | Dirección técnica, arquitectura de software, gestión de infraestructura cloud, seguridad y supervisión de IA. | Profesional en Ing. de Sistemas, experiencia en Node.js, React y bases de datos. | Nómina | Tiempo Completo | $3,500,000 COP | Mes 1 |
| **Desarrollador y Soporte Técnico** | Atención de incidencias de clientes, desarrollo de mejoras continuas, pruebas unitarias y E2E. | Tecnólogo o estudiante de últimos semestres de Ing. de Sistemas, 1 año de experiencia. | Nómina | Tiempo Completo | $2,200,000 COP | Mes 2 |
| **Líder Comercial y Adopción** | Prospección de tiendas en localidades objetivo, demostraciones en sitio, onboarding y fidelización de tenderos. | Profesional o tecnólogo en Mercadeo, Administración o afines, 1 año en ventas B2B / campo. | Nómina + Comisiones por venta | Tiempo Completo | $2,000,000 COP + Comisiones | Mes 1 |
