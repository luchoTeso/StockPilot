**UNIVERSIDAD CENTRAL**

Facultad de Ingeniería y Ciencias Básicas

Departamento de Ingeniería de Sistemas

Práctica de Ingeniería IV

+:---------------------------------------------------------------------:+
| **StockPilot**                                                        |
|                                                                       |
| **Sistema de Gestión de Inventario Inteligente**                      |
|                                                                       |
| *con Motor de Predicción de Demanda e Inteligencia Artificial*        |
+-----------------------------------------------------------------------+

**Documentación Técnica Integral de Diseño y Desarrollo**

**Autores:**

Elizabeth Pérez González

Luis Alberto Diuche Peña

*Docente asesora: Angie Lorena Aldana Padilla*

Bogotá D.C., Colombia --- 2026

**Tabla de Contenido**

**Resumen Ejecutivo**

StockPilot es una aplicación web de gestión de inventarios inteligente
orientada a microempresas de distribución de víveres en Bogotá,
Colombia. El sistema surge en respuesta a una brecha técnica crítica
identificada: el 86% de estas microempresas opera con registros manuales
(libretas, hojas de cálculo), generando errores en 3 de cada 10
transacciones, pérdidas del 4.76% en ventas por mermas y vencimientos, y
compras de emergencia que representan el 22% de las adquisiciones
(Microsip, 2023; BID, 2021).

La solución integra técnicas clásicas de gestión de inventarios
---clasificación ABC (Pareto), punto de reorden (ROP), promedios móviles
ponderados--- con un copiloto de inteligencia artificial basado en
OpenAI GPT-4o-mini, que genera ajustes porcentuales sobre las
sugerencias matemáticas base, con trazabilidad completa de cada decisión
del modelo. El sistema cuenta con 62 requerimientos funcionales y 18 no
funcionales implementados al 100%, organizados en 15 módulos, y fue
desarrollado bajo la metodología ágil Scrum en 5 sprints de dos semanas.

  -----------------------------------------------------------------------
  **Título oficial del proyecto**

  Desarrollo e implementación de una aplicación web con módulo de
  predicción de demanda basado en análisis de ventas para la optimización
  de inventarios, control de caducidad y alertas inteligentes de
  reabastecimiento en microempresas de distribución de víveres en Bogotá
  durante el periodo 2026--2027.
  -----------------------------------------------------------------------

  ------------------------------------------------------------------------
  **Dimensión**     **Detalle**
  ----------------- ------------------------------------------------------
  Institución       Universidad Central --- Facultad de Ingeniería y
                    Ciencias Básicas

  Asignatura        Práctica de Ingeniería IV

  Docente asesora   Angie Lorena Aldana Padilla

  Desarrolladores   Elizabeth Pérez González · Luis Alberto Diuche Peña

  Período           2026

  Stack principal   Node.js 18 + Express.js + React 19 + SQLite3 + OpenAI API

  RF implementados  62 de 62 (100%)

  RNF implementados 18 de 18 (100%)

  Módulos del       15
  sistema           

  Casos de uso      24 (6 paquetes)
  documentados      

  Sprints           5 (10 semanas de desarrollo)
  realizados        
  ------------------------------------------------------------------------

**1. Contexto del Problema**

**1.1 Identificación de la Brecha Técnica**

Las microempresas de distribución de víveres en Bogotá presentan una
brecha técnica crítica entre sus procesos actuales de gestión de
inventarios y el estado ideal de eficiencia operativa basada en datos.
Actualmente, estas empresas operan bajo un esquema reactivo y manual: el
86% utiliza libretas, hojas de cálculo o la memoria del tendero para el
control de existencias. Esto contrasta con la situación ideal esperada:
una gestión proactiva que, mediante análisis predictivo, permita
anticipar el desabastecimiento, prevenir la caducidad de productos y
optimizar la planeación de compras.

La ausencia de un sistema que automatice la captura de datos de ventas y
los transforme en inteligencia de negocio (proyecciones de demanda,
clasificación ABC, alertas tempranas) impide a los tenderos tomar
decisiones basadas en evidencia, limitando su capacidad para competir
con cadenas de suministro más tecnificadas (Polo-Triana et al., 2024).

**1.2 Cuantificación del Problema**

  -------------------------------------------------------------------
  **Indicador**               **Cifra**        **Fuente**
  --------------------------- ---------------- ----------------------
  Microempresas que usan      86%              Microsip, 2023
  métodos manuales                             

  Errores en transacciones    3 de cada 10     Microsip, 2023; Vera,
  por registros manuales                       2020

  Pérdidas económicas         4.76%            BID, 2021
  promedio en ventas                           

  Productos perecederos que   28%              BID, 2021
  se deterioran antes de la                    
  venta                                        

  Productos de lenta rotación 19%              MRPEasy, s.f.
  que caducan en estantería                    

  Tiendas con faltantes de    61%              Microsip, 2023
  alta demanda simultáneos a                   
  excesos                                      

  Clientes que abandonan la   42%              DANE, 2022
  compra por falta de                          
  productos básicos                            

  Compras de emergencia a     22% de           MRPEasy, s.f.
  precios inflados            adquisiciones    

  Propietarios que desconocen 92%              Vera, 2020
  técnicas ABC de inventario                   

  Microempresas que cierran   70%              eWorkplace, 2023
  antes de 5 años de                           
  operación                                    

  Pérdida de empleos anuales  \~28,000         DANE, 2022
  en Bogotá por cierres                        

  Pérdida de participación de 2.7%             MinCIT, 2023
  mercado anual frente a                       
  cadenas                                      
  -------------------------------------------------------------------

**1.3 Formulación del Problema**

  -----------------------------------------------------------------------
  **Pregunta generadora**

  ¿De qué manera las deficiencias en la administración y gestión de
  inventarios afectan la viabilidad económica, la eficiencia operativa y
  la competitividad de las microempresas de distribución de víveres en
  Bogotá, y cuáles son los factores determinantes que contribuyen a esta
  problemática?
  -----------------------------------------------------------------------

**1.4 Hipótesis del Proyecto**

La implementación de una aplicación web con un módulo de predicción de
demanda basado en el análisis del histórico de ventas y niveles de
inventario permitirá:

- Reducir en al menos un 25% las pérdidas económicas asociadas a
  productos vencidos y desabastecimiento mediante la generación de
  recomendaciones de compra anticipadas y alertas de reposición.

- Disminuir en un 35% el tiempo promedio dedicado a la planeación de
  compras y revisión manual de inventarios, al automatizar la
  identificación de productos críticos por rotación y nivel de stock.

- Incrementar en un 20% la precisión de las órdenes de compra (medida
  como la reducción de compras de emergencia y excesos de inventario)
  mediante sugerencias basadas en patrones de venta históricos y
  estacionales.

- Mejorar en un 30% la disponibilidad de productos de alta rotación,
  reduciendo los episodios de faltantes que generan pérdida de ventas y
  clientes.

**1.5 Población Objetivo**

La población objetivo está constituida por las microempresas de
distribución de víveres del perímetro urbano de Bogotá, Distrito
Capital. En Bogotá, epicentro del 24.7% del PIB empresarial colombiano
(MinCIT, 2023), el 92.9% de las empresas son microempresas (463,596
unidades), de las cuales entre 40,000 y 50,000 se dedican
específicamente a la distribución de víveres (DANE, 2022).

Según la Ley 905 de 2004, las microempresas se definen como unidades con
planta de personal no superior a diez (10) trabajadores y activos
totales inferiores a 501 salarios mínimos mensuales legales vigentes. En
el sector de víveres, estas empresas manejan inventarios valorados entre
5 y 50 millones de pesos, con rotación entre 12 y 24 veces por año,
variedad de 50 a 500 referencias, y ventas mensuales de 2 a 15 millones
de pesos.

Las localidades con mayor concentración son Kennedy (11.5%), Suba
(10.7%) y Engativá (8.8%) del sector comercio bogotano (ODE, 2025).

**2. Estado del Arte**

**2.1 Evolución Histórica de las Soluciones de Inventario**

**1990 --- Inicios de la automatización**

Las grandes empresas comenzaron a adoptar hojas de cálculo y software
local. Sin embargo, los altos costos de hardware y la necesidad de
personal capacitado hacían estas soluciones inaccesibles para
microempresas. Solo el 15% de tenderos bogotanos usaban software básico
en 2015 (Cámara de Comercio de Bogotá, 2015).

**2004 --- Marco legal (Ley 905)**

La Ley 905 de 2004 estableció la clasificación formal de microempresas
en Colombia, promoviendo el desarrollo de políticas públicas y
reconociendo la necesidad de soluciones diferenciadas para este
segmento.

**2010 --- Democratización con la nube**

Herramientas como Zoho Inventory, Square y otras SaaS comenzaron a
ofrecer funcionalidades avanzadas (códigos de barras, informes en tiempo
real) a costos reducidos. Sin embargo, la adopción en Bogotá permaneció
baja.

**2018 --- Sistemas para microempresas**

Alcívar y Alejandro (Universidad de Guayaquil) propusieron un sistema de
inventario perpetuo para pequeñas empresas. Moreira-Cañarte y
Peñafiel-Rivas demostraron que el manejo ineficiente del inventario
impacta directamente la rentabilidad.

**2021 --- Soluciones especializadas para tenderos en
Colombia**

Surgieron plataformas como Tienda Pago, que integran gestión de
inventarios con servicios financieros, permitiendo a los tenderos
registrar ventas, controlar stock y acceder a créditos. Este hito marcó
el inicio de la inclusión digital del sector.

**[2022-2024 --- IA y predicción de demanda]{.underline}**

Ji et al. (2024) demostraron una reducción del 29.23% en el Error
Absoluto Medio (MAE) usando XGBoost para predecir ventas diarias.
Polo-Triana et al. (2024) confirmaron que la analítica de datos es un
habilitador de competitividad, pero identificaron la falta de capacidad
técnica del personal como la principal barrera de adopción.

**2.2 Análisis Comparativo --- Brechas Tecnológicas**

  --------------------------------------------------------------------------
  **Referencia**   **Metodología /  **Resultados y     **Brecha
                   Algoritmo**      Métricas**         Identificada**
  ---------------- ---------------- ------------------ ---------------------
  Sadeghi et al.   Deep Learning    Modelos neuronales Modelos teóricos de
  (2023) \[PubMed: (LSTM, CNN) en   superan a          alta complejidad,
  36212799\]       cadenas de       estadísticos en    inviables para
                   suministro       alta incertidumbre microempresas sin
                                                       personal técnico

  Ji et al. (2024) XGBoost para     MAE -29.23%, RMSE  No integra predicción
  \[DOI:           predecir ventas  -34.54% vs.        con alertas de
  10.32996\]       diarias en       métodos manuales   caducidad,
                   comercio                            clasificación ABC ni
                   minorista                           órdenes de compra
                                                       automáticas

  Polo-Triana et   Revisión         Analítica de datos Ausencia de
  al. (2024)       sistemática ML   habilita           herramienta de bajo
  \[DOI: 10.3926\] para PyMEs       competitividad;    costo que traduzca la
                   colombianas      barrera: falta de  teoría a una interfaz
                                    capacidad técnica  web para el tendero
                                    del personal       

  Hincapié Herrera H2O AutoML +     Mejoró niveles de  Diseñado para grandes
  (2021) \[UdeA:   Random Forest    servicio alineando volúmenes de datos;
  10495/19929\]    para retail      compras con        no se adapta a la
                                    proyecciones       baja digitalización
                                    estadísticas       del comercio
                                    robustas           minorista de barrio

  Acevedo (2022)   Herramienta      Digitalización     Sin análisis
  \[UTS\]          ofimática para   básica del control predictivo, sin
                   inventarios de   de                 clasificación ABC
                   microempresas    entradas/salidas   dinámica, sin
                                                       copiloto IA

  Jiménez & Pérez  Sistema con      Mejora en          Aplicación puntual a
  (2022) \[UCSG\]  clasificación    organización de    una empresa; sin
                   ABC para         productos y        automatización de
                   microempresa     reducción de       alertas ni predicción
                   \'Los Andes\'    pérdidas           de demanda
  --------------------------------------------------------------------------

**2.3 Posicionamiento de StockPilot**

La revisión del estado del arte revela una brecha consistente: las
soluciones existentes son o bien demasiado complejas técnicamente para
microempresas sin personal especializado, o bien demasiado básicas para
ofrecer inteligencia predictiva real. StockPilot cierra esta brecha al
combinar algoritmos de gestión de inventarios probados (ROP, ABC,
promedios móviles) con un copiloto IA accesible vía API, empaquetado en
una interfaz web diseñada específicamente para el contexto operativo del
tendero bogotano.

  -----------------------------------------------------------------------
                                **PARTE I**

              **Sección de Diseño: Arquitectura y Modelado**
  -----------------------------------------------------------------------

**3. Arquitectura de Software --- Patrón MVC**

**3.1 Justificación de la Arquitectura**

El sistema StockPilot adopta el patrón Modelo-Vista-Controlador (MVC)
como arquitectura base. Esta decisión responde a la necesidad de separar
tres preocupaciones fundamentales que coexisten en el sistema: la lógica
de predicción e IA (compleja, cambiante), la presentación al tendero
(simple, orientada a decisiones rápidas) y el acceso a datos
(multi-tienda, con integridad referencial estricta).

La separación MVC garantiza que: (a) el motor de IA puede ser sustituido
(ej. de GPT-4o-mini a un modelo propio) sin tocar la interfaz; (b) la
base de datos puede migrarse de SQLite a PostgreSQL sin modificar los
controladores; y (c) la interfaz puede evolucionar hacia un SPA sin
alterar la lógica de negocio. Esto cumple el principio de
Abierto/Cerrado (OCP) y el principio de Responsabilidad Única (SRP) del
diseño SOLID.

**3.2 Descripción de las Capas**

**3.2.1 Capa Vista --- Frontend (Presentación)**

- Tecnología: React 19, TailwindCSS 4, JavaScript ES6+ con Axios para peticiones a la API. Arquitectura Single Page Application (SPA).

- Responsabilidad: Renderizar la interfaz que el usuario ve; capturar
  eventos del usuario (clics, formularios) y enviarlos al controlador
  mediante peticiones HTTP o fetch.

- Diseño responsive desde 375px (móvil) hasta 1920px (escritorio),
  cumpliendo RNF-008.

- Feedback visual inmediato mediante toasts de éxito/error en cada
  acción (RNF-009).

- Landing Page pública con presentación del sistema, planes y formulario
  de registro del administrador maestro.

- Dashboard principal con KPIs en tiempo real: 4 tarjetas de
  indicadores, semáforo MEBI (Monitor de Estado del Inventario), gráfico
  de barras del ritmo de caja de los últimos 7 días, y ROI proyectado
  sobre el stock actual.

**3.2.2 Capa Controlador --- Lógica de Negocio**

- Tecnología: Node.js 18 LTS + Express.js 4.18.x como framework HTTP.

- Responsabilidad: Recibir las peticiones HTTP desde la Vista, aplicar
  las reglas de negocio (validaciones, cálculos, invocación de servicios
  de IA) y seleccionar la Vista o la respuesta JSON apropiada.

- Rutas RESTful organizadas por módulo: /auth, /productos, /ventas,
  /movimientos, /alertas, /proveedores, /reportes, /ai, /usuarios,
  /tienda, /simulador, /aprendizaje.

- Middleware requireLogin protege todas las rutas privadas (RNF-006);
  middleware requireAdmin restringe módulos administrativos.

- Servicios especializados en /services/: demandEngine.js (motor
  predictivo), aiService.js (OpenAI + guardrails), alertsEngine.js,
  scenarioSimulator.js, feedbackEngine.js, reportService.js,
  emailService.js.

- Sistema de caché de IA basado en hash MD5 para evitar llamadas
  redundantes a la API de OpenAI (RNF-003).

- Cron job con node-cron para envío automatizado de resúmenes de alertas
  cada lunes a las 8:00 AM (RF-059).

**3.2.3 Capa Modelo --- Acceso a Datos**

- Tecnología: SQLite3 (base de datos de archivo embebida, sin servidor
  externo).

- Responsabilidad: Persistir y consultar datos, garantizar integridad
  referencial mediante claves foráneas, ejecutar migraciones explícitas mediante el comando migrate (RNF-014).

- 13 tablas principales con segregación multi-tienda por clave id_tienda
  en todos los registros operativos (RF-018, RF-019).

- Contraseñas almacenadas exclusivamente como hash bcrypt con 10 salt
  rounds; nunca en texto plano (RF-006, RNF-004).

- Soporte de migraciones sin pérdida de datos: las nuevas columnas se
  añaden con ALTER TABLE y valores DEFAULT.

**3.3 Stack Tecnológico Completo**

  --------------------------------------------------------------------------------
  **Capa**         **Tecnología**    **Versión**   **Rol específico en
                                                   StockPilot**
  ---------------- ----------------- ------------- -------------------------------
  Runtime de       Node.js           18.x LTS      Plataforma de ejecución del
  servidor                                         servidor Express y todos los
                                                   servicios

  Framework HTTP   Express.js        4.21.x        Enrutamiento, middleware de
                                                   sesiones, servicio de assets
                                                   estáticos

  Base de datos    SQLite3           5.1.x         Persistencia relacional
                                                   embebida; migración futura a
                                                   PostgreSQL

  Autenticación    bcrypt            6.0.x         Hash irreversible de
                                                   contraseñas con 10 salt rounds

  Gestión de       express-session   1.18.x        Sesiones del lado del servidor
  sesiones                                         con invalidación de
                                                   concurrencia

  Seguridad        helmet            8.1.x         Protección de cabeceras HTTP

  Protección DDoS  express-rate-     8.3.x         Prevención de ataques de 
                   limit                           fuerza bruta

  CORS             cors              2.8.x         Intercambio de recursos de 
                                                   origen cruzado

  Entorno          dotenv            17.3.x        Carga de variables de entorno

  IA Generativa    OpenAI Node SDK   6.32.x        Integración con GPT-4o-mini
                                                   para copiloto estratégico

  Exportación      exceljs           4.4.x         Generación de archivos .xlsx
  Excel                                            para reportes de ventas e
                                                   inventario

  Generación PDF   pdfkit            0.18.x        Reportes PDF de auditoría de
                                                   merma con formato COP

  Correo           nodemailer        8.0.x         Envío de resúmenes semanales de
  electrónico                                      alertas vía SMTP

  Automatización   node-cron         4.2.x         Tarea programada: resumen
                                                   semanal lunes 8:00 AM

  Desarrollo       nodemon           (vía npx)     Recarga automática del servidor
                                                   ante cambios de código

  Pruebas          vitest            4.1.x         Framework de testing para
                                                   pruebas unitarias y cobertura

  Pruebas E2E      playwright        1.50.x        Framework para pruebas 
                                                   end-to-end automatizadas

  Control de       Git + GitHub      ---           Control de versiones y
  versiones                                        colaboración con ramas por
                                                   módulo
  --------------------------------------------------------------------------------

**3.4 Diagrama de Componentes --- Mapa del Sistema**

  -----------------------------------------------------------------------------
  **Componente**        **Tipo**      **Entrada**          **Salida / Acción**
  --------------------- ------------- -------------------- --------------------
  Landing Page +        Vista (React) ---                  Formularios de
  Login + Registro                                         autenticación, CTA
                                                           al sistema

  Dashboard + Centro    Vista (React) JSON KPIs            Tarjetas KPI,
  Analítico                                                Asistente IA,
                                                           gráfico caja, ABC

  Módulo Alertas        Vista (React) JSON alertas         Lista filtrable,
                                                           marcar resueltas,
                                                           forzar recálculo

  Módulo Ventas +       Vista (React) JSON                 Historial, top 10,
  Movimientos                         ventas/movimientos   exportar XLSX

  Módulo Productos      Vista (React) JSON productos       Tabla semáforo,
                                                           CRUD, configuración
                                                           reabastecimiento

  Módulo Proveedores +  Vista (React) JSON proveedores +   Órdenes IA,
  Simulador                           cálculos             simulador greedy,
                                                           historial

  Auth Controller       Controlador   Credenciales usuario Sesión +
                                                           redirección; bcrypt;
                                                           anti-concurrencia

  Productos Controller  Controlador   Form producto        CRUD + clasificación
                                                           ABC recalculada

  AI Service            Servicio      KPIs + historial     Ajuste % por
  (aiService.js)                                           producto + registro
                                                           Auditoria_IA

  Demand Engine         Servicio      id_producto +        Velocidad,
  (demandEngine.js)                   id_tienda            tendencia, ROP, días
                                                           agotamiento

  Alerts Engine         Servicio      Todos los productos  Nuevas alertas
  (alertsEngine.js)                   de la tienda         persistidas en BD

  Scenario Simulator    Servicio      Días cobertura +     Lista greedy
                                      presupuesto          priorizada por ABC

  Feedback Engine       Servicio      Órdenes aprobadas +  Factor precisión
                                      ventas reales        0.2--3.0 en
                                                           Feedback_IA

  Report Service        Servicio      Parámetros de        Archivo .xlsx o .pdf
                                      reporte              descargable

  Email Service + Cron  Servicio      Alertas activas por  Correo HTML
                                      tienda               responsive a admins

  SQLite Models         Modelo        Queries SQL          CRUD de 13 tablas;
                                      preparados           integridad
                                                           referencial
  -----------------------------------------------------------------------------

**4. Patrón de Diseño --- Factory Method**

**4.1 Contexto y Justificación**

StockPilot gestiona tres tipos de productos con comportamientos
radicalmente diferentes: productos perecederos (con fecha de vencimiento
y alertas de caducidad cruzadas con velocidad de venta), productos no
perecederos (sin fecha de vencimiento, alertas por ROP y lead_time) y
productos digitales/electrodomésticos (sin deterioro físico, lead_time
reducido, sin alertas de caducidad). Cada tipo requiere lógica de
validación, generación de alertas y cálculo de velocidad de consumo
diferente.

El patrón Factory Method permite que el controlador de productos
instancie el tipo correcto de objeto producto sin conocer las clases
concretas, delegando la responsabilidad de creación a subclases. Esto
elimina estructuras condicionales extensas en el controlador
(anti-patrón), garantiza que agregar un nuevo tipo de producto (ej.
productos digitales, productos a granel) no requiera modificar el
controlador existente (principio OCP), y concentra las reglas de
validación en la clase concreta que las necesita (SRP).

  -----------------------------------------------------------------------
  **Justificación técnica: Factory Method vs. Abstract Factory**

  Abstract Factory sería apropiado si hubiera familias de objetos
  relacionados (ej. Tipo de Producto + Tipo de Orden + Tipo de Alerta,
  todos variando juntos). En StockPilot la variabilidad principal está en
  el tipo de producto individual y sus reglas de negocio asociadas, por
  lo que Factory Method es la elección más simple y directa. La extensión
  futura a Abstract Factory es trivial si se agrega una segunda dimensión
  de variación.
  -----------------------------------------------------------------------

**4.2 Diagrama de Clases del Patrón**

  -------------------------------------------------------------------------------------------------------------------------
  **Clase / Interfaz**   **Tipo**     **Atributos / Métodos Clave**                    **Responsabilidad**
  ---------------------- ------------ ------------------------------------------------ ------------------------------------
  IProducto              Interfaz     validar(): string\[\]                            Contrato que deben cumplir todos los
                                      calcularVelocidad(db,id_t): number               tipos de producto
                                      generarAlerta(ctx): Alerta\[\]                   
                                      clasificarABC(ingresos): ClaseABC                
                                      persistir(db,id_t): Producto                     

  ProductoFactory        Clase        crearProducto(datos): IProducto \[abstract\]     Define el Factory Method y la
                         abstracta    registrarProducto(datos,db,id_t): Producto       orquestación común: validar → crear
                                                                                       → persistir

  PerecederoFactory      Clase        crearProducto(datos): ProductoPerecedero         Valida que fecha_vencimiento sea
                         concreta                                                      obligatoria y no pasada; instancia
                                                                                       ProductoPerecedero

  NoPerecederoFactory    Clase        crearProducto(datos): ProductoNoPerecedero       Instancia ProductoNoPerecedero
                         concreta                                                      ignorando cualquier
                                                                                       fecha_vencimiento recibida

  DigitalFactory         Clase        crearProducto(datos): ProductoDigital            Fuerza lead_time=1; elimina
                         concreta                                                      fecha_vencimiento; instancia
                                                                                       ProductoDigital

  ProductoPerecedero     Clase        fecha_vencimiento: Date generarAlerta():         Implementa alertas cruzadas:
                         concreta     AlertaVencimiento\|AlertaStock validar():        stock×velocidad vs.
                                      string\[\]                                       fecha_vencimiento. RF-010, RF-035

  ProductoNoPerecedero   Clase        generarAlerta(): AlertaStockCritico validar():   Implementa alertas de stock crítico
                         concreta     string\[\]                                       por ROP y lead_time. RF-033, RF-034

  ProductoDigital        Clase        generarAlerta(): AlertaStockMinimo validar():    Implementa alertas simples de stock
                         concreta     string\[\]                                       mínimo sin caducidad. RF-036

  getFactory(tipo)       Función      tipo:                                            Punto de entrada único. El
                         selector     \'perecedero\'\|\'no_perecedero\'\|\'digital\' → controlador solo conoce esta
                                      ProductoFactory                                  función, no las clases concretas

  ProductosController    Cliente del  POST /productos → registrarProducto()            Llama a
                         patrón                                                        getFactory(req.body.tipo_producto)
                                                                                       sin ningún acoplamiento a las clases
                                                                                       concretas
  -------------------------------------------------------------------------------------------------------------------------

**4.3 Implementación de Referencia**

+-----------------------------------------------------------------------+
| // /factories/ProductoFactory.js --- Clase abstracta: define el       |
| contrato del Factory                                                  |
|                                                                       |
| class ProductoFactory {                                               |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Factory Method --- debe ser sobreescrito por cada subclase         |
| concreta.                                                             |
|                                                                       |
| \* \@param {Object} datos - Datos del formulario de registro          |
|                                                                       |
| \* \@returns {IProducto} - Instancia del tipo de producto             |
| correspondiente                                                       |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| crearProducto(datos) {                                                |
|                                                                       |
| throw new Error(\'crearProducto() debe implementarse en la subclase   |
| concreta\');                                                          |
|                                                                       |
| }                                                                     |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Método de orquestación: valida, crea y persiste el producto.       |
|                                                                       |
| \* Este método es idéntico para todos los tipos; solo crearProducto() |
| varía.                                                                |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| registrarProducto(datos, db, id_tienda) {                             |
|                                                                       |
| const producto = this.crearProducto(datos); // Polimorfismo: Factory  |
| Method                                                                |
|                                                                       |
| const errores = producto.validar(); // Validación específica por tipo |
|                                                                       |
| if (errores.length \> 0)                                              |
|                                                                       |
| throw new Error(\`Errores de validación: \${errores.join(\', \')}\`); |
|                                                                       |
| return producto.persistir(db, id_tienda); // Persistencia en SQLite   |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| // /factories/PerecederoFactory.js --- Clase concreta                 |
|                                                                       |
| const ProductoPerecedero = require(\'../models/ProductoPerecedero\'); |
|                                                                       |
| class PerecederoFactory extends ProductoFactory {                     |
|                                                                       |
| crearProducto(datos) {                                                |
|                                                                       |
| if (!datos.fecha_vencimiento)                                         |
|                                                                       |
| throw new Error(\'Los productos perecederos requieren                 |
| fecha_vencimiento obligatoria\');                                     |
|                                                                       |
| if (new Date(datos.fecha_vencimiento) \< new Date())                  |
|                                                                       |
| throw new Error(\'La fecha de vencimiento no puede ser anterior a     |
| hoy\');                                                               |
|                                                                       |
| return new ProductoPerecedero(datos);                                 |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| // /factories/NoPerecederoFactory.js --- Clase concreta               |
|                                                                       |
| class NoPerecederoFactory extends ProductoFactory {                   |
|                                                                       |
| crearProducto(datos) {                                                |
|                                                                       |
| return new ProductoNoPerecedero({ \...datos, fecha_vencimiento: null  |
| });                                                                   |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| // /factories/DigitalFactory.js --- Clase concreta                    |
|                                                                       |
| class DigitalFactory extends ProductoFactory {                        |
|                                                                       |
| crearProducto(datos) {                                                |
|                                                                       |
| // Los productos digitales/electrodomésticos tienen lead_time         |
| reducido y sin caducidad                                              |
|                                                                       |
| return new ProductoDigital({ \...datos, fecha_vencimiento: null,      |
| lead_time: datos.lead_time \|\| 1 });                                 |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| // /factories/index.js --- Selector del Factory correcto (punto de    |
| entrada único)                                                        |
|                                                                       |
| const PerecederoFactory = require(\'./PerecederoFactory\');           |
|                                                                       |
| const NoPerecederoFactory = require(\'./NoPerecederoFactory\');       |
|                                                                       |
| const DigitalFactory = require(\'./DigitalFactory\');                 |
|                                                                       |
| function getFactory(tipo_producto) {                                  |
|                                                                       |
| const factories = {                                                   |
|                                                                       |
| perecedero: new PerecederoFactory(),                                  |
|                                                                       |
| no_perecedero: new NoPerecederoFactory(),                             |
|                                                                       |
| digital: new DigitalFactory(),                                        |
|                                                                       |
| };                                                                    |
|                                                                       |
| const factory = factories\[tipo_producto\];                           |
|                                                                       |
| if (!factory) throw new Error(\`Tipo de producto desconocido:         |
| \"\${tipo_producto}\"\`);                                             |
|                                                                       |
| return factory;                                                       |
|                                                                       |
| }                                                                     |
|                                                                       |
| module.exports = { getFactory };                                      |
|                                                                       |
| // /controllers/productosController.js --- Cliente del patrón (sin    |
| acoplamiento a concretas)                                             |
|                                                                       |
| const { getFactory } = require(\'../factories\');                     |
|                                                                       |
| async function registrarProducto(req, res) {                          |
|                                                                       |
| try {                                                                 |
|                                                                       |
| const { tipo_producto } = req.body;                                   |
|                                                                       |
| const factory = getFactory(tipo_producto); // Desacoplado de las      |
| clases concretas                                                      |
|                                                                       |
| const producto = factory.registrarProducto(req.body, db,              |
| req.session.id_tienda);                                               |
|                                                                       |
| // Recalcular clasificación ABC para la tienda completa tras el nuevo |
| producto                                                              |
|                                                                       |
| await recalcularABC(db, req.session.id_tienda);                       |
|                                                                       |
| res.json({ success: true, producto, mensaje: \'Producto registrado    |
| correctamente\' });                                                   |
|                                                                       |
| } catch (error) {                                                     |
|                                                                       |
| res.status(400).json({ success: false, error: error.message });       |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
+-----------------------------------------------------------------------+

**5. Diseño de Datos**

**5.1 Modelo Entidad-Relación**

El Modelo Entidad-Relación (MER) de StockPilot contempla 13 entidades
principales con sus relaciones. El diagrama completo se adjunta como
imagen MER.png. La entidad Tienda actúa como raíz del árbol de datos
multi-tenant: todos los registros operativos contienen la clave foránea
id_tienda, garantizando la segregación completa entre negocios
distintos.

**Mapa de Relaciones**

  ----------------------------------------------------------------------------------
  **Entidad        **Cardinalidad**   **Entidad          **Descripción de la
  origen**                            destino**          relación**
  ---------------- ------------------ ------------------ ---------------------------
  Tienda           1 : N              Usuarios           Un negocio registra varios
                                                         usuarios (admins y
                                                         colaboradores)

  Tienda           1 : N              Productos          Un negocio gestiona
                                                         múltiples productos en su
                                                         inventario

  Tienda           1 : N              Proveedores        Un negocio trabaja con
                                                         múltiples proveedores

  Tienda           1 : N              Ordenes_Compra     Un negocio genera múltiples
                                                         órdenes de compra a
                                                         proveedores

  Tienda           1 : N              Alertas            Un negocio acumula
                                                         múltiples alertas del motor
                                                         de reglas

  Tienda           1 : N              MovimientosStock   Todos los movimientos de
                                                         inventario pertenecen a una
                                                         tienda

  Tienda           1 : N              Reportes           Los reportes documentales
                                                         pertenecen a una tienda

  Tienda           1 : N              Auditoria_IA       Los registros de auditoría
                                                         IA son por tienda

  Usuarios         1 : N              Ventas             Un usuario registra
                                                         múltiples transacciones de
                                                         venta

  Usuarios         N : 1              Tienda             Todo usuario pertenece a
                                                         exactamente una tienda

  Productos        1 : N              VentasProductos    Un producto puede aparecer
                                                         en múltiples líneas de
                                                         venta

  Productos        1 : N              Alertas            Un producto puede tener
                                                         múltiples alertas activas
                                                         simultáneas

  Productos        1 : N              MovimientosStock   Un producto tiene historial
                                                         de movimientos

  Productos        N : 1              Proveedores        Un producto tiene un
                                                         proveedor habitual asignado
                                                         (opcional)

  Ventas           1 : N              VentasProductos    Una venta puede incluir
                                                         múltiples productos
                                                         (carrito)

  Ordenes_Compra   1 : N              Ordenes_Detalle    Una orden contiene
                                                         múltiples líneas de
                                                         productos

  Ordenes_Compra   1 : N              Feedback_IA        Una orden genera registros
                                                         de retroalimentación IA

  Ordenes_Compra   1 : N              Auditoria_IA       Una orden puede tener su
                                                         consulta de IA auditada
  ----------------------------------------------------------------------------------

**5.2 Diccionario de Datos**

**Tabla: Tienda**

  ----------------------------------------------------------------------------------
  **Campo**                **Tipo SQL** **Restricción**    **Descripción**
  ------------------------ ------------ ------------------ -------------------------
  id_tienda                INTEGER      PK · AUTOINCREMENT Identificador único del
                                                           negocio (raíz
                                                           multi-tenant)

  nombre_establecimiento   TEXT         NOT NULL           Nombre comercial del
                                                           negocio

  direccion                TEXT         NULL               Dirección física del
                                                           local (opcional al
                                                           registro)

  anio_creacion            INTEGER      NULL               Año de apertura del
                                                           negocio

  estado                   TEXT         DEFAULT \'activo\' Estado de la tienda:
                                                           activo \| inactivo

  documento                TEXT         NULL               NIT o número de
                                                           identificación tributaria

  razon_social             TEXT         NULL               Razón social legal de la
                                                           empresa

  celular                  TEXT         NULL               Teléfono de contacto del
                                                           negocio

  ciudad                   TEXT         NULL               Ciudad o sede del
                                                           establecimiento
  ----------------------------------------------------------------------------------

**Tabla: Usuarios**

  -------------------------------------------------------------------------------
  **Campo**              **Tipo SQL** **Restricción**     **Descripción**
  ---------------------- ------------ ------------------- -----------------------
  id_usuario             INTEGER      PK · AUTOINCREMENT  Identificador único del
                                                          usuario

  nombres                TEXT         NOT NULL            Nombre completo del
                                                          usuario

  genero                 TEXT         NULL                Género declarado (campo
                                                          opcional)

  correo                 TEXT         NOT NULL · UNIQUE   Correo electrónico;
                                                          requerido para
                                                          notificaciones

  celular                TEXT         NULL                Número de celular de
                                                          contacto

  rol                    TEXT         NOT NULL            Rol operativo:
                                                          administrador \|
                                                          colaborador

  usuario                TEXT         NOT NULL · UNIQUE   Nombre de usuario para
                                                          login (inmutable
                                                          post-registro)

  contrasena             TEXT         NOT NULL            Hash bcrypt (10 rounds)
                                                          de la contraseña

  fecha_registro         DATETIME     DEFAULT             Fecha y hora de
                                      datetime(\'now\')   creación del usuario

  id_tienda              INTEGER      FK → Tienda · NOT   Tienda a la que
                                      NULL                pertenece el usuario

  reset_token            TEXT         NULL                Token de 6 dígitos para
                                                          recuperación de
                                                          contraseña

  reset_expires          DATETIME     NULL                Expiración del token
                                                          (15 minutos desde
                                                          emisión)

  foto_url               TEXT         NULL                Foto de perfil
                                                          codificada en Base64

  cambio_clave_forzoso   BOOLEAN      DEFAULT 0           Si = 1, el usuario debe
                                                          cambiar contraseña en
                                                          el próximo login

  session_id             TEXT         NULL                ID de la sesión activa
                                                          actual (previene
                                                          sesiones concurrentes)
  -------------------------------------------------------------------------------

**Tabla: Productos**

  -------------------------------------------------------------------------------
  **Campo**                **Tipo     **Restricción**   **Descripción**
                           SQL**                        
  ------------------------ ---------- ----------------- -------------------------
  id_producto              INTEGER    PK ·              Identificador único del
                                      AUTOINCREMENT     producto

  codigo                   TEXT       NOT NULL          Código SKU, de barras o
                                                        referencia interna

  nombre_producto          TEXT       NOT NULL          Nombre descriptivo
                                                        comercial del producto

  categoria                TEXT       NULL              Categoría principal
                                                        (bebidas, lácteos,
                                                        granos, aseo, etc.)

  subcategoria             TEXT       NULL              Subcategoría para mayor
                                                        granularidad opcional

  tipo_producto            TEXT       NULL              perecedero \|
                                                        no_perecedero \| digital
                                                        (rige el Factory)

  precio                   REAL       NULL              Precio de venta al
                                                        público por unidad

  cantidad                 INTEGER    NULL              Stock físico disponible
                                                        en este momento

  stock_minimo             INTEGER    NULL              Umbral amarillo: activa
                                                        alerta de advertencia

  stock_maximo             INTEGER    NULL              Umbral de sobrestock
                                                        máximo esperado

  stock_seguridad          INTEGER    NULL              Colchón de emergencia:
                                                        activa alerta roja
                                                        (quiebre)

  lead_time                INTEGER    NULL              Días que tarda el
                                                        proveedor habitual en
                                                        entregar

  frecuencia_compra_dias   INTEGER    NULL              Ciclo normal de
                                                        reposición en días

  costo                    REAL       NULL              Costo de adquisición
                                                        (para cálculo de ROI)

  fecha_entrada            DATETIME   NULL              Fecha de primer ingreso
                                                        al inventario

  fecha_salida             DATETIME   NULL              Fecha de vencimiento
                                                        (exclusiva de productos
                                                        perecederos)

  estado                   TEXT       DEFAULT           Estado del producto:
                                      \'activo\'        activo \| suspendido

  id_tienda                INTEGER    FK → Tienda · NOT Tienda propietaria del
                                      NULL              producto

  id_proveedor             INTEGER    FK → Proveedores  Proveedor habitual
                                      · NULL            asignado (opcional)
  -------------------------------------------------------------------------------

**Tabla: Ventas**

  -------------------------------------------------------------------------
  **Campo**       **Tipo SQL** **Restricción**    **Descripción**
  --------------- ------------ ------------------ -------------------------
  id_venta        INTEGER      PK · AUTOINCREMENT Identificador único de la
                                                  transacción de venta

  id_vendedor     INTEGER      FK → Usuarios ·    Usuario que registró la
                               NOT NULL           venta

  id_tienda       INTEGER      FK → Tienda · NOT  Tienda donde ocurrió la
                               NULL               venta

  fecha_salida    DATETIME     NOT NULL           Fecha y hora exacta de la
                                                  transacción

  precio_total    REAL         NOT NULL           Monto total de la venta
                                                  (suma de líneas)
  -------------------------------------------------------------------------

**Tabla: VentasProductos (detalle de venta)**

  ---------------------------------------------------------------------------
  **Campo**         **Tipo SQL** **Restricción**    **Descripción**
  ----------------- ------------ ------------------ -------------------------
  id                INTEGER      PK · AUTOINCREMENT Identificador único de la
                                                    línea de detalle

  id_venta          INTEGER      FK → Ventas · NOT  Encabezado de venta al
                                 NULL               que pertenece este ítem

  id_producto       INTEGER      FK → Productos ·   Producto vendido en esta
                                 NOT NULL           línea

  cantidad          INTEGER      NOT NULL           Unidades vendidas de este
                                                    producto en la
                                                    transacción

  precio_unitario   REAL         NOT NULL           Precio de venta capturado
                                                    en el momento de la venta
  ---------------------------------------------------------------------------

**Tabla: MovimientosStock**

  ---------------------------------------------------------------------------
  **Campo**          **Tipo SQL** **Restricción**   **Descripción**
  ------------------ ------------ ----------------- -------------------------
  id_movimiento      INTEGER      PK ·              Identificador único del
                                  AUTOINCREMENT     movimiento

  id_producto        INTEGER      FK → Productos ·  Producto afectado por el
                                  NOT NULL          movimiento

  tipo_movimiento    TEXT         NOT NULL          entrada \| salida \|
                                                    ajuste (por tipo
                                                    Factory-like)

  cantidad           INTEGER      NOT NULL          Unidades involucradas
                                                    (+entrada, -salida,
                                                    ±ajuste)

  fecha_movimiento   DATETIME     NOT NULL          Fecha y hora exacta del
                                                    movimiento

  observacion        TEXT         NULL              Justificación del
                                                    movimiento (venta,
                                                    proveedor, merma, etc.)

  id_usuario         INTEGER      FK → Usuarios ·   Usuario responsable del
                                  NOT NULL          movimiento (trazabilidad)

  id_tienda          INTEGER      FK → Tienda · NOT Tienda a la que pertenece
                                  NULL              el movimiento

  stock_final        INTEGER      NULL              Stock resultante tras el
                                                    movimiento (snapshot)
  ---------------------------------------------------------------------------

**Tabla: Alertas**

  ----------------------------------------------------------------------------
  **Campo**          **Tipo SQL**  **Restricción**     **Descripción**
  ------------------ ------------- ------------------- -----------------------
  id_alerta          INTEGER       PK · AUTOINCREMENT  Identificador único de
                                                       la alerta

  id_producto        INTEGER       FK → Productos ·    Producto que disparó la
                                   NOT NULL            alerta

  id_tienda          INTEGER       FK → Tienda · NOT   Tienda afectada por la
                                   NULL                alerta

  tipo               TEXT          NOT NULL            stock_critico \|
                                                       advertencia \|
                                                       sobrestock \|
                                                       vencimiento_critico \|
                                                       vencimiento_adv

  severidad          TEXT          NOT NULL            critica \| advertencia
                                                       \| sobrestock (semáforo
                                                       visual)

  mensaje            TEXT          NOT NULL            Descripción legible:
                                                       \'Stock agónico: quedan
                                                       N días de inventario,
                                                       proveedor tarda M
                                                       días\'

  datos_json         JSON          NULL                Contexto calculado:
                                                       {dias_restantes,
                                                       velocidad, rop,
                                                       dias_venc,
                                                       unidades_invendibles}

  resuelta           BOOLEAN       DEFAULT 0           0 = activa; 1 = marcada
                                                       como resuelta por el
                                                       usuario

  fecha_creacion     DATETIME      DEFAULT             Cuando fue generada por
                                   datetime(\'now\')   el motor de alertas

  fecha_resolucion   DATETIME      NULL                Cuando el usuario la
                                                       marcó como resuelta
  ----------------------------------------------------------------------------

**Tabla: Ordenes_Compra**

  -----------------------------------------------------------------------------
  **Campo**           **Tipo SQL**  **Restricción**     **Descripción**
  ------------------- ------------- ------------------- -----------------------
  id_orden            INTEGER       PK · AUTOINCREMENT  Identificador único de
                                                        la orden de compra

  id_tienda           INTEGER       FK → Tienda · NOT   Tienda que emite la
                                    NULL                orden

  id_proveedor        INTEGER       FK → Proveedores ·  Proveedor destinatario
                                    NOT NULL            de la orden

  id_usuario          INTEGER       FK → Usuarios · NOT Administrador que
                                    NULL                aprobó o rechazó la
                                                        orden

  estado              TEXT          NOT NULL            pendiente \| aprobada
                                                        \| rechazada \|
                                                        borrador

  riesgo              TEXT          NULL                Bajo \| Medio \| Alto
                                                        (evaluación del motor
                                                        IA)

  presupuesto_total   REAL          NULL                Costo total calculado
                                                        de la orden

  notas               TEXT          NULL                Observaciones
                                                        adicionales del
                                                        administrador

  fecha_creacion      DATETIME      DEFAULT             Fecha de creación de la
                                    datetime(\'now\')   orden

  fecha_aprobacion    DATETIME      NULL                Fecha en que el
                                                        administrador aprobó o
                                                        rechazó
  -----------------------------------------------------------------------------

**Tabla: Ordenes_Detalle**

  ------------------------------------------------------------------------
  **Campo**        **Tipo SQL**  **Restricción**   **Descripción**
  ---------------- ------------- ----------------- -----------------------
  id_detalle       INTEGER       PK ·              Identificador único de
                                 AUTOINCREMENT     la línea de detalle de
                                                   la orden

  id_orden         INTEGER       FK →              Orden a la que
                                 Ordenes_Compra ·  pertenece este ítem
                                 NOT NULL          

  id_producto      INTEGER       FK → Productos ·  Producto a pedir en
                                 NOT NULL          esta línea

  cantidad_base    INTEGER       NOT NULL          Cantidad calculada por
                                                   el algoritmo matemático
                                                   (sin IA)

  sugerencia_ia    INTEGER       NULL              Cantidad sugerida por
                                                   el copiloto IA
                                                   (post-guardrails)

  cantidad_final   INTEGER       NOT NULL          Cantidad definitiva
                                                   confirmada por el
                                                   administrador

  costo_unitario   REAL          NULL              Costo unitario del
                                                   producto para calcular
                                                   presupuesto
  ------------------------------------------------------------------------

**Tabla: Feedback_IA**

  -------------------------------------------------------------------------------
  **Campo**               **Tipo SQL**  **Restricción**   **Descripción**
  ----------------------- ------------- ----------------- -----------------------
  id_feedback             INTEGER       PK ·              Identificador único del
                                        AUTOINCREMENT     registro de
                                                          retroalimentación

  id_orden                INTEGER       FK →              Orden que se evaluó
                                        Ordenes_Compra ·  contra las ventas
                                        NOT NULL          reales

  id_producto             INTEGER       FK → Productos ·  Producto evaluado
                                        NOT NULL          

  cantidad_sugerida       INTEGER       NOT NULL          Cantidad que la IA
                                                          sugirió para este
                                                          producto en la orden

  ventas_reales_periodo   INTEGER       NOT NULL          Ventas reales desde la
                                                          aprobación de la orden
                                                          hasta la evaluación

  factor_precision        REAL          NOT NULL          ventas_reales /
                                                          cantidad_sugerida ·
                                                          acotado en \[0.2, 3.0\]

  fecha_evaluacion        DATETIME      NOT NULL          Fecha en que se calculó
                                                          el factor de precisión
  -------------------------------------------------------------------------------

**Tabla: Auditoria_IA**

  ------------------------------------------------------------------------------
  **Campo**            **Tipo     **Restricción**   **Descripción**
                       SQL**                        
  -------------------- ---------- ----------------- ----------------------------
  id_auditoria         INTEGER    PK ·              Identificador único del
                                  AUTOINCREMENT     registro de auditoría

  fecha_auditoria      DATETIME   NOT NULL          Marca de tiempo exacta de la
                                                    consulta al modelo IA

  id_tienda            INTEGER    FK → Tienda · NOT Tienda que originó la
                                  NULL              consulta

  id_orden             INTEGER    FK →              Orden asociada si aplica
                                  Ordenes_Compra ·  (NULL para consultas del
                                  NULL              dashboard)

  motor_ia             TEXT       NOT NULL          Motor usado: \'dashboard\'
                                                    \|
                                                    \'copiloto_suministrador\'

  prompt_utilizado     TEXT       NOT NULL          Prompt íntegro enviado al
                                                    modelo (trazabilidad
                                                    completa)

  datos_base_json      JSON       NULL              Snapshot de los datos de
                                                    entrada al modelo en JSON

  sugerencia_ia_json   JSON       NULL              Respuesta completa del
                                                    modelo en JSON estructurado

  impacto_decision     TEXT       NULL              \'múltiple\' (varios
                                                    productos) \| \'individual\'

  razon_ia             TEXT       NULL              Razonamiento en lenguaje
                                                    natural del modelo (campo
                                                    reason)
  ------------------------------------------------------------------------------

**Tabla: Proveedores**

  -------------------------------------------------------------------------------
  **Campo**            **Tipo SQL** **Restricción**     **Descripción**
  -------------------- ------------ ------------------- -------------------------
  id_proveedor         INTEGER      PK · AUTOINCREMENT  Identificador único del
                                                        proveedor

  id_tienda            INTEGER      FK → Tienda · NOT   Tienda propietaria de
                                    NULL                este proveedor

  nombre_empresa       TEXT         NOT NULL            Nombre comercial del
                                                        proveedor

  contacto_principal   TEXT         NULL                Nombre del representante
                                                        de ventas

  email                TEXT         NULL                Correo de contacto para
                                                        órdenes

  telefono             TEXT         NULL                Teléfono de contacto

  direccion            TEXT         NULL                Dirección del proveedor

  calificacion         INTEGER      NULL                Calificación interna del
                                                        proveedor (1-5)

  estado               TEXT         DEFAULT \'activo\'  Estado del proveedor:
                                                        activo \| inactivo

  fecha_registro       DATETIME     DEFAULT             Fecha de registro del
                                    datetime(\'now\')   proveedor
  -------------------------------------------------------------------------------

**Tabla: Reportes**

  --------------------------------------------------------------------------
  **Campo**       **Tipo SQL** **Restricción**     **Descripción**
  --------------- ------------ ------------------- -------------------------
  id              INTEGER      PK · AUTOINCREMENT  Identificador único del
                                                   reporte documental

  titulo          TEXT         NOT NULL            Título descriptivo del
                                                   reporte

  descripcion     TEXT         NULL                Comentario del motivo o
                                                   alcance del reporte

  fecha_reporte   DATETIME     NOT NULL            Fecha de emisión
                                                   declarada por el usuario

  creador         INTEGER      FK → Usuarios · NOT Usuario administrador que
                               NULL                generó el reporte

  tipo            TEXT         NULL                Inventario \| Ventas \|
                                                   Financiero \| Operativo

  id_tienda       INTEGER      FK → Tienda · NULL  Tienda a la que pertenece
                                                   el reporte

  fecha_inicio    DATETIME     NULL                Inicio del rango de datos
                                                   evaluado en el reporte

  fecha_fin       DATETIME     NULL                Fin del rango de datos
                                                   evaluado

  creado_en       DATETIME     DEFAULT             Fecha real de creación
                               datetime(\'now\')   del registro
  --------------------------------------------------------------------------

**6. Diseño de la Analítica Avanzada**

**6.1 Pipeline de Datos ETL**

El pipeline de analítica de StockPilot transforma datos brutos de ventas
e inventario en inteligencia de negocio accionable. Se estructura en
tres etapas clásicas: Extracción (fuentes de datos), Transformación
(cálculos y modelos) y Carga/Enriquecimiento con IA (presentación al
usuario).

**Etapa 1 --- Extracción (Extract)**

Los datos se extraen en tiempo real desde SQLite mediante consultas
preparadas (prepared statements) optimizadas con índices sobre id_tienda
y fecha_salida. Las fuentes son:

- VentasProductos ⋈ Ventas: historial de unidades vendidas por producto
  en ventanas de 7, 30 y 90 días, filtrado por id_tienda.

- Productos: stock_actual, stock_minimo, stock_seguridad, lead_time,
  frecuencia_compra_dias, fecha_salida (vencimiento), id_proveedor.

- MovimientosStock: historial de entradas, salidas y ajustes para
  detección de outliers.

- Ordenes_Detalle ⋈ Feedback_IA: historial de sugerencias anteriores y
  ventas reales para el bucle de retroalimentación adaptativa.

**Etapa 2 --- Transformación (Transform) --- Motor de Predicción**

**[2.1 Cálculo de Velocidad de Venta Ponderada]{.underline}**

La velocidad v representa el número de unidades vendidas por día. Se
calcula usando promedios móviles ponderados sobre tres ventanas
temporales. La ponderación decreciente prioriza el comportamiento
reciente (captura estacionalidades y cambios de demanda):

+-----------------------------------------------------------------------+
| **Fórmula de Velocidad Ponderada**                                    |
+-----------------------------------------------------------------------+
| v = (Σunidades_7d / 7) × 0.50 + (Σunidades_30d / 30) × 0.35 +         |
| (Σunidades_90d / 90) × 0.15                                           |
|                                                                       |
| Si el producto lleva menos de 7 días registrado, se usan solo los     |
| datos disponibles y el nivel de confianza baja proporcionalmente.     |
|                                                                       |
| Nivel de confianza según ventanas con datos:                          |
|                                                                       |
| • Las 3 ventanas con datos → confianza = 95%                          |
|                                                                       |
| • Solo 2 ventanas con datos → confianza = 75%                         |
|                                                                       |
| • Solo 1 ventana con datos → confianza = 55%                          |
|                                                                       |
| • Sin datos históricos → confianza = 30% (producto nuevo)             |
+-----------------------------------------------------------------------+

**[2.2 Detección de Tendencia]{.underline}**

Se compara la velocidad de 7 días contra la de 30 días para clasificar
la tendencia del producto en el período reciente:

- ↑ Alcista: v_7d \> v_30d × 1.10 --- demanda creciendo más del 10%
  respecto al promedio mensual.

- ↓ Bajista: v_7d \< v_30d × 0.90 --- demanda decreciendo más del 10%
  respecto al promedio mensual.

- → Estable: diferencia dentro del ±10% --- demanda sin cambios
  significativos.

**[2.3 Clasificación ABC Dinámica (Regla de Pareto)]{.underline}**

Cada producto recibe una clasificación según su contribución a los
ingresos proyectados a 30 días (v × precio_venta × 30), ordenando de
mayor a menor y calculando el porcentaje acumulado:

- Clase A: productos que acumulan hasta el 80% del ingreso proyectado
  total → prioridad máxima; guardrail IA ±100%.

- Clase B: productos que acumulan del 80% al 95% → prioridad media;
  guardrail IA ±50%.

- Clase C: productos que acumulan del 95% al 100% → baja prioridad;
  guardrail IA ±20%.

**[2.4 Punto de Reorden (ROP)]{.underline}**

+-----------------------------------------------------------------------+
| **Fórmula del Punto de Reorden**                                      |
+-----------------------------------------------------------------------+
| ROP = (velocidad_promedio × lead_time) + stock_seguridad              |
|                                                                       |
| Interpretación:                                                       |
|                                                                       |
| • Si stock_actual ≤ ROP → el sistema genera alerta de Advertencia     |
| (amarilla).                                                           |
|                                                                       |
| • Si días_restantes \< lead_time → el sistema genera alerta Crítica   |
| (roja): el proveedor no llegaría a tiempo.                            |
|                                                                       |
| • Si días_restantes ≥ lead_time + frecuencia_compra → el producto     |
| está en estado Óptimo (verde).                                        |
+-----------------------------------------------------------------------+

**[2.5 Proyección de Agotamiento]{.underline}**

días_hasta_agotamiento = stock_actual / velocidad. Este valor se cruza
con lead_time para determinar el estado del producto. Adicionalmente,
para productos perecederos se cruza con la fecha de vencimiento para
calcular unidades estimadas invendibles = MAX(0, stock_actual -
(velocidad × días_hasta_vencimiento)).

**[2.6 Fórmula de Cantidad Sugerida (Base Matemática)]{.underline}**

+-----------------------------------------------------------------------+
| **Fórmula de Cantidad a Pedir**                                       |
+-----------------------------------------------------------------------+
| cantidad_base = MAX(0, (velocidad × (lead_time +                      |
| frecuencia_compra_dias)) − stock_actual + stock_seguridad)            |
|                                                                       |
| Esta fórmula garantiza que el pedido cubra el lead_time del proveedor |
| más un ciclo completo de reposición, manteniendo el stock de          |
| seguridad como colchón de emergencia.                                 |
|                                                                       |
| Simulador de escenarios (RF-052):                                     |
|                                                                       |
| comprar = MAX(0, (velocidad × dias_cobertura_deseada) − stock_actual) |
|                                                                       |
| Si la suma excede el presupuesto, el algoritmo greedy prioriza Clase  |
| A y recorta desde Clase C.                                            |
+-----------------------------------------------------------------------+

**[2.7 Motor de Alertas --- Cinco Reglas]{.underline}**

El motor ejecuta las siguientes reglas secuencialmente para cada
producto (CU-04.2):

1.  R1 --- Alerta Crítica de Stock: ¿días_hasta_agotamiento \<
    lead_time? → La mercancía se agotará antes de que llegue el
    proveedor.

2.  R2 --- Alerta de Advertencia: ¿lead_time ≤ días_hasta_agotamiento \<
    lead_time + frecuencia_compra_dias? → Ventana ideal de reposición
    abierta.

3.  R3 --- Vencimiento Crítico: ¿días_hasta_vencimiento ≤ 7 Y
    unidades_invendibles \> 0? → Pérdida inminente por caducidad.

4.  R4 --- Vencimiento Advertencia: ¿7 \< días_hasta_vencimiento ≤ 30 Y
    unidades_invendibles \> 0? → Riesgo de merma planificable.

5.  R5 --- Sobrestock: ¿stock_actual \> stock_maximo Y clase ABC = C Y
    días_hasta_agotamiento \> 60? → Capital estancado en producto de
    baja rotación.

**Etapa 3 --- Enriquecimiento con IA (Load + AI Enrichment)**

6.  El servicio aiService.js construye un prompt estructurado con los
    resultados de la etapa 2 para los 4-5 productos más relevantes.

7.  El modelo GPT-4o-mini responde con un ajuste porcentual por producto
    (campo ajuste_porcentaje) más una razón en lenguaje natural.

8.  Se aplican guardrails por clase ABC: Clase A ±100%, Clase B ±50%,
    Clase C ±20%.

9.  Se multiplica por el factor_precision histórico de Feedback_IA
    (limitado entre 0.2 y 3.0).

10. Los resultados y el prompt completo se persisten en Auditoria_IA
    para trazabilidad (RF-026, RNF-015).

11. El sistema devuelve: producto, tendencia, ajuste_sugerido,
    cantidad_final, confianza (≥90% = verde; \<90% = amarillo).

**6.2 Modelos Analíticos Implementados**

  ---------------------------------------------------------------------------------------------
  **Modelo**      **Tipo**          **Datos de          **Salida**       **Servicio**
                                    Entrada**                            
  --------------- ----------------- ------------------- ---------------- ----------------------
  Velocidad de    Promedio Móvil    Historial ventas    Unidades/día +   demandEngine.js
  Venta Ponderada Ponderado (3      7/30/90 días por    nivel de         
                  ventanas)         producto            confianza        

  Detección de    Comparación de    v_7d vs. v_30d      Alcista /        demandEngine.js
  Tendencia       ratios temporales                     Bajista /        
                                                        Estable          

  Clasificación   Regla de Pareto + Velocidad × precio  Clase A / B / C  demandEngine.js
  ABC Dinámica    ingresos          × 30d por producto  por producto     
                  proyectados                                            

  Proyección de   Modelo lineal     Stock actual +      Fecha estimada   demandEngine.js
  Agotamiento     (stock /          velocidad ponderada de agotamiento + 
                  velocidad)                            estado           

  Punto de        Fórmula EOQ       Velocidad +         Umbral de        demandEngine.js
  Reorden (ROP)   simplificada      lead_time +         reposición       
                                    stock_seguridad     óptimo           

  Proyección      Modelo lineal     Stock + velocidad + Unidades         demandEngine.js
  Merma por       cruzado           fecha_vencimiento   estimadas        
  Vencimiento                                           invendibles +    
                                                        pérdida COP      

  Nivel de        KPI de inventario \% productos con    \%               dashboardService.js
  Servicio                          stock \> ROP        disponibilidad   
                                                        sobre umbral     
                                                        óptimo           

  Copiloto IA     LLM               KPIs calculados +   \% de ajuste por aiService.js
  (ajuste %)      (GPT-4o-mini) +   historial + factor  producto + razón 
                  guardrails ABC    precisión           natural          

  Feedback        Factor de         Sugerido vs. real   Factor precisión feedbackEngine.js
  Adaptativo      corrección        vendido en período  \[0.2--3.0\]     
                  multiplicativa    adaptativo          aplicado a       
                                                        futuras          
                                                        sugerencias      

  Simulador de    Algoritmo Greedy  Días cobertura      Lista de compra  scenarioSimulator.js
  Escenarios      priorizado por    deseada +           optimizada       
                  ABC               presupuesto máximo  respetando       
                                                        presupuesto      

  Auditoría IA    Log               Prompt +            Trazabilidad     aiService.js +
                  estructurado +    respuesta + datos   completa de cada Auditoria_IA
                  snapshot          entrada             decisión del     
                                                        modelo           
  ---------------------------------------------------------------------------------------------

**6.3 Calidad de Datos --- Anti Garbage-In/Garbage-Out**

Para garantizar que el motor analítico opere sobre datos confiables:

- Validación en origen: todos los formularios validan tipos, rangos y
  campos obligatorios antes de persistir (RNF-010). El sistema rechaza
  salidas que excedan el stock disponible con mensaje descriptivo.

- Ventana temporal adaptativa: si un producto tiene menos de 7 días de
  historial, el nivel de confianza del modelo se reduce automáticamente
  (≤55%), alertando al administrador.

- Guardrails de IA: ajustes limitados a ±100%/±50%/±20% por clase ABC,
  impidiendo sugerencias extremas del LLM (RNF-007).

- Factor de precisión acotado: el multiplicador de feedback está
  restringido al rango \[0.2, 3.0\], evitando efectos compounding
  descontrolados entre ciclos de evaluación (RF-056).

- Caché con hash MD5: sin re-consultar la IA cuando los datos de entrada
  no han cambiado (RNF-003). Consistencia de respuestas garantizada.

- Sesiones concurrentes bloqueadas: session_id en tabla Usuarios
  invalida la sesión más antigua automáticamente al detectar un nuevo
  login (RF-061, RNF-016).

**7. Diseño de Interfaz --- UI/UX**

**7.1 Principios de Diseño Aplicados**

- Semáforo de información: rojo (crítico), naranja (precaución),
  amarillo (advertencia) y verde (óptimo) se usan de manera consistente
  en alertas, clasificación ABC y estado del stock en toda la
  aplicación.

- Progressive Disclosure: el Dashboard muestra KPIs de alto nivel; el
  usuario profundiza con \'Ver análisis detallado\' para obtener
  información granular (velocidad, ingresos 30d, proyección de
  agotamiento).

- Feedback inmediato: toasts de éxito/error en ≤500ms tras cada acción
  (RNF-009). Indicadores de carga durante llamadas a la IA.

- Responsive design: adaptado desde 375px (móvil tendero) hasta 1920px
  (escritorio oficina). Botones de toque mínimo 44px (RNF-008).

- Lenguaje del negocio: el sistema usa terminología del tendero
  (\'inyectar stock\', \'velocidad de venta\', \'quiebre de stock\') no
  jerga técnica.

- Usabilidad para nivel digital básico: flujos en máximo 3 clics para
  operaciones frecuentes (registrar venta, ver alertas, marcar
  resuelta).

**7.2 Catálogo de Módulos de Interfaz**

  ---------------------------------------------------------------------------------
  **Módulo / Vista**    **Rol con acceso**        **Elementos y KPIs principales**
  --------------------- ------------------------- ---------------------------------
  Landing Page          Público                   Hero con propuesta de valor,
                                                  sección de beneficios (velocidad,
                                                  precisión, rentabilidad), planes
                                                  de uso, CTA a registro/login

  Formulario de         Público (Admin maestro)   Datos personales (nombre,
  Registro                                        usuario, celular, correo) + datos
                                                  del negocio (nombre tienda,
                                                  dirección opcional) + contraseña
                                                  con validación

  Login                 Público                   Campo usuario/correo, campo
                                                  contraseña, selector de rol,
                                                  enlace a recuperación de
                                                  contraseña, enlace a registro

  Dashboard Principal   Admin + Colaborador       4 tarjetas KPI (total artículos,
                                                  valor inventario, alertas
                                                  activas, ventas acumuladas),
                                                  Asistente Estratégico IA con top
                                                  4 críticos, semáforo MEBI,
                                                  gráfico de caja 7d, ROI
                                                  proyectado con indicador de salud

  Centro Analítico      Admin + Colaborador       Tabla clasificación ABC con
  (Análisis Detallado)                            semáforo de riesgo
                                                  (Alto/Medio/Bajo), velocidad de
                                                  venta, proyección de agotamiento,
                                                  ingresos proyectados 30d,
                                                  fórmulas de cálculo en card
                                                  informativa

  Centro de Alertas     Admin + Colaborador       Contadores por categoría
                                                  (Críticas, Advertencias,
                                                  Sobrestock), filtros por
                                                  severidad, tarjetas de alerta con
                                                  mensaje descriptivo, botón
                                                  \'Forzar Recálculo\', botón
                                                  \'Marcar Resuelta\'

  Historial de Ventas   Admin + Colaborador       Tarjetas KPI (volumen ingresos,
                                                  unidades evacuadas, ticket
                                                  promedio, stock movilizado),
                                                  modal Top 10 ventas, tabla con
                                                  paginación, filtros por
                                                  producto/categoría/fecha, botón
                                                  Exportar XLSX

  Movimientos de        Admin + Colaborador       Contadores (ingresos registrados,
  Inventario                                      salidas procesadas, ajustes
                                                  auditados), tabla filtrable por
                                                  tipo/fecha/producto, formulario
                                                  de registro de movimiento con
                                                  validación de stock suficiente

  Ver Productos         Admin (CRUD) / Collab     Banner de alerta crítica, tabla
                        (venta + stock)           con semáforo de stock
                                                  (quiebre/reponer/óptimo),
                                                  filtros, formulario de registro
                                                  con configuración de
                                                  reabastecimiento (stock_min,
                                                  stock_seg, lead_time), acciones
                                                  por rol

  Gestión de            Solo Admin                Lista de proveedores con conteo
  Proveedores                                     de productos vinculados, tabla de
                                                  análisis de demanda (fase
                                                  matemática), botón Consultar
                                                  Copiloto IA, carrito de orden con
                                                  ajuste editable, evaluación de
                                                  riesgo, historial de órdenes
                                                  expandible

  Reportes y            Admin                     Tabla de reportes por tipo,
  Exportación           (crear/editar/eliminar) / formulario de creación, botón
                        Collab (ver/descargar)    exportar XLSX por reporte, panel
                                                  de Auditoría IA filtrable por
                                                  motor, botón Descargar PDF de
                                                  auditoría de merma, botón Enviar
                                                  Resumen Manual

  Simulador de          Solo Admin                Slider días de cobertura (7-90),
  Escenarios                                      campo presupuesto máximo, tabla
                                                  recalculable en tiempo real con
                                                  checkboxes, KPIs de simulación
                                                  (costo total, ítems
                                                  incluidos/excluidos, %
                                                  presupuesto usado), botón
                                                  Convertir en Orden Real

  Dashboard Aprendizaje Solo Admin                \% precisión global, gráfico
  IA                                              evolución mensual, tabla por
                                                  producto con barras de precisión
                                                  y veredicto (acertado/sugirió
                                                  más/sugirió menos), selector de
                                                  orden a evaluar, botón Comparar

  Ver Tienda            Admin + Collab (solo ver) Info del negocio (nombre, razón
                                                  social, dirección, contacto,
                                                  estado), lista de personal
                                                  registrado, opciones de editar
                                                  perfil e inactivar tienda (solo
                                                  admin)

  Registro de           Solo Admin                Lista de colaboradores
  Colaboradores                                   registrados, formulario
                                                  crear/editar (nombre, género,
                                                  correo, celular, usuario,
                                                  contraseña temporal), opciones
                                                  editar/eliminar

  Perfil de Usuario     Admin + Colaborador       Datos personales editables
                                                  (excepto usuario), upload de foto
                                                  de perfil en Base64, cambio de
                                                  contraseña (con validación de
                                                  complejidad: mayúscula, número,
                                                  máx 15 caracteres)
  ---------------------------------------------------------------------------------

  -----------------------------------------------------------------------
                               **PARTE II**

           **Sección de Desarrollo: Implementación y Agilidad**
  -----------------------------------------------------------------------

**8. Metodología de Desarrollo --- Scrum**

**8.1 Justificación de la Metodología**

Para el desarrollo de StockPilot se adoptó Scrum, marco de trabajo ágil
que permite gestionar proyectos complejos mediante iteraciones cortas y
centradas en la entrega de valor incremental. Scrum se eligió porque:
(a) el equipo consta de dos personas con roles duales; (b) los
requerimientos evolucionaron durante el desarrollo a medida que se
obtuvo retroalimentación de la docente asesora; (c) el sistema integra
componentes de alta complejidad técnica (motor IA, pipeline analítico)
que requieren validación incremental.

**8.2 Equipo Scrum y Roles**

  ------------------------------------------------------------------------
  **Rol Scrum**       **Persona**           **Responsabilidades
                                            Específicas en el Proyecto**
  ------------------- --------------------- ------------------------------
  Product Owner +     Luis Alberto Diuche   Definición y priorización del
  Desarrollador       Peña                  product backlog · Desarrollo
  Backend                                   del servidor Node.js/Express ·
                                            Motor de predicción de demanda
                                            · Integración API OpenAI ·
                                            Base de datos SQLite · Motor
                                            de alertas · Sistema de caché
                                            MD5 · Cron job de correos

  Scrum Master +      Elizabeth Pérez       Coordinación del proceso Scrum
  Desarrolladora      González              · Desarrollo de módulos de
  Full-Stack                                ventas, movimientos, reportes
                                            · Diagramas UML ·
                                            Documentación técnica ·
                                            Pruebas QA · Diseño de casos
                                            de uso · Maquetación EJS y CSS

  Stakeholder /       Angie Lorena Aldana   Revisión de entregables en
  Docente asesora     Padilla               Sprint Reviews ·
                                            Retroalimentación sobre
                                            requerimientos y arquitectura
                                            · Asesoría sobre metodología y
                                            estructura de documentación
  ------------------------------------------------------------------------

**8.3 Product Backlog Completo --- Historias de Usuario Priorizadas**

El Product Backlog usa la técnica MoSCoW para priorizar: Must Have
(imprescindible), Should Have (importante), Could Have (deseable),
Won\'t Have (fuera del alcance).

  ----------------------------------------------------------------------------------------
  **ID**   **Historia de Usuario**           **Épica**        **Prioridad**   **Estado**
  -------- --------------------------------- ---------------- --------------- ------------
  HU-001   Como administrador, quiero        Autenticación    Must Have       Done ✅
           registrar mi negocio y crear mi                                    
           cuenta de administrador maestro                                    
           para comenzar a gestionar mi                                       
           inventario.                                                        

  HU-002   Como admin/colaborador, quiero    Autenticación    Must Have       Done ✅
           iniciar sesión con mi usuario y                                    
           contraseña para acceder al                                         
           sistema con el rol que me                                          
           corresponde.                                                       

  HU-003   Como usuario registrado, quiero   Autenticación    Must Have       Done ✅
           recuperar mi contraseña mediante                                   
           un código de 6 dígitos enviado a                                   
           mi correo para no perder acceso.                                   

  HU-004   Como administrador, quiero        Productos        Must Have       Done ✅
           registrar productos con su                                         
           configuración de alertas                                           
           (stock_min, stock_seg, lead_time)                                  
           para que el sistema me avise                                       
           cuando estén bajos.                                                

  HU-005   Como admin/colaborador, quiero    Ventas           Must Have       Done ✅
           registrar ventas seleccionando                                     
           productos y cantidades para que                                    
           el stock se descuente                                              
           automáticamente.                                                   

  HU-006   Como admin/colaborador, quiero    Dashboard        Must Have       Done ✅
           ver el Dashboard con KPIs en                                       
           tiempo real para conocer el                                        
           estado de mi negocio de un                                         
           vistazo.                                                           

  HU-007   Como admin, quiero recibir        Alertas          Must Have       Done ✅
           alertas automáticas de stock                                       
           crítico para no quedarme sin                                       
           productos importantes antes de                                     
           poder reabastecerme.                                               

  HU-008   Como admin, quiero que el sistema Motor IA         Must Have       Done ✅
           me prediga cuánto pedir de cada                                    
           producto usando la velocidad de                                    
           venta histórica para no comprar                                    
           ni de más ni de menos.                                             

  HU-009   Como admin, quiero ver la         Analítica        Should Have     Done ✅
           clasificación ABC de mis                                           
           productos para concentrar mi                                       
           atención y capital en los que más                                  
           generan ingresos.                                                  

  HU-010   Como admin, quiero generar        Proveedores      Should Have     Done ✅
           órdenes de compra inteligentes                                     
           por proveedor, con apoyo del                                       
           copiloto IA, para que las                                          
           cantidades sean más precisas.                                      

  HU-011   Como admin, quiero exportar       Reportes         Should Have     Done ✅
           reportes en formato Excel para                                     
           analizar el historial en mis                                       
           propias herramientas externas.                                     

  HU-012   Como admin, quiero ver el         Auditoría IA     Should Have     Done ✅
           registro completo de auditoría de                                  
           las decisiones de la IA para                                       
           entender y validar sus                                             
           recomendaciones.                                                   

  HU-013   Como admin, quiero simular        Simulador        Could Have      Done ✅
           escenarios de compra ajustando                                     
           días de cobertura y presupuesto                                    
           para planificar mis compras con                                    
           restricciones reales.                                              

  HU-014   Como admin, quiero que la IA      Feedback IA      Could Have      Done ✅
           mejore sus predicciones                                            
           progresivamente con el tiempo,                                     
           aprendiendo de las diferencias                                     
           entre lo sugerido y lo vendido                                     
           realmente.                                                         

  HU-015   Como admin, quiero recibir un     Notificaciones   Could Have      Done ✅
           correo semanal con el resumen de                                   
           alertas críticas de mi tienda                                      
           para estar informado incluso sin                                   
           abrir la aplicación.                                               

  HU-016   Como colaborador, quiero tener    Roles            Must Have       Done ✅
           una vista simplificada sin acceso                                  
           a funciones administrativas                                        
           (proveedores, órdenes, auditoría,                                  
           gestión de colaboradores).                                         

  HU-017   Como admin, quiero registrar y    Colaboradores    Must Have       Done ✅
           gestionar a mis colaboradores                                      
           (tenderos) asignándoles                                            
           credenciales temporales con                                        
           cambio forzoso en primer login.                                    

  HU-018   Como admin, quiero descargar un   Reportes         Should Have     Done ✅
           PDF de auditoría de merma con                                      
           todos los productos vencidos y la                                  
           pérdida financiera calculada en                                    
           COP.                                                               

  HU-019   Como admin, quiero ver el         Feedback IA      Could Have      Done ✅
           dashboard de aprendizaje IA con                                    
           la evolución mensual de la                                         
           precisión del modelo para evaluar                                  
           su desempeño.                                                      

  HU-020   Como admin, quiero poder enviar   Notificaciones   Could Have      Done ✅
           manualmente el resumen de alertas                                  
           en cualquier momento sin esperar                                   
           al lunes.                                                          
  ----------------------------------------------------------------------------------------

**8.4 Sprint Planning --- Resumen de los 5 Sprints**

**Sprint 1 --- Fundamentos e Infraestructura (Semanas 1-2)**

  -----------------------------------------------------------------------
  **Objetivo del Sprint**

  Establecer la infraestructura técnica del proyecto y los módulos de
  autenticación y gestión básica. Al finalizar, debe ser posible:
  registrarse como administrador, crear una tienda, iniciar sesión y
  registrar productos simples.
  -----------------------------------------------------------------------

  ---------------------------------------------------------------------
  **Tarea**                            **Responsable**   **Estado**
  ------------------------------------ ----------------- --------------
  Configuración del proyecto Node.js + Luis              Done ✅
  Express + SQLite + EJS                                 

  Diseño e implementación del modelo   Luis              Done ✅
  de datos inicial (Tienda, Usuarios,                    
  Productos)                                             

  Módulo de login con bcrypt,          Luis              Done ✅
  express-session y anti-concurrencia                    
  (session_id)                                           

  Formulario de registro (admin        Luis/Elizabeth    Done ✅
  maestro + tienda asociada)                             

  Recuperación de contraseña con       Luis              Done ✅
  código de 6 dígitos por correo                         
  (nodemailer)                                           

  Middleware requireLogin y            Elizabeth         Done ✅
  requireAdmin                                           

  CRUD básico de productos con         Elizabeth         Done ✅
  configuración de reabastecimiento                      

  Diseño y maquetación de la Landing   Elizabeth         Done ✅
  Page con planes                                        

  Control de roles diferenciado Admin  Elizabeth         Done ✅
  / Colaborador                                          

  Sistema de Factory Method para tipos Luis              Done ✅
  de producto                                            
  (perecedero/no_perecedero/digital)                     
  ---------------------------------------------------------------------

**[Retrospectiva Sprint 1]{.underline}**

- ✅ Bien: La configuración del entorno fue rápida gracias a SQLite
  embebido (sin servidor externo). La separación de rutas desde el
  inicio permitió trabajo paralelo.

- ⚠️ Mejorar: La gestión de sesiones concurrentes (RF-061) requirió más
  tiempo del estimado por los edge cases de invalidación. La
  documentación de decisiones de diseño de BD inició tarde.

**Sprint 2 --- Operaciones Comerciales (Semanas 3-4)**

  -----------------------------------------------------------------------
  **Objetivo del Sprint**

  Implementar los módulos de ventas, movimientos de inventario y gestión
  de proveedores. El sistema debe registrar transacciones, mantener el
  stock sincronizado en tiempo real y gestionar la base de proveedores.
  -----------------------------------------------------------------------

  -------------------------------------------------------------------
  **Tarea**                          **Responsable**   **Estado**
  ---------------------------------- ----------------- --------------
  Módulo de ventas: registro,        Elizabeth         Done ✅
  descuento automático de stock,                       
  validación de stock suficiente                       

  Historial de ventas con filtros    Elizabeth         Done ✅
  por fecha/categoría/producto y                       
  paginación lazy                                      

  Top 10 ventas en modal con ranking Elizabeth         Done ✅
  por unidades e ingresos                              

  Exportación del historial de       Elizabeth         Done ✅
  ventas a XLSX con exceljs                            

  Módulo de movimientos: entradas,   Elizabeth         Done ✅
  salidas manuales, ajustes con                        
  trazabilidad                                         

  Validación: salida no puede        Luis              Done ✅
  exceder stock disponible (error                      
  descriptivo)                                         

  CRUD de proveedores con            Luis              Done ✅
  vinculación a productos                              

  Tickets KPI de ventas: volumen     Elizabeth         Done ✅
  ingresos, ticket promedio, stock                     
  movilizado                                           

  Métricas de movimientos:           Elizabeth         Done ✅
  contadores                                           
  ingresos/salidas/ajustes                             
  -------------------------------------------------------------------

**[Retrospectiva Sprint 2]{.underline}**

- ✅ Bien: La lógica de descuento automático de stock funcionó sin
  regresiones desde el primer ciclo. La exportación XLSX fue más
  sencilla de lo estimado con exceljs.

- ⚠️ Mejorar: La paginación lazy del historial de ventas consumió más
  tiempo de frontend del planeado. Se identificó la necesidad de índices
  SQL en fecha_salida para mantener el rendimiento con +2000 registros.

**Sprint 3 --- Motor de Inteligencia (Semanas 5-6)**

  -----------------------------------------------------------------------
  **Objetivo del Sprint**

  Implementar el motor analítico central. Al finalizar, el sistema debe
  calcular velocidad de venta, clasificar productos ABC, calcular ROP,
  proyectar agotamiento e integrar el copiloto IA con guardrails y
  auditoría.
  -----------------------------------------------------------------------

  -------------------------------------------------------------------
  **Tarea**                          **Responsable**   **Estado**
  ---------------------------------- ----------------- --------------
  demandEngine.js: promedios móviles Luis              Done ✅
  ponderados (7/30/90 días, pesos                      
  0.50/0.35/0.15)                                      

  Clasificación ABC automática       Luis              Done ✅
  basada en ingresos proyectados 30d                   

  Cálculo de ROP: (velocidad ×       Luis              Done ✅
  lead_time) + stock_seguridad                         

  Proyección de días hasta           Luis              Done ✅
  agotamiento y estado del producto                    
  (quiebre/crítico/adv/óptimo)                         

  Proyección de merma por            Luis              Done ✅
  vencimiento: unidades                                
  invendibles + pérdida COP                            

  aiService.js: integración OpenAI   Luis              Done ✅
  SDK con prompt estructurado +                        
  guardails ABC                                        

  Sistema de caché MD5 para evitar   Luis              Done ✅
  llamadas redundantes a la API                        

  Registro en Auditoria_IA y log     Luis              Done ✅
  ai_audit.log en cada consulta                        

  Nivel de confianza por ventanas de Luis              Done ✅
  datos disponibles (95/75/55/30%)                     

  feedbackEngine.js: factor          Luis              Done ✅
  precisión \[0.2-3.0\] acotado con                    
  período adaptativo                                   
  -------------------------------------------------------------------

**[Retrospectiva Sprint 3]{.underline}**

- ✅ Bien: La integración con OpenAI fue más directa de lo esperado. Los
  guardrails ABC resultaron esenciales para prevenir sugerencias
  absurdas del modelo (en pruebas tempranas el LLM sugerió ajustes del
  500%).

- ✅ Bien: El sistema de caché MD5 redujo en \~45% las llamadas a la API
  en sesiones de uso continuo, mejorando el rendimiento.

- ⚠️ Mejorar: El modelo LLM necesita ejemplos few-shot en el prompt para
  responder consistentemente en JSON válido. Se documentó el prompt
  definitivo con ejemplos.

**Sprint 4 --- Dashboard, Alertas y Centro Analítico (Semanas 7-8)**

  -----------------------------------------------------------------------
  **Objetivo del Sprint**

  Implementar el Dashboard principal con KPIs en tiempo real, el motor de
  alertas automáticas con las 5 reglas y el Centro Analítico. El sistema
  debe monitorear el inventario de forma proactiva y visual.
  -----------------------------------------------------------------------

  -------------------------------------------------------------------
  **Tarea**                          **Responsable**   **Estado**
  ---------------------------------- ----------------- --------------
  Dashboard: 4 tarjetas KPI          Elizabeth         Done ✅
  (artículos, valor inventario,                        
  alertas activas, ventas                              
  acumuladas)                                          

  Asistente Estratégico IA: top 4    Luis              Done ✅
  críticos, tendencia, cantidad                        
  sugerida, barra de confianza                         

  Semáforo MEBI con conteo de        Elizabeth         Done ✅
  críticas, advertencias y total                       

  Gráfico de barras Ritmo de Caja    Elizabeth         Done ✅
  (ventas últimos 7 días)                              

  ROI Proyectado con indicador de    Luis              Done ✅
  salud (inclinación del marcador)                     

  alertsEngine.js: motor con 5       Luis              Done ✅
  reglas secuenciales (RF-033 a                        
  RF-037)                                              

  Centro de Alertas con filtros por  Elizabeth         Done ✅
  severidad y botón Forzar Recálculo                   

  Marcar alertas como resueltas      Elizabeth         Done ✅
  (individualmente)                                    

  Vista de productos con semáforo de Elizabeth         Done ✅
  stock y configuración de                             
  reabastecimiento                                     

  Centro Analítico: tabla ABC con    Elizabeth/Luis    Done ✅
  velocidad, proyección, ingresos                      
  30d y card de fórmulas                               

  Nivel de servicio estimado y       Luis              Done ✅
  comparativa de ventas 30d actuales                   
  vs. 30d previos                                      
  -------------------------------------------------------------------

**[Retrospectiva Sprint 4]{.underline}**

- ✅ Bien: La visualización del semáforo ABC fue la funcionalidad con
  mejor recepción en el Sprint Review. El botón \'Forzar Recálculo\'
  resolvió el problema de latencia entre movimientos y actualización de
  alertas.

- ⚠️ Mejorar: El gráfico de barras del ritmo de caja requirió más
  iteraciones de CSS que las estimadas para ser responsive en móvil.

**Sprint 5 --- Reportes, Automatización y Módulos Finales (Semanas
9-10)**

  -----------------------------------------------------------------------
  **Objetivo del Sprint**

  Finalizar todos los módulos pendientes: reportes y exportaciones,
  simulador de escenarios, dashboard de aprendizaje IA, automatización de
  correos, gestión de colaboradores y preparación para pruebas.
  -----------------------------------------------------------------------

  ----------------------------------------------------------------------------
  **Tarea**                                   **Responsable**   **Estado**
  ------------------------------------------- ----------------- --------------
  Módulo de reportes: CRUD con tipos          Elizabeth         Done ✅
  (Inventario/Ventas/Financiero/Operativo),                     
  exportar XLSX                                                 

  Generación PDF de auditoría de merma con    Luis              Done ✅
  pdfkit (encabezado + tabla + total COP)                       

  Auditoría IA: vista filtrable por motor     Elizabeth         Done ✅
  (dashboard/proveedores), modal de                             
  inspección                                                    

  Simulador de Escenarios: slider días, campo Luis              Done ✅
  presupuesto, algoritmo greedy por ABC                         

  Convertir simulación en orden real con      Luis              Done ✅
  estado Borrador                                               

  Dashboard Aprendizaje IA: % precisión       Elizabeth         Done ✅
  global, gráfico evolución, tabla por                          
  producto                                                      

  Comparador sugerido vs. real en módulo de   Luis              Done ✅
  Feedback                                                      

  emailService.js: plantilla HTML             Luis              Done ✅
  responsive + nodemailer SMTP                                  

  Cron job node-cron: resumen semanal lunes   Luis              Done ✅
  8:00 AM (RF-059)                                              

  Botón \'Enviar Resumen Ahora\' en módulo de Elizabeth         Done ✅
  Reportes (RF-060)                                             

  Gestión de colaboradores: CRUD con          Elizabeth/Luis    Done ✅
  contraseñas temporales y cambio forzoso                       

  Perfil de usuario: editar datos, upload     Elizabeth         Done ✅
  foto Base64, cambio de contraseña                             

  Ver Tienda: info del negocio, lista de      Elizabeth         Done ✅
  personal, activar/inactivar                                   

  Pruebas QA completas de todos los módulos   Elizabeth/Luis    Done ✅
  (41 casos de prueba)                                          
  ----------------------------------------------------------------------------

**[Retrospectiva Sprint 5]{.underline}**

- ✅ Bien: El algoritmo greedy para el simulador resultó más simple que
  el de programación dinámica originalmente considerado, con resultados
  equivalentes para el rango de productos esperado (\<500 referencias).

- ✅ Bien: La generación del PDF de merma con pdfkit fue directa. La
  codificación COP requerida por RNF-018 funcionó correctamente.

- ⚠️ Mejorar: La configuración SMTP para el servicio de correo requirió
  más iteraciones por restricciones del proveedor de correo. Se
  documentó la configuración final en .env.example.

- ⚠️ Mejorar: La coordinación para la grabación del video demostrativo
  para la docente presentó problemas de sincronización de audio (el
  micrófono de uno de los integrantes no quedó grabado en el primer
  intento). Se añadió al proceso una prueba técnica previa de 5 minutos.

**8.5 Tablero Kanban --- Estado Final**

  ---------------------------------------------------------------------------
   **Épica / Módulo**    **Tareas   **Tareas In  **Tareas Done**   **Total**
                         To Do**    Progress**                    
  --------------------- ---------- ------------- ---------------- -----------
     Autenticación y        0            0              10            10
        Usuarios                                                  

  Factory Method (Tipos     0            0              4              4
      de Producto)                                                

  Gestión de Productos      0            0              11            11

   Ventas e Historial       0            0              8              8

     Movimientos de         0            0              5              5
       Inventario                                                 

   Motor Predictivo de      0            0              10            10
         Demanda                                                  

  Integración Copiloto      0            0              6              6
           IA                                                     

    Motor de Alertas        0            0              5              5

    Dashboard y KPIs        0            0              11            11

  Órdenes Inteligentes      0            0              8              8
      y Proveedores                                               

      Simulador de          0            0              5              5
       Escenarios                                                 

   Feedback Adaptativo      0            0              5              5
           IA                                                     

       Reportes y           0            0              7              7
       Exportación                                                

    Automatización y        0            0              4              4
      Comunicación                                                

  Multi-Tienda, Roles y     0            0              7              7
        Perfiles                                                  

       Pruebas QA           0            0              41            41

          TOTAL             0            0             147            147
  ---------------------------------------------------------------------------

**9. Entorno de Desarrollo**

**9.1 Requisitos del Sistema**

**Requisitos del Servidor**

  ------------------------------------------------------------------------
  **Componente**     **Versión        **Notas**
                     mínima**         
  ------------------ ---------------- ------------------------------------
  Node.js            16.x             Descargar desde nodejs.org; instalar
                     (recomendado     con opciones por defecto
                     18.x LTS)        

  NPM                8.x (incluido    Gestor de paquetes del proyecto
                     con Node.js)     

  SQLite3            3.x (incluido en No requiere instalación separada de
                     paquete npm)     servidor

  Navegador moderno  Chrome 110+ /    Requerido para funcionalidades ES6+
                     Edge 110+ /      y fetch API
                     Firefox 110+     
  ------------------------------------------------------------------------

**Requisitos del Cliente**

  -----------------------------------------------------------------------
  **Componente**    **Requisito**
  ----------------- -----------------------------------------------------
  Conexión de red   LAN local o conexión a Internet (para acceder al
                    servidor)

  Resolución de     Mínimo 375px (móvil) · Óptima 1280×720 o superior
  pantalla          

  Navegador         Chrome, Edge o Firefox en sus dos últimas versiones
  -----------------------------------------------------------------------

**9.2 Instalación y Configuración**

+-----------------------------------------------------------------------+
| \# 1. Clonar el repositorio                                           |
|                                                                       |
| git clone https://github.com/DiegoHerrera10009/Inventarios            |
|                                                                       |
| cd stockpilot                                                         |
|                                                                       |
| \# 2. Instalar dependencias del proyecto                              |
|                                                                       |
| npm install                                                           |
|                                                                       |
| \# 3. Crear archivo de variables de entorno                           |
|                                                                       |
| cp .env.example .env                                                  |
|                                                                       |
| \# Editar .env con los valores correspondientes:                      |
|                                                                       |
| \# SESSION_SECRET=tu_clave_secreta_aleatoria_larga                    |
|                                                                       |
| \# OPENAI_API_KEY=sk-\...                                             |
|                                                                       |
| \# EMAIL_USER=tu_correo@gmail.com                                     |
|                                                                       |
| \# EMAIL_PASS=tu_app_password_de_gmail                                |
|                                                                       |
| \# PORT=3000                                                          |
|                                                                       |
| \# 4. Inicializar la base de datos (migraciones automáticas al        |
| iniciar)                                                              |
|                                                                       |
| node app.js                                                           |
|                                                                       |
| \# 5. Para desarrollo con recarga automática:                         |
|                                                                       |
| npx nodemon app.js                                                    |
|                                                                       |
| \# El sistema estará disponible en: http://localhost:3000             |
+-----------------------------------------------------------------------+

**9.3 Estructura del Proyecto**

+-----------------------------------------------------------------------+
| stockpilot/                                                           |
|                                                                       |
| ├── app.js \# Punto de entrada: configura Express, sesiones, rutas,   |
| cron                                                                  |
|                                                                       |
| ├── package.json \# Dependencias y scripts npm                        |
|                                                                       |
| ├── .env \# Variables de entorno (NO subir a Git)                     |
|                                                                       |
| ├── .env.example \# Plantilla de variables de entorno                 |
|                                                                       |
| ├── .gitignore \# node_modules, .env, \*.db                           |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── config/                                                           |
|                                                                       |
| │ └── database.js \# Inicialización SQLite + migraciones              |
| incrementales                                                         |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── routes/ \# Definición de rutas Express (1 archivo por módulo)     |
|                                                                       |
| │ ├── auth.js \# /login, /register, /logout, /recover                 |
|                                                                       |
| │ ├── productos.js \# /productos (CRUD + clasificación ABC)           |
|                                                                       |
| │ ├── ventas.js \# /ventas (registro, historial, top, exportar)       |
|                                                                       |
| │ ├── movimientos.js \# /movimientos (CRUD de movimientos de stock)   |
|                                                                       |
| │ ├── alertas.js \# /alertas (listar, recalcular, resolver)           |
|                                                                       |
| │ ├── proveedores.js \# /proveedores (CRUD + órdenes inteligentes)    |
|                                                                       |
| │ ├── reportes.js \# /reportes (CRUD + exportar XLSX + PDF merma +    |
| correo)                                                               |
|                                                                       |
| │ ├── ai.js \# /api/ia (recomendaciones, simulador, feedback,         |
| learning)                                                             |
|                                                                       |
| │ ├── usuarios.js \# /usuarios (CRUD colaboradores, perfil)           |
|                                                                       |
| │ └── tienda.js \# /tienda (ver, editar, activar/inactivar)           |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── controllers/ \# Lógica de negocio (1 archivo por módulo)          |
|                                                                       |
| │ ├── authController.js                                               |
|                                                                       |
| │ ├── productosController.js                                          |
|                                                                       |
| │ ├── ventasController.js                                             |
|                                                                       |
| │ ├── movimientosController.js                                        |
|                                                                       |
| │ ├── alertasController.js                                            |
|                                                                       |
| │ ├── proveedoresController.js                                        |
|                                                                       |
| │ ├── reportesController.js                                           |
|                                                                       |
| │ └── usuariosController.js                                           |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── models/ \# Acceso a datos SQLite (consultas preparadas)           |
|                                                                       |
| │ ├── Tienda.js                                                       |
|                                                                       |
| │ ├── Usuario.js                                                      |
|                                                                       |
| │ ├── Producto.js                                                     |
|                                                                       |
| │ ├── Venta.js                                                        |
|                                                                       |
| │ ├── Movimiento.js                                                   |
|                                                                       |
| │ ├── Alerta.js                                                       |
|                                                                       |
| │ ├── Proveedor.js                                                    |
|                                                                       |
| │ ├── Orden.js                                                        |
|                                                                       |
| │ └── AuditoriaIA.js                                                  |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── services/ \# Servicios de negocio especializados                  |
|                                                                       |
| │ ├── demandEngine.js \# Motor de predicción: velocidad, ROP, ABC,    |
| agotamiento                                                           |
|                                                                       |
| │ ├── aiService.js \# OpenAI + guardrails ABC + caché MD5 + auditoría |
|                                                                       |
| │ ├── alertsEngine.js \# Motor de 5 reglas para generación de alertas |
|                                                                       |
| │ ├── scenarioSimulator.js \# Algoritmo greedy por presupuesto y      |
| clase ABC                                                             |
|                                                                       |
| │ ├── feedbackEngine.js \# Retroalimentación adaptativa \[0.2-3.0\]   |
|                                                                       |
| │ ├── reportService.js \# Generación de archivos XLSX y PDF con       |
| pdfkit                                                                |
|                                                                       |
| │ └── emailService.js \# Plantillas HTML + envío SMTP con nodemailer  |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── factories/ \# Patrón Factory Method para tipos de producto        |
|                                                                       |
| │ ├── index.js \# getFactory(tipo) --- selector del factory correcto  |
|                                                                       |
| │ ├── ProductoFactory.js \# Clase abstracta: crearProducto() +        |
| registrarProducto()                                                   |
|                                                                       |
| │ ├── PerecederoFactory.js \# Concreto: valida fecha_vencimiento,     |
| instancia Perecedero                                                  |
|                                                                       |
| │ ├── NoPerecederoFactory.js \# Concreto: sin fecha_venc, instancia   |
| NoPerecedero                                                          |
|                                                                       |
| │ └── DigitalFactory.js \# Concreto: lead_time=1, sin caducidad,      |
| instancia Digital                                                     |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── middleware/                                                       |
|                                                                       |
| │ ├── auth.js \# requireLogin (todas las rutas), requireAdmin (solo   |
| admin)                                                                |
|                                                                       |
| │ └── rateLimiter.js \# Limitar intentos de login (seguridad)         |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── views/ \# Plantillas EJS (1 carpeta por módulo)                   |
|                                                                       |
| │ ├── landing.ejs                                                     |
|                                                                       |
| │ ├── auth/login.ejs, register.ejs, recover.ejs                       |
|                                                                       |
| │ ├── dashboard/index.ejs, analytics.ejs                              |
|                                                                       |
| │ ├── productos/index.ejs                                             |
|                                                                       |
| │ ├── ventas/index.ejs                                                |
|                                                                       |
| │ ├── movimientos/index.ejs                                           |
|                                                                       |
| │ ├── alertas/index.ejs                                               |
|                                                                       |
| │ ├── proveedores/index.ejs, orders.ejs                               |
|                                                                       |
| │ ├── reportes/index.ejs, auditoria.ejs                               |
|                                                                       |
| │ ├── simulador/index.ejs                                             |
|                                                                       |
| │ ├── aprendizaje/index.ejs                                           |
|                                                                       |
| │ ├── tienda/index.ejs                                                |
|                                                                       |
| │ ├── usuarios/index.ejs                                              |
|                                                                       |
| │ ├── perfil/index.ejs                                                |
|                                                                       |
| │ └── partials/navbar.ejs, footer.ejs, toast.ejs                      |
|                                                                       |
| │                                                                     |
|                                                                       |
| ├── public/ \# Assets estáticos (servidos directamente)               |
|                                                                       |
| │ ├── css/ \# Estilos modulares por vista                             |
|                                                                       |
| │ ├── js/ \# Scripts de cliente (fetch API, sliders, charts)          |
|                                                                       |
| │ └── img/ \# Imágenes e iconos del sistema                           |
|                                                                       |
| │                                                                     |
|                                                                       |
| └── logs/                                                             |
|                                                                       |
| └── ai_audit.log \# Log de texto plano de todas las consultas a la IA |
+-----------------------------------------------------------------------+

**9.4 Control de Versiones**

- Sistema: Git con repositorio en GitHub
  (https://github.com/DiegoHerrera10009/Inventarios).

- Estrategia de ramas: main (producción estable) · develop (integración
  continua) · feature/\[nombre-módulo\] para cada nueva funcionalidad.

- Convención de commits semánticos: feat: (nueva funcionalidad), fix:
  (corrección de bug), docs: (documentación), refactor: (refactorización
  sin cambio funcional), test: (pruebas), chore: (mantenimiento).

- Pull Requests con revisión cruzada antes de fusionar a develop.

**10. Implementación del Código --- Fragmentos Significativos**

**10.1 Motor de Predicción de Demanda (demandEngine.js)**

+-----------------------------------------------------------------------+
| // /services/demandEngine.js --- Cálculo de velocidad ponderada y     |
| proyección de agotamiento                                             |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Calcula la velocidad de venta ponderada usando tres ventanas       |
| temporales.                                                           |
|                                                                       |
| \* La ponderación decreciente prioriza el comportamiento reciente.    |
|                                                                       |
| \* \@returns {{ velocidad: number, confianza: number, tendencia:      |
| string }}                                                             |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| function calcularVelocidadPonderada(db, id_producto, id_tienda) {     |
|                                                                       |
| const periodos = \[                                                   |
|                                                                       |
| { dias: 7, peso: 0.50 }, // Comportamiento más reciente               |
|                                                                       |
| { dias: 30, peso: 0.35 }, // Tendencia mensual                        |
|                                                                       |
| { dias: 90, peso: 0.15 }, // Contexto histórico                       |
|                                                                       |
| \];                                                                   |
|                                                                       |
| let velocidadPonderada = 0;                                           |
|                                                                       |
| let ventanasConDatos = 0;                                             |
|                                                                       |
| const velocidadesPorPeriodo = \[\];                                   |
|                                                                       |
| for (const { dias, peso } of periodos) {                              |
|                                                                       |
| const resultado = db.prepare(\`                                       |
|                                                                       |
| SELECT COALESCE(SUM(vp.cantidad), 0) AS total_unidades                |
|                                                                       |
| FROM VentasProductos vp                                               |
|                                                                       |
| JOIN Ventas v ON vp.id_venta = v.id_venta                             |
|                                                                       |
| WHERE vp.id_producto = ?                                              |
|                                                                       |
| AND v.id_tienda = ?                                                   |
|                                                                       |
| AND v.fecha_salida \>= datetime(\'now\', \'-\' \|\| ? \|\| \' days\') |
|                                                                       |
| \`).get(id_producto, id_tienda, dias);                                |
|                                                                       |
| const velocidadPeriodo = resultado.total_unidades / dias;             |
|                                                                       |
| velocidadesPorPeriodo.push(velocidadPeriodo);                         |
|                                                                       |
| velocidadPonderada += velocidadPeriodo \* peso;                       |
|                                                                       |
| if (resultado.total_unidades \> 0) ventanasConDatos++;                |
|                                                                       |
| }                                                                     |
|                                                                       |
| // Nivel de confianza: más ventanas con datos = mayor confianza       |
|                                                                       |
| const mapaConfianza = { 3: 0.95, 2: 0.75, 1: 0.55, 0: 0.30 };         |
|                                                                       |
| const confianza = mapaConfianza\[ventanasConDatos\];                  |
|                                                                       |
| // Detección de tendencia: comparar velocidad 7d vs 30d               |
|                                                                       |
| const v7d = velocidadesPorPeriodo\[0\];                               |
|                                                                       |
| const v30d = velocidadesPorPeriodo\[1\];                              |
|                                                                       |
| let tendencia = \'estable\';                                          |
|                                                                       |
| if (v30d \> 0) {                                                      |
|                                                                       |
| if (v7d \> v30d \* 1.10) tendencia = \'alcista\';                     |
|                                                                       |
| else if (v7d \< v30d \* 0.90) tendencia = \'bajista\';                |
|                                                                       |
| }                                                                     |
|                                                                       |
| return { velocidad: velocidadPonderada, confianza, tendencia };       |
|                                                                       |
| }                                                                     |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Proyecta el estado del producto según su stock actual y velocidad. |
|                                                                       |
| \* Implementa las reglas R1 y R2 del motor de alertas.                |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| function proyectarAgotamiento(stockActual, velocidad, leadTime,       |
| stockSeguridad, frecuenciaCompra) {                                   |
|                                                                       |
| if (velocidad \<= 0) return { diasRestantes: Infinity, rop: null,     |
| estado: \'optimo\' };                                                 |
|                                                                       |
| const diasRestantes = stockActual / velocidad;                        |
|                                                                       |
| const rop = (velocidad \* leadTime) + stockSeguridad;                 |
|                                                                       |
| let estado;                                                           |
|                                                                       |
| if (stockActual \<= stockSeguridad) estado = \'quiebre\';             |
|                                                                       |
| else if (diasRestantes \< leadTime) estado = \'critico\';             |
|                                                                       |
| else if (stockActual \<= rop) estado = \'advertencia\';               |
|                                                                       |
| else if (diasRestantes \>= leadTime + frecuenciaCompra) estado =      |
| \'optimo\';                                                           |
|                                                                       |
| else estado = \'advertencia\';                                        |
|                                                                       |
| return { diasRestantes: Math.max(0, Math.floor(diasRestantes)), rop,  |
| estado };                                                             |
|                                                                       |
| }                                                                     |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Calcula la cantidad base a pedir usando la fórmula de              |
| reabastecimiento EOQ simplificada.                                    |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| function calcularCantidadBase(velocidad, leadTime, frecuenciaCompra,  |
| stockActual, stockSeguridad) {                                        |
|                                                                       |
| const cobertura = leadTime + frecuenciaCompra;                        |
|                                                                       |
| return Math.max(0, Math.ceil((velocidad \* cobertura) - stockActual + |
| stockSeguridad));                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Proyecta las pérdidas económicas por productos próximos a vencer.  |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| function proyectarMermaVencimiento(velocidad, stockActual,            |
| diasHastaVencimiento, precioUnitario) {                               |
|                                                                       |
| if (!diasHastaVencimiento \|\| diasHastaVencimiento \< 0) return {    |
| unidades: 0, perdidaCOP: 0 };                                         |
|                                                                       |
| const unidadesQueSeVenderan = Math.floor(velocidad \*                 |
| diasHastaVencimiento);                                                |
|                                                                       |
| const unidadesInvendibles = Math.max(0, stockActual -                 |
| unidadesQueSeVenderan);                                               |
|                                                                       |
| return { unidades: unidadesInvendibles, perdidaCOP:                   |
| unidadesInvendibles \* precioUnitario };                              |
|                                                                       |
| }                                                                     |
|                                                                       |
| module.exports = {                                                    |
|                                                                       |
| calcularVelocidadPonderada,                                           |
|                                                                       |
| proyectarAgotamiento,                                                 |
|                                                                       |
| calcularCantidadBase,                                                 |
|                                                                       |
| proyectarMermaVencimiento,                                            |
|                                                                       |
| };                                                                    |
+-----------------------------------------------------------------------+

**10.2 Servicio de IA --- Guardrails y Auditoría (aiService.js)**

+-----------------------------------------------------------------------+
| // /services/aiService.js --- Integración OpenAI con guardrails,      |
| caché y auditoría                                                     |
|                                                                       |
| const OpenAI = require(\'openai\');                                   |
|                                                                       |
| const crypto = require(\'crypto\');                                   |
|                                                                       |
| const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });    |
|                                                                       |
| // Guardrails: límites máximos de ajuste por clase ABC (principio     |
| OCP)                                                                  |
|                                                                       |
| const GUARDRAILS = { A: 1.0, B: 0.5, C: 0.2 }; // ±100%, ±50%, ±20%   |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Consulta el copiloto IA para ajustar las cantidades sugeridas.     |
|                                                                       |
| \* Aplica guardrails, caché MD5 y registra la decisión en             |
| Auditoria_IA.                                                         |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| async function consultarCopilotoProveedor(productos, id_tienda,       |
| id_orden, db) {                                                       |
|                                                                       |
| // 1. Verificar caché por hash MD5 de los datos de entrada            |
|                                                                       |
| const hashEntrada = crypto.createHash(\'md5\')                        |
|                                                                       |
| .update(JSON.stringify(productos) + id_tienda)                        |
|                                                                       |
| .digest(\'hex\');                                                     |
|                                                                       |
| const cacheHit = db.prepare(                                          |
|                                                                       |
| \'SELECT sugerencia_ia_json FROM ai_cache WHERE hash = ? AND          |
| id_tienda = ?\'                                                       |
|                                                                       |
| ).get(hashEntrada, id_tienda);                                        |
|                                                                       |
| if (cacheHit) {                                                       |
|                                                                       |
| console.log(\'\[AI Cache\] HIT --- sin llamada a OpenAI, datos sin    |
| cambios\');                                                           |
|                                                                       |
| return JSON.parse(cacheHit.sugerencia_ia_json);                       |
|                                                                       |
| }                                                                     |
|                                                                       |
| // 2. Construir prompt estructurado con contexto analítico            |
|                                                                       |
| const prompt = \`Eres un experto en gestión de inventarios para       |
| microempresas.                                                        |
|                                                                       |
| Analiza los siguientes productos y sugiere ajustes porcentuales a las |
| cantidades base.                                                      |
|                                                                       |
| Responde ÚNICAMENTE en JSON válido sin markdown ni texto adicional.   |
|                                                                       |
| Productos a analizar:                                                 |
|                                                                       |
| \${JSON.stringify(productos, null, 2)}                                |
|                                                                       |
| Formato de respuesta requerido:                                       |
|                                                                       |
| {                                                                     |
|                                                                       |
| \"items\": \[                                                         |
|                                                                       |
| {                                                                     |
|                                                                       |
| \"id_producto\": \<número\>,                                          |
|                                                                       |
| \"clase_abc\": \"\<A\|B\|C\>\",                                       |
|                                                                       |
| \"ajuste_porcentaje\": \<número entre -1.0 y 1.0\>,                   |
|                                                                       |
| \"razon\": \"\<razón en español, máx 100 caracteres\>\"               |
|                                                                       |
| }                                                                     |
|                                                                       |
| \],                                                                   |
|                                                                       |
| \"razonamiento_general\": \"\<análisis global en español, máx 200     |
| caracteres\>\"                                                        |
|                                                                       |
| }\`;                                                                  |
|                                                                       |
| // 3. Llamada a OpenAI con manejo de errores                          |
|                                                                       |
| const respuesta = await openai.chat.completions.create({              |
|                                                                       |
| model: \'gpt-4o-mini\',                                               |
|                                                                       |
| messages: \[                                                          |
|                                                                       |
| { role: \'system\', content: \'Responde ÚNICAMENTE con JSON válido.   |
| Sin backticks.\' },                                                   |
|                                                                       |
| { role: \'user\', content: prompt }                                   |
|                                                                       |
| \],                                                                   |
|                                                                       |
| max_tokens: 1000,                                                     |
|                                                                       |
| temperature: 0.3 // Baja temperatura para respuestas más              |
| deterministas                                                         |
|                                                                       |
| });                                                                   |
|                                                                       |
| const textoRespuesta = respuesta.choices\[0\].message.content.trim(); |
|                                                                       |
| let sugerenciaIA;                                                     |
|                                                                       |
| try {                                                                 |
|                                                                       |
| sugerenciaIA = JSON.parse(textoRespuesta);                            |
|                                                                       |
| } catch (e) {                                                         |
|                                                                       |
| throw new Error(\'La IA devolvió un JSON inválido. Verifique el       |
| prompt.\');                                                           |
|                                                                       |
| }                                                                     |
|                                                                       |
| // 4. Aplicar guardrails por clase ABC y factor de precisión          |
| histórico                                                             |
|                                                                       |
| for (const item of sugerenciaIA.items) {                              |
|                                                                       |
| const limiteMax = GUARDRAILS\[item.clase_abc\] ??                     |
| GUARDRAILS\[\'C\'\];                                                  |
|                                                                       |
| // Clamping: limitar el ajuste al máximo permitido por la clase       |
|                                                                       |
| item.ajuste_porcentaje = Math.max(-limiteMax, Math.min(limiteMax,     |
| item.ajuste_porcentaje));                                             |
|                                                                       |
| // Aplicar factor de precisión histórico (Feedback_IA)                |
|                                                                       |
| const feedbackRow = db.prepare(                                       |
|                                                                       |
| \'SELECT factor_precision FROM Feedback_IA WHERE id_producto = ?      |
| ORDER BY fecha_evaluacion DESC LIMIT 1\'                              |
|                                                                       |
| ).get(item.id_producto);                                              |
|                                                                       |
| const factorPrecision = feedbackRow ? Math.max(0.2, Math.min(3.0,     |
| feedbackRow.factor_precision)) : 1.0;                                 |
|                                                                       |
| // Cantidad final = base × (1 + ajuste_IA) × factor_precision         |
|                                                                       |
| const productoBase = productos.find(p =\> p.id_producto ===           |
| item.id_producto);                                                    |
|                                                                       |
| item.cantidad_final = productoBase                                    |
|                                                                       |
| ? Math.round(productoBase.cantidad_base \* (1 +                       |
| item.ajuste_porcentaje) \* factorPrecision)                           |
|                                                                       |
| : null;                                                               |
|                                                                       |
| }                                                                     |
|                                                                       |
| // 5. Registrar en Auditoria_IA para trazabilidad completa (RF-026,   |
| RNF-015)                                                              |
|                                                                       |
| db.prepare(\`                                                         |
|                                                                       |
| INSERT INTO Auditoria_IA                                              |
|                                                                       |
| (fecha_auditoria, id_tienda, id_orden, motor_ia, prompt_utilizado,    |
|                                                                       |
| datos_base_json, sugerencia_ia_json, impacto_decision, razon_ia)      |
|                                                                       |
| VALUES (datetime(\'now\'), ?, ?, \'copiloto_suministrador\', ?, ?, ?, |
| \'múltiple\', ?)                                                      |
|                                                                       |
| \`).run(                                                              |
|                                                                       |
| id_tienda, id_orden, prompt,                                          |
|                                                                       |
| JSON.stringify(productos),                                            |
|                                                                       |
| JSON.stringify(sugerenciaIA),                                         |
|                                                                       |
| sugerenciaIA.razonamiento_general                                     |
|                                                                       |
| );                                                                    |
|                                                                       |
| // 6. Guardar en caché para evitar re-consultas (RNF-003)             |
|                                                                       |
| db.prepare(                                                           |
|                                                                       |
| \'INSERT OR REPLACE INTO ai_cache (hash, id_tienda,                   |
| sugerencia_ia_json, fecha) VALUES (?,?,?,datetime(\"now\"))\'         |
|                                                                       |
| ).run(hashEntrada, id_tienda, JSON.stringify(sugerenciaIA));          |
|                                                                       |
| return sugerenciaIA;                                                  |
|                                                                       |
| }                                                                     |
|                                                                       |
| module.exports = { consultarCopilotoProveedor };                      |
+-----------------------------------------------------------------------+

**10.3 Motor de Alertas --- Cinco Reglas (alertsEngine.js)**

+-----------------------------------------------------------------------+
| // /services/alertsEngine.js --- Motor de reglas secuenciales para    |
| generación de alertas                                                 |
|                                                                       |
| const { calcularVelocidadPonderada, proyectarAgotamiento } =          |
| require(\'./demandEngine\');                                          |
|                                                                       |
| /\*\*                                                                 |
|                                                                       |
| \* Ejecuta las 5 reglas de alerta para todos los productos de una     |
| tienda.                                                               |
|                                                                       |
| \* Se invoca al cargar el dashboard y cuando el usuario presiona      |
| \"Forzar Recálculo\".                                                 |
|                                                                       |
| \*/                                                                   |
|                                                                       |
| function recalcularAlertas(db, id_tienda) {                           |
|                                                                       |
| const productos = db.prepare(                                         |
|                                                                       |
| \'SELECT \* FROM Productos WHERE id_tienda = ? AND estado =           |
| \"activo\"\'                                                          |
|                                                                       |
| ).all(id_tienda);                                                     |
|                                                                       |
| // Limpiar alertas no resueltas anteriores antes de recalcular        |
|                                                                       |
| db.prepare(\'DELETE FROM Alertas WHERE id_tienda = ? AND resuelta =   |
| 0\').run(id_tienda);                                                  |
|                                                                       |
| const alertasGeneradas = \[\];                                        |
|                                                                       |
| for (const producto of productos) {                                   |
|                                                                       |
| const { velocidad } = calcularVelocidadPonderada(db,                  |
| producto.id_producto, id_tienda);                                     |
|                                                                       |
| const { diasRestantes, rop, estado } = proyectarAgotamiento(          |
|                                                                       |
| producto.cantidad, velocidad,                                         |
|                                                                       |
| producto.lead_time \|\| 7,                                            |
|                                                                       |
| producto.stock_seguridad \|\| 0,                                      |
|                                                                       |
| producto.frecuencia_compra_dias \|\| 30                               |
|                                                                       |
| );                                                                    |
|                                                                       |
| // ── Regla R1: Alerta Crítica de Stock                               |
| ──────────────────────────────                                        |
|                                                                       |
| if (velocidad \> 0 && diasRestantes \< (producto.lead_time \|\| 7)) { |
|                                                                       |
| alertasGeneradas.push(insertarAlerta(db, {                            |
|                                                                       |
| id_producto: producto.id_producto, id_tienda,                         |
|                                                                       |
| tipo: \'stock_critico\', severidad: \'critica\',                      |
|                                                                       |
| mensaje: \`Stock agónico: quedan \~\${diasRestantes} días de          |
| inventario y el proveedor tarda \${producto.lead_time \|\| 7} días en |
| entregar.\`,                                                          |
|                                                                       |
| datos: { diasRestantes, velocidad, rop }                              |
|                                                                       |
| }));                                                                  |
|                                                                       |
| }                                                                     |
|                                                                       |
| // ── Regla R2: Alerta de Advertencia (ventana de reposición)         |
| ────────                                                              |
|                                                                       |
| else if (velocidad \> 0 && diasRestantes \>= (producto.lead_time \|\| |
| 7) &&                                                                 |
|                                                                       |
| diasRestantes \< ((producto.lead_time \|\| 7) +                       |
| (producto.frecuencia_compra_dias \|\| 30))) {                         |
|                                                                       |
| alertasGeneradas.push(insertarAlerta(db, {                            |
|                                                                       |
| id_producto: producto.id_producto, id_tienda,                         |
|                                                                       |
| tipo: \'advertencia\', severidad: \'advertencia\',                    |
|                                                                       |
| mensaje: \`Ventana de pedido abierta: quedan \~\${diasRestantes}      |
| días. El ideal es reabastecer ahora para mantener el ciclo sano.\`,   |
|                                                                       |
| datos: { diasRestantes, velocidad, rop }                              |
|                                                                       |
| }));                                                                  |
|                                                                       |
| }                                                                     |
|                                                                       |
| // ── Regla R3: Vencimiento Crítico (≤7 días)                         |
| ────────────────────────                                              |
|                                                                       |
| if (producto.fecha_salida) {                                          |
|                                                                       |
| const hoy = new Date();                                               |
|                                                                       |
| const fechaVenc = new Date(producto.fecha_salida);                    |
|                                                                       |
| const diasHastaVenc = Math.floor((fechaVenc - hoy) / (1000 \* 60 \*   |
| 60 \* 24));                                                           |
|                                                                       |
| const unidadesQueSeVenderan = Math.floor(velocidad \* diasHastaVenc); |
|                                                                       |
| const unidadesInvendibles = Math.max(0, producto.cantidad -           |
| unidadesQueSeVenderan);                                               |
|                                                                       |
| if (diasHastaVenc \<= 7 && diasHastaVenc \>= 0 && unidadesInvendibles |
| \> 0) {                                                               |
|                                                                       |
| alertasGeneradas.push(insertarAlerta(db, {                            |
|                                                                       |
| id_producto: producto.id_producto, id_tienda,                         |
|                                                                       |
| tipo: \'vencimiento_critico\', severidad: \'critica\',                |
|                                                                       |
| mensaje: \`Vence en \${diasHastaVenc} días. Se estiman                |
| \${unidadesInvendibles} unidades invendibles. Aplique promoción       |
| urgente.\`,                                                           |
|                                                                       |
| datos: { diasHastaVenc, unidadesInvendibles }                         |
|                                                                       |
| }));                                                                  |
|                                                                       |
| }                                                                     |
|                                                                       |
| // ── Regla R4: Vencimiento Advertencia (8-30 días) ─────────────     |
|                                                                       |
| else if (diasHastaVenc \> 7 && diasHastaVenc \<= 30 &&                |
| unidadesInvendibles \> 0) {                                           |
|                                                                       |
| alertasGeneradas.push(insertarAlerta(db, {                            |
|                                                                       |
| id_producto: producto.id_producto, id_tienda,                         |
|                                                                       |
| tipo: \'vencimiento_advertencia\', severidad: \'advertencia\',        |
|                                                                       |
| mensaje: \`Vence en \${diasHastaVenc} días. Planifique estrategia de  |
| salida para \${unidadesInvendibles} unidades en riesgo.\`,            |
|                                                                       |
| datos: { diasHastaVenc, unidadesInvendibles }                         |
|                                                                       |
| }));                                                                  |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| // ── Regla R5: Sobrestock (Clase C, más de 60 días, excede máximo)   |
| ──                                                                    |
|                                                                       |
| if (producto.stock_maximo && producto.cantidad \>                     |
| producto.stock_maximo &&                                              |
|                                                                       |
| diasRestantes \> 60) {                                                |
|                                                                       |
| alertasGeneradas.push(insertarAlerta(db, {                            |
|                                                                       |
| id_producto: producto.id_producto, id_tienda,                         |
|                                                                       |
| tipo: \'sobrestock\', severidad: \'sobrestock\',                      |
|                                                                       |
| mensaje: \`Capital estancado: \${producto.cantidad} unidades con      |
| \${Math.floor(diasRestantes)}d de inventario. Considere oferta o      |
| reducir próxima compra.\`,                                            |
|                                                                       |
| datos: { diasRestantes, exceso: producto.cantidad -                   |
| producto.stock_maximo }                                               |
|                                                                       |
| }));                                                                  |
|                                                                       |
| }                                                                     |
|                                                                       |
| }                                                                     |
|                                                                       |
| return alertasGeneradas;                                              |
|                                                                       |
| }                                                                     |
|                                                                       |
| function insertarAlerta(db, { id_producto, id_tienda, tipo,           |
| severidad, mensaje, datos }) {                                        |
|                                                                       |
| return db.prepare(\`                                                  |
|                                                                       |
| INSERT INTO Alertas (id_producto, id_tienda, tipo, severidad,         |
| mensaje, datos_json, resuelta)                                        |
|                                                                       |
| VALUES (?, ?, ?, ?, ?, ?, 0)                                          |
|                                                                       |
| \`).run(id_producto, id_tienda, tipo, severidad, mensaje,             |
| JSON.stringify(datos));                                               |
|                                                                       |
| }                                                                     |
|                                                                       |
| module.exports = { recalcularAlertas };                               |
+-----------------------------------------------------------------------+

**11. Especificación de Casos de Uso**

**11.1 Paquetes de Casos de Uso**

  -----------------------------------------------------------------------------------
  **Paquete**      **Código**   **Casos de Uso            **RF Relacionados**
                                incluidos**               
  ---------------- ------------ ------------------------- ---------------------------
  Autenticación y  CU-01        CU-01.1 Iniciar Sesión ·  RF-001 al RF-006, RF-050,
  Usuarios                      CU-01.2 Registrar Usuario RF-051, RF-061, RF-062
                                y Negocio · CU-01.3       
                                Recuperar Contraseña ·    
                                CU-01.4 Gestionar Perfil  
                                · CU-01.5 Gestionar       
                                Colaboradores             

  Gestión de       CU-02        CU-02.1 Gestionar         RF-007 al RF-011, RF-016 al
  Inventario                    Productos (CRUD) ·        RF-019
                                CU-02.2 Registrar         
                                Movimiento · CU-02.3      
                                Gestionar Tiendas ·       
                                CU-02.4 Visualizar        
                                Clasificación ABC         

  Ventas y         CU-03        CU-03.1 Registrar Venta · RF-012 al RF-015, RF-044 al
  Reportes                      CU-03.2 Consultar Top     RF-047, RF-058
                                Ventas · CU-03.3          
                                Gestionar Reportes ·      
                                CU-03.4 Exportar Reporte  
                                Excel · CU-03.5 Descargar 
                                Auditoría de Merma PDF    

  Motor Predictivo CU-04        CU-04.1 Consultar         RF-020, RF-022, RF-024 al
  e IA                          Dashboard Inteligente ·   RF-026, RF-033 al RF-043
                                CU-04.2 Generar Alertas   
                                Inteligentes · CU-04.3    
                                Obtener Recomendaciones   
                                IA                        

  Compras          CU-05        CU-05.1 Gestionar         RF-027 al RF-032, RF-048,
  Inteligentes                  Proveedores · CU-05.2     RF-049, RF-052 al RF-057
                                Generar Orden de Compra   
                                Inteligente · CU-05.3     
                                Consultar Historial de    
                                Órdenes · CU-05.4 Simular 
                                Escenarios de Compra ·    
                                CU-05.5 Evaluar Precisión 
                                de Predicción IA          

  Automatización y CU-06        CU-06.1 Enviar Resumen    RF-059, RF-060
  Comunicación                  Semanal Automático ·      
                                CU-06.2 Enviar Resumen    
                                Manual                    
  -----------------------------------------------------------------------------------

**11.2 Matriz de Trazabilidad Casos de Uso ↔ Requerimientos**

  ----------------------------------------------------------------------------
  **Caso de **Nombre**            **Actores**        **RF Relacionados**
  Uso**                                              
  --------- --------------------- ------------------ -------------------------
  CU-01.1   Iniciar Sesión        Admin, Colaborador RF-001, RF-004, RF-006,
                                                     RF-061

  CU-01.2   Registrar Usuario y   Usuario no         RF-002, RF-006
            Negocio               registrado         

  CU-01.3   Recuperar Contraseña  Usuario registrado RF-003

  CU-01.4   Gestionar Perfil      Admin, Colaborador RF-005

  CU-01.5   Gestionar             Administrador      RF-050, RF-051, RF-062
            Colaboradores                            

  CU-02.1   Gestionar Productos   Admin (CRUD) /     RF-007, RF-008, RF-009,
            (CRUD)                Collab             RF-010
                                  (ver+vender)       

  CU-02.2   Registrar Movimiento  Admin, Colaborador RF-016, RF-017
            de Inventario                            

  CU-02.3   Gestionar Tiendas /   Administrador      RF-018, RF-019
            Multi-Tienda                             

  CU-02.4   Visualizar            Administrador      RF-009, RF-011
            Clasificación ABC                        

  CU-03.1   Registrar Venta       Admin, Colaborador RF-012, RF-013

  CU-03.2   Consultar Top Ventas  Admin, Colaborador RF-014

  CU-03.3   Gestionar Reportes    Administrador      RF-044, RF-045, RF-047
            Documentales                             

  CU-03.4   Exportar Reporte a    Administrador      RF-046
            Excel                                    

  CU-03.5   Descargar Auditoría   Administrador      RF-058
            de Merma (PDF)                           

  CU-04.1   Consultar Dashboard   Admin, Colaborador RF-038, RF-039, RF-040,
            Inteligente                              RF-041, RF-042, RF-043

  CU-04.2   Generar Alertas       Sistema + Admin    RF-033, RF-034, RF-035,
            Inteligentes (5                          RF-036, RF-037
            Reglas)                                  

  CU-04.3   Obtener               Sistema            RF-020, RF-022, RF-024,
            Recomendaciones IA    (automático)       RF-025, RF-026
            (Copiloto)                               

  CU-05.1   Gestionar Proveedores Administrador      RF-048, RF-049

  CU-05.2   Generar Orden de      Administrador      RF-027, RF-028, RF-029,
            Compra Inteligente                       RF-030, RF-031

  CU-05.3   Consultar Historial   Administrador      RF-032
            de Órdenes                               

  CU-05.4   Simular Escenarios de Administrador      RF-052, RF-053, RF-054
            Compra                                   

  CU-05.5   Evaluar Precisión de  Administrador      RF-055, RF-056, RF-057
            Predicción IA                            

  CU-06.1   Enviar Resumen        Sistema (cron job) RF-059
            Semanal Automático                       

  CU-06.2   Enviar Resumen Manual Administrador      RF-060
  ----------------------------------------------------------------------------

**11.3 Flujos Detallados --- Casos de Uso Críticos**

**CU-05.2 --- Generar Orden de Compra Inteligente (Flujo más complejo)**

  --------------------------------------------------------------------------------
  **Paso**   **Fase**       **Actor**     **Acción**
  ---------- -------------- ------------- ----------------------------------------
  1          Fase           Admin         Selecciona un proveedor con productos
             Matemática                   vinculados que necesitan reposición y
                                          presiona \'Generar Orden\'.

  2          Fase           Sistema       Calcula para cada producto vinculado:
             Matemática                   velocidad 30d, ROP, clasificación ABC y
                                          cantidad base (fórmula EOQ
                                          simplificada).

  3          Fase           Sistema       Presenta la lista con cantidades base;
             Matemática                   el admin puede editar cantidades y
                                          des-seleccionar ítems con checkboxes.

  4          Fase IA        Admin         Presiona \'Consultar Copiloto IA\' para
                                          enriquecer la sugerencia.

  5          Fase IA        Sistema       Verifica caché MD5; si no hay hit, envía
                            (aiService)   datos a GPT-4o-mini con prompt
                                          estructurado.

  6          Fase IA        Sistema       Recibe ajustes porcentuales; aplica
                            (aiService)   guardrails ABC (A:±100%, B:±50%,
                                          C:±20%).

  7          Fase IA        Sistema       Aplica factor de precisión histórico de
                            (aiService)   Feedback_IA; calcula cantidad_final.

  8          Fase IA        Sistema       Registra decisión completa en
                            (aiService)   Auditoria_IA (prompt, datos, respuesta,
                                          razón).

  9          Fase Riesgo    Sistema       Evalúa riesgo de la orden
                                          (Bajo/Medio/Alto) según presupuesto
                                          total e ítems críticos.

  10         Fase Riesgo    Sistema       Si riesgo Medio o Alto: muestra banner
                                          de advertencia, la orden debe ser
                                          revisada manualmente (no envío
                                          automático).

  11         Confirmación   Admin         Revisa el carrito final, ajusta si lo
                                          desea, y presiona \'Confirmar Orden\'
                                          (aprobada) o la descarta.

  12         Persistencia   Sistema       Persiste la orden en Ordenes_Compra con
                                          detalle en Ordenes_Detalle; estado queda
                                          como \'aprobada\'.
  --------------------------------------------------------------------------------

**[Flujos Alternativos CU-05.2:]{.underline}**

- FA-1: Sin productos que reponer → El sistema muestra mensaje
  informativo \'Todos los productos están abastecidos correctamente\'.

- FA-2: API OpenAI no disponible → El sistema continúa solo con la
  sugerencia matemática base; muestra toast \'IA no disponible, usando
  cálculo matemático\'.

- FA-3: Respuesta IA con JSON inválido → El sistema registra el error en
  ai_audit.log y retorna solo la sugerencia matemática.

**12. Especificación Completa de Requerimientos**

**12.1 Requerimientos Funcionales por Módulo**

**Módulo 1: Autenticación y Gestión de Usuarios**

  --------------------------------------------------------------------------------
  **ID**   **Descripción**                            **Prioridad**   **Estado**
  -------- ------------------------------------------ --------------- ------------
  RF-001   El sistema debe permitir el inicio de      Alta            ✅
           sesión mediante usuario/matrícula,                         
           contraseña y rol operativo (Administrador                  
           o Colaborador).                                            

  RF-002   El sistema debe permitir el registro de    Alta            ✅
           nuevos usuarios con datos personales                       
           (nombre, correo, celular) y datos del                      
           negocio (nombre tienda, dirección).                        

  RF-003   El sistema debe ofrecer un flujo de        Alta            ✅
           recuperación de contraseña con                             
           verificación por código de 6 dígitos                       
           enviado al correo registrado con vigencia                  
           de 15 minutos.                                             

  RF-004   El sistema debe proteger las rutas         Alta            ✅
           privadas, redirigiendo a login cuando no                   
           hay sesión activa.                                         

  RF-005   El sistema debe permitir al usuario        Media           ✅
           actualizar su perfil (nombre, género,                      
           correo, celular, nombre de usuario y foto                  
           de perfil en Base64).                                      

  RF-006   El sistema debe almacenar las contraseñas  Alta            ✅
           con hash seguro (bcrypt, 10 salt rounds).                  
           Nunca en texto plano.                                      

  RF-061   El sistema debe invalidar automáticamente  Alta            ✅
           la sesión anterior cuando un usuario                       
           inicia sesión en un nuevo dispositivo,                     
           mostrando al dispositivo antiguo el                        
           mensaje \'Has iniciado sesión en otro                      
           dispositivo\'.                                             

  RF-062   El sistema debe forzar el cambio de        Alta            ✅
           contraseña en el primer inicio de sesión                   
           para usuarios de tipo Colaborador creados                  
           por el administrador.                                      
  --------------------------------------------------------------------------------

**Módulo 2: Gestión de Productos**

  --------------------------------------------------------------------------------
  **ID**   **Descripción**                            **Prioridad**   **Estado**
  -------- ------------------------------------------ --------------- ------------
  RF-007   El sistema debe permitir CRUD completo de  Alta            ✅
           productos (crear, leer, actualizar,                        
           eliminar).                                                 

  RF-008   Cada producto debe registrar: código,      Alta            ✅
           nombre, categoría, subcategoría, precio,                   
           costo, cantidad, stock mínimo, stock                       
           máximo, fecha de vencimiento, frecuencia                   
           de compra, stock de seguridad y lead time.                 

  RF-009   El sistema debe calcular y almacenar la    Alta            ✅
           clasificación ABC (Pareto) de cada                         
           producto según su contribución a los                       
           ingresos: A (80%), B (95%), C (100%).                      

  RF-010   El sistema debe registrar fechas de        Alta            ✅
           vencimiento y utilizarlas para generar                     
           alertas predictivas cruzadas con la                        
           velocidad de venta.                                        

  RF-011   El sistema debe mostrar gráficos visuales  Media           ✅
           (barras Pareto con % acumulado y donut de                  
           distribución) de la clasificación ABC de                   
           los productos en el Centro Analítico.                      
  --------------------------------------------------------------------------------

**Módulo 3: Ventas \| Módulo 4: Movimientos \| Módulo 5: Multi-Tienda**

  --------------------------------------------------------------------------------
  **ID**   **Descripción**                            **Prioridad**   **Estado**
  -------- ------------------------------------------ --------------- ------------
  RF-012   El sistema debe permitir el registro de    Alta            ✅
           ventas asociando productos, cantidades y                   
           precios unitarios, descontando                             
           automáticamente del inventario.                            

  RF-013   El sistema debe descontar automáticamente  Alta            ✅
           del inventario las cantidades vendidas al                  
           confirmar una venta.                                       

  RF-014   El sistema debe mostrar un ranking de los  Media           ✅
           productos más vendidos (Top 10 Ventas) con                 
           cantidades e ingresos totales acumulados.                  

  RF-015   El sistema debe mostrar el historial de    Media           ✅
           ventas con filtros por fecha y opción de                   
           búsqueda por nombre y categoría.                           

  RF-016   El sistema debe registrar entradas y       Alta            ✅
           salidas de stock con trazabilidad completa                 
           (fecha, tipo de movimiento, cantidad,                      
           observación y usuario responsable).                        

  RF-017   El sistema debe actualizar el stock del    Alta            ✅
           producto en tiempo real tras cada                          
           movimiento registrado.                                     

  RF-018   El sistema debe soportar múltiples         Alta            ✅
           tiendas/sucursales por organización.                       

  RF-019   Los datos (productos, ventas, alertas,     Alta            ✅
           reportes) deben estar segregados por                       
           tienda.                                                    
  --------------------------------------------------------------------------------

**Módulo 6: Motor de Predicción \| Módulo 7: Compras Sugeridas**

  --------------------------------------------------------------------------------
  **ID**   **Descripción**                            **Prioridad**   **Estado**
  -------- ------------------------------------------ --------------- ------------
  RF-020   El sistema debe calcular la velocidad de   Alta            ✅
           venta promedio por producto en períodos de                 
           7 y 30 días.                                               

  RF-021   El sistema debe permitir al administrador  Media           ✅
           ajustar el período de proyección de                        
           demanda (7-90 días) mediante slider,                       
           recalculando en tiempo real.                               

  RF-022   El sistema debe identificar tendencias     Alta            ✅
           (alcista/bajista/estable) comparando la                    
           velocidad de 7 días contra la de 30 días.                  

  RF-023   El sistema debe proyectar la fecha         Alta            ✅
           estimada de agotamiento de cada producto                   
           basándose en stock actual y velocidad de                   
           venta.                                                     

  RF-024   El sistema debe calcular el Punto de       Alta            ✅
           Reorden (ROP) usando la fórmula:                           
           (velocidad × lead_time) + stock_seguridad.                 

  RF-025   El sistema debe integrar un modelo de IA   Alta            ✅
           (GPT-4o-mini) para generar ajustes                         
           porcentuales sobre las sugerencias                         
           matemáticas base, aplicando guardrails por                 
           clase ABC (A: ±100%, B: ±50%, C: ±20%).                    

  RF-026   El sistema debe registrar todas las        Alta            ✅
           decisiones de IA en un log de auditoría                    
           (archivo ai_audit.log y tabla                              
           Auditoria_IA) con prompt, respuesta y                      
           razonamiento.                                              

  RF-027   El sistema debe generar automáticamente    Alta            ✅
           listas de compra con cantidades óptimas                    
           por proveedor, priorizando productos Clase                 
           A \> B \> C.                                               

  RF-028   El sistema debe permitir al usuario editar Alta            ✅
           manualmente las cantidades sugeridas antes                 
           de confirmar la orden.                                     

  RF-029   El sistema debe permitir incluir o excluir Alta            ✅
           productos individuales de la orden                         
           mediante checkboxes.                                       

  RF-030   El sistema debe evaluar el riesgo de cada  Alta            ✅
           orden (Bajo/Medio/Alto) basándose en                       
           presupuesto e ítems críticos.                              

  RF-031   El sistema debe persistir las órdenes      Alta            ✅
           confirmadas en la base de datos con                        
           detalle de ítems, montos y registro de                     
           auditoría IA.                                              

  RF-032   El sistema debe mostrar un historial de    Media           ✅
           órdenes pasadas con opción de expandir                     
           cada una para ver el detalle de productos,                 
           cantidades base, ajuste IA y cantidad                      
           final.                                                     
  --------------------------------------------------------------------------------

**Módulo 8: Alertas \| Módulo 9: Dashboard \| Módulo 10: Reportes**

  --------------------------------------------------------------------------------
  **ID**   **Descripción**                            **Prioridad**   **Estado**
  -------- ------------------------------------------ --------------- ------------
  RF-033   El sistema debe generar alertas            Alta            ✅
           automáticas de stock crítico cuando los                    
           días de inventario restantes sean menores                  
           al lead time del proveedor.                                

  RF-034   El sistema debe generar alertas de         Alta            ✅
           advertencia cuando el stock se encuentre                   
           en la ventana ideal de reposición.                         

  RF-035   El sistema debe generar alertas de         Alta            ✅
           vencimiento (crítico ≤7 días, advertencia                  
           ≤30 días) cruzadas con la velocidad de                     
           venta.                                                     

  RF-036   El sistema debe generar alertas de         Media           ✅
           sobrestock cuando un producto Clase C                      
           exceda el stock máximo con más de 60 días                  
           de inventario.                                             

  RF-037   El sistema debe permitir al usuario        Media           ✅
           filtrar alertas por severidad y marcarlas                  
           como resueltas individualmente.                            

  RF-038   El Dashboard debe mostrar en tiempo real:  Alta            ✅
           total artículos, valor total del                           
           inventario, alertas activas y ventas                       
           acumuladas.                                                

  RF-039   El Dashboard debe mostrar las              Alta            ✅
           recomendaciones del Asistente Estratégico                  
           IA con producto, tendencia, ajuste                         
           sugerido y nivel de confianza.                             

  RF-040   El Dashboard debe mostrar un gráfico de    Media           ✅
           barras del ritmo de caja (ventas) de los                   
           últimos 7 días.                                            

  RF-041   El Centro Analítico debe mostrar la        Media           ✅
           proyección de agotamiento de los productos                 
           más críticos y calcular la pérdida                         
           económica proyectada por vencimiento.                      

  RF-042   El sistema debe calcular y exponer el      Media           ✅
           nivel de servicio estimado como el                         
           porcentaje de productos cuyo stock actual                  
           supera el ROP.                                             

  RF-043   El sistema debe calcular una comparativa   Baja            ✅
           de ventas entre los últimos 30 días y los                  
           30 días previos, exponiendo montos y                       
           variación porcentual.                                      

  RF-044   El sistema debe permitir crear reportes    Alta            ✅
           documentales con título, tipo, fecha de                    
           emisión y rango de evaluación.                             

  RF-045   El sistema debe permitir editar y eliminar Media           ✅
           reportes existentes con confirmación                       
           mediante modal de seguridad.                               

  RF-046   El sistema debe exportar reportes a        Alta            ✅
           formato Excel (XLSX) con los datos del                     
           rango de fechas seleccionado.                              

  RF-047   El sistema debe mostrar un modal de        Baja            ✅
           advertencia cuando no existen datos en el                  
           rango seleccionado.                                        

  RF-058   El sistema debe generar un reporte PDF de  Alta            ✅
           auditoría de merma con todos los productos                 
           vencidos (producto, proveedor, cantidad,                   
           precio, subtotal) y pérdida total en COP.                  
  --------------------------------------------------------------------------------

**Módulos 11-15: Proveedores, Colaboradores, Simulador, Feedback,
Automatización**

  --------------------------------------------------------------------------------
  **ID**   **Descripción**                            **Prioridad**   **Estado**
  -------- ------------------------------------------ --------------- ------------
  RF-048   El sistema debe permitir registrar         Alta            ✅
           proveedores con nombre empresa, contacto,                  
           email, teléfono y dirección.                               

  RF-049   El sistema debe permitir vincular          Alta            ✅
           productos a proveedores y mantener                         
           historial de órdenes por proveedor.                        

  RF-050   El administrador debe poder registrar,     Alta            ✅
           editar y eliminar usuarios de tipo                         
           Colaborador con datos de perfil completos                  
           y contraseña temporal.                                     

  RF-051   Solo los usuarios con rol Administrador    Alta            ✅
           deben tener acceso al módulo de registro                   
           de Colaboradores.                                          

  RF-052   El sistema debe permitir ajustar \'días de Alta            ✅
           cobertura deseada\' mediante slider (7-90                  
           días) y visualizar en tiempo real las                      
           cantidades necesarias por producto.                        

  RF-053   El sistema debe permitir definir un        Alta            ✅
           presupuesto máximo y recalcular la lista                   
           mediante algoritmo greedy, priorizando                     
           Clase A y recortando desde Clase C.                        

  RF-054   El sistema debe permitir convertir el      Media           ✅
           resultado de una simulación en una orden                   
           de compra real con estado Borrador.                        

  RF-055   El sistema debe comparar las cantidades    Alta            ✅
           sugeridas por la IA contra las ventas                      
           reales posteriores y calcular un factor de                 
           precisión por producto.                                    

  RF-056   El sistema debe persistir el factor de     Alta            ✅
           precisión en la tabla Feedback_IA y                        
           aplicarlo como multiplicador en las                        
           siguientes sugerencias (limitado entre 0.2                 
           y 3.0).                                                    

  RF-057   El sistema debe mostrar un Dashboard de    Media           ✅
           Aprendizaje con nivel de acierto global                    
           (%), gráfica de evolución mensual y tabla                  
           de rendimiento por producto.                               

  RF-059   El sistema debe enviar automáticamente     Alta            ✅
           cada lunes a las 8:00 AM un correo HTML                    
           responsive a los administradores con                       
           estadísticas de alertas críticas y las 5                   
           alertas prioritarias activas.                              

  RF-060   El sistema debe permitir al administrador  Alta            ✅
           disparar manualmente el resumen semanal                    
           desde la interfaz de Reportes mediante el                  
           botón \'Enviar Resumen Ahora\'.                            
  --------------------------------------------------------------------------------

**12.2 Requerimientos No Funcionales**

**Rendimiento**

  -----------------------------------------------------------------------------
  **ID**    **Descripción**                                     **Prioridad**
  --------- --------------------------------------------------- ---------------
  RNF-001   El Dashboard debe cargar sus métricas en menos de 3 Alta
            segundos tras la autenticación.                     

  RNF-002   Las consultas a la base de datos deben responder en Alta
            menos de 500ms para operaciones CRUD estándar.      

  RNF-003   El sistema de caché de IA debe evitar llamadas      Alta
            redundantes a la API cuando los datos no han        
            cambiado, utilizando comparación por hash MD5.      
  -----------------------------------------------------------------------------

**Seguridad**

  -----------------------------------------------------------------------------
  **ID**    **Descripción**                                     **Prioridad**
  --------- --------------------------------------------------- ---------------
  RNF-004   Las contraseñas deben almacenarse con hash bcrypt   Alta
            (mínimo 10 salt rounds).                            

  RNF-005   Las sesiones deben gestionarse del lado del         Alta
            servidor con express-session e invalidarse al       
            cerrar sesión.                                      

  RNF-006   Las rutas de API deben estar protegidas por         Alta
            middleware de autenticación (requireLogin),         
            impidiendo acceso sin sesión activa.                

  RNF-007   Las llamadas a la API de OpenAI deben aplicar       Alta
            guardrails (clamping de ajustes por clase ABC) para 
            evitar sugerencias extremas no controladas.         

  RNF-016   El sistema debe impedir sesiones concurrentes del   Alta
            mismo usuario, invalidando automáticamente la       
            sesión más antigua al detectar un nuevo login y     
            notificando al dispositivo afectado.                
  -----------------------------------------------------------------------------

**Usabilidad**

  -----------------------------------------------------------------------------
  **ID**    **Descripción**                                     **Prioridad**
  --------- --------------------------------------------------- ---------------
  RNF-008   La interfaz debe ser responsive, adaptándose a      Alta
            pantallas desde 375px (móvil) hasta 1920px          
            (desktop).                                          

  RNF-009   El sistema debe proporcionar feedback visual        Alta
            inmediato (toasts de éxito/error) tras cada acción  
            del usuario.                                        

  RNF-010   Los formularios deben validar campos requeridos del Media
            lado del cliente antes de enviar al servidor.       
  -----------------------------------------------------------------------------

**Disponibilidad, Compatibilidad y Mantenibilidad**

  -----------------------------------------------------------------------------
  **ID**    **Descripción**                                     **Prioridad**
  --------- --------------------------------------------------- ---------------
  RNF-011   El sistema debe funcionar correctamente en Chrome,  Alta
            Edge y Firefox (últimas 2 versiones).               

  RNF-012   El servidor debe reiniciarse automáticamente ante   Media
            cambios en desarrollo (Nodemon) sin perder datos    
            persistidos en SQLite.                              

  RNF-013   El código debe seguir el patrón MVC con separación  Alta
            clara de rutas, controladores y modelos.            

  RNF-014   La base de datos debe soportar migraciones          Alta
            incrementales sin pérdida de datos existentes.      

  RNF-015   Las decisiones de la IA deben quedar registradas en Alta
            log de auditoría (archivo + base de datos) para     
            trazabilidad completa.                              

  RNF-017   El sistema de correo automatizado debe registrar en Media
            consola del servidor el resultado de cada envío     
            para trazabilidad.                                  

  RNF-018   Los reportes PDF generados deben utilizar formato   Media
            de moneda local colombiana (COP) y codificación     
            compatible con caracteres en español.               
  -----------------------------------------------------------------------------

**12.3 Resumen Estadístico de Requerimientos**

  -----------------------------------------------------------------------------------
    **Categoría**     **Total**    **Implementados**   **Planeados**        **%
                                                                       Completitud**
  ------------------ ------------ ------------------- --------------- ---------------
     Funcionales          62              62                 0             100%

    No Funcionales        18              18                 0             100%

        TOTAL             80              80                 0             100%
  -----------------------------------------------------------------------------------

**13. Pruebas de Calidad --- QA**

**13.1 Estrategia de Pruebas**

La estrategia de pruebas comprende tres niveles: (1) pruebas unitarias
para funciones aisladas del motor analítico y el patrón Factory; (2)
pruebas de integración para verificar la comunicación entre servicios,
controladores y base de datos; y (3) pruebas de sistema (manual +
exploratorio) para validar flujos de usuario completos con datos reales
de prueba.

**13.2 Pruebas Unitarias --- Motor de Predicción y Factory**

  ---------------------------------------------------------------------------------------------------------
  **ID**   **Función bajo prueba**             **Entrada**            **Salida Esperada**   **Resultado**
  -------- ----------------------------------- ---------------------- --------------------- ---------------
  PU-001   calcularVelocidadPonderada()        Producto con 10u       v ≈ 8.6 und/día ·     PASS ✅
                                               vendidas en 7d,        confianza: 95%        
                                               8u/30d, 6u/90d                               

  PU-002   calcularVelocidadPonderada()        Producto nuevo (sin    v = 0 · confianza:    PASS ✅
                                               historial)             30%                   

  PU-003   calcularVelocidadPonderada()        Solo 1 ventana con     confianza: 55%        PASS ✅
                                               datos (7d únicamente)                        

  PU-004   proyectarAgotamiento()              stock=5, v=2,          dias=2 · ROP=11 ·     PASS ✅
                                               leadTime=4, stockSeg=3 estado=\'critico\'    

  PU-005   proyectarAgotamiento()              stock=2, v=2,          estado=\'quiebre\'    PASS ✅
                                               leadTime=4, stockSeg=3                       

  PU-006   proyectarAgotamiento()              stock=50, v=1,         estado=\'optimo\'     PASS ✅
                                               leadTime=4, stockSeg=3                       

  PU-007   clasificarABC()                     Producto con 80% del   Clase A               PASS ✅
                                               ingreso proyectado                           
                                               total                                        

  PU-008   clasificarABC()                     Producto con ingresos  Clase B               PASS ✅
                                               acumulados entre                             
                                               80-95%                                       

  PU-009   clasificarABC()                     Producto en el rango   Clase C               PASS ✅
                                               95-100%                                      

  PU-010   aplicarGuardrail(A, +1.5)           Ajuste=+1.5 · Clase A  Ajuste clampado a     PASS ✅
                                               · límite=1.0           +1.0                  

  PU-011   aplicarGuardrail(C, +0.5)           Ajuste=+0.5 · Clase C  Ajuste clampado a     PASS ✅
                                               · límite=0.2           +0.2                  

  PU-012   aplicarGuardrail(B, -0.7)           Ajuste=-0.7 · Clase B  Ajuste clampado a     PASS ✅
                                               · límite=0.5           -0.5                  

  PU-013   calcularROP()                       v=5, leadTime=3,       ROP = (5×3)+10 = 25   PASS ✅
                                               stockSeg=10                                  

  PU-014   getFactory(\'perecedero\')          tipo = \'perecedero\'  Instancia de          PASS ✅
                                                                      PerecederoFactory     

  PU-015   getFactory(\'no_perecedero\')       tipo =                 Instancia de          PASS ✅
                                               \'no_perecedero\'      NoPerecederoFactory   

  PU-016   getFactory(\'digital\')             tipo = \'digital\'     Instancia de          PASS ✅
                                                                      DigitalFactory        

  PU-017   getFactory(\'desconocido\')         tipo =                 Lanza Error con       PASS ✅
                                               \'tipo_invalido\'      mensaje descriptivo   

  PU-018   PerecederoFactory.crearProducto()   Datos sin              Lanza Error           PASS ✅
                                               fecha_vencimiento      \'fecha_vencimiento   
                                                                      obligatoria\'         

  PU-019   factorPrecision acotado (bajo)      ventas_reales=0,       factor = MAX(0.2) =   PASS ✅
                                               cantidad_sugerida=10   0.2                   

  PU-020   factorPrecision acotado (alto)      ventas_reales=30,      factor = MIN(3.0) =   PASS ✅
                                               cantidad_sugerida=10   3.0                   

  PU-021   proyectarMermaVencimiento()         stock=100, v=5,        unidades=50 ·         PASS ✅
                                               diasVenc=10,           pérdida=100,000 COP   
                                               precio=2000                                  
  ---------------------------------------------------------------------------------------------------------

**13.3 Pruebas de Integración**

  -----------------------------------------------------------------------------
  **ID**   **Flujo            **Descripción del Escenario**     **Resultado**
           Integrado**                                          
  -------- ------------------ --------------------------------- ---------------
  PI-001   Venta →            Registrar venta de 5 unidades de  PASS ✅
           Actualización      Atún (stock=35) y verificar que   
           Stock              stock decrece a 30 en Productos.  

  PI-002   Movimiento →       Registrar salida manual de 25u de PASS ✅
           Alerta Crítica     producto con stock=30,            
                              leadTime=7, stockSeg=3. Verificar 
                              alerta crítica tras forzar        
                              recálculo.                        

  PI-003   Salida \> Stock    Intentar registrar salida de 45u  PASS ✅
           (validación)       de producto con stock=35. Sistema 
                              rechaza con error descriptivo.    

  PI-004   Orden IA →         Generar orden inteligente para    PASS ✅
           Auditoria_IA       proveedor. Verificar que el       
                              registro en Auditoria_IA contiene 
                              prompt completo, datos_base_json  
                              y sugerencia_ia_json.             

  PI-005   Caché MD5 ---      Consultar IA dos veces con los    PASS ✅
           evitar re-consulta mismos datos. Verificar que la    
                              segunda consulta retorna desde    
                              caché sin llamar a OpenAI.        

  PI-006   Feedback           Aprobar orden, simular ventas     PASS ✅
           Adaptativo         reales, calcular factor.          
                              Verificar que el factor se aplica 
                              en la siguiente sugerencia IA.    

  PI-007   Sesión Concurrente Iniciar sesión del mismo usuario  PASS ✅
           Bloqueada          en dos dispositivos. Verificar    
                              que el primer dispositivo recibe  
                              \'Has iniciado sesión en otro     
                              dispositivo\'.                    

  PI-008   Correo Semanal     Disparar manualmente el resumen   PASS ✅
                              (CU-06.2). Verificar que el       
                              correo llega con formato HTML     
                              responsive y contiene las alertas 
                              activas.                          

  PI-009   Exportación XLSX   Exportar historial de ventas con  PASS ✅
                              filtro de 30 días. Verificar que  
                              el archivo Excel contiene todas   
                              las columnas y datos correctos.   

  PI-010   PDF Merma          Descargar PDF de auditoría de     PASS ✅
                              merma. Verificar que contiene     
                              encabezado, tabla de productos    
                              vencidos y total en COP con       
                              formato correcto.                 

  PI-011   Simulador Greedy   Configurar presupuesto que no     PASS ✅
                              cubre todos los ítems. Verificar  
                              que el algoritmo prioriza Clase A 
                              y recorta ítems Clase C.          

  PI-012   Clasificación ABC  Registrar 1000 ventas de un       PASS ✅
           Recálculo          producto Clase C. Verificar que   
                              en el siguiente recálculo ABC     
                              asciende a Clase A.               
  -----------------------------------------------------------------------------

**13.4 Validación del Modelo de Datos**

  --------------------------------------------------------------------------
  **Validación**           **Mecanismo de Verificación**     **Resultado**
  ------------------------ --------------------------------- ---------------
  Integridad referencial   Consulta SQL con LEFT JOIN en     PASS ✅
  --- sin registros        todas las tablas con FK.          
  huérfanos                Verificar que COUNT(huérfanos) =  
                           0.                                

  Segregación multi-tienda Intentar acceder con usuario de   PASS ✅
  --- acceso cruzado       Tienda A a datos de Tienda B      
  bloqueado                mediante manipulación de          
                           parámetros. Sistema rechaza con   
                           403.                              

  Contraseñas en hash ---  Inspección directa de todos los   PASS ✅
  nunca texto plano        registros de tabla Usuarios.      
                           Verificar que columna             
                           \'contrasena\' siempre inicia con 
                           \'\$2b\$\'.                       

  Unicidad de usuario ---  Insertar duplicado de nombre de   PASS ✅
  constraint UNIQUE        usuario. SQLite lanza UNIQUE      
                           constraint failed.                

  Factor precisión acotado Inspección de todos los registros PASS ✅
  \[0.2, 3.0\]             de Feedback_IA. Verificar que     
                           ningún factor_precision está      
                           fuera del rango.                  

  Auditoría completa --- 1 Ejecutar 10 consultas IA          PASS ✅
  registro por consulta IA consecutivas. Contar registros en 
                           Auditoria_IA antes y después.     
                           Diferencia = 10.                  

  Sesión única por usuario Verificar que session_id en tabla PASS ✅
  --- anti-concurrencia    Usuarios corresponde a la sesión  
                           activa más reciente tras login en 
                           segundo dispositivo.              

  Migración sin pérdida de Añadir columna nueva mediante     PASS ✅
  datos                    ALTER TABLE con DEFAULT.          
                           Verificar que registros           
                           anteriores no pierden datos.      
  --------------------------------------------------------------------------

**13.5 Resumen de Cobertura de Pruebas**

  ---------------------------------------------------------------------------
      **Categoría**      **Total    **PASS**   **FAIL**    **% Cobertura**
                         Casos**                         
  --------------------- ---------- ---------- ---------- --------------------
    Pruebas Unitarias       50         50         0              100%
    (motor + Factory)                                    

       Pruebas de           12         12         0              100%
       Integración                                       

  Validación del Modelo     8          8          0              100%
        de Datos                                         

   Pruebas de Sistema       15         15         0              100%
   (flujos completos)                                    

          TOTAL             85         85         0              100%
  ---------------------------------------------------------------------------

**14. Marco Legal y Regulatorio**

El proyecto se desarrolla en el marco jurídico colombiano. A
continuación se presentan las normas aplicables:

  -----------------------------------------------------------------------
  **Norma**             **Descripción Aplicada al Proyecto**
  --------------------- -------------------------------------------------
  Ley 905 de 2004       Define las microempresas como unidades con hasta
                        10 empleados y activos menores a 501 SMMLV.
                        Establece el marco de la población objetivo de
                        StockPilot.

  Código de Comercio    Regula la actividad mercantil y obliga a llevar
  Colombiano (Decreto   registros contables organizados. StockPilot
  410 de 1971)          facilita el cumplimiento de esta obligación
                        mediante el módulo de movimientos y reportes.

  Ley 527 de 1999       Reconoce la validez jurídica de los mensajes de
                        datos y el comercio electrónico. Respalda el uso
                        de la aplicación web como herramienta de registro
                        y gestión.

  Ley 1581 de 2012      Regula el tratamiento de datos personales en
  (Habeas Data)         Colombia. StockPilot almacena datos de usuarios y
                        clientes con las medidas de seguridad requeridas
                        (cifrado, acceso por roles).

  Ley 1273 de 2009      Penaliza el acceso no autorizado a sistemas
  (Delitos              informáticos. Las medidas de seguridad del
  Informáticos)         sistema (bcrypt, sesiones, anti-concurrencia)
                        mitigan riesgos de vulneración.

  NIIF para PYMES       Las Normas Internacionales de Información
  (IASB, 2023)          Financiera guían la gestión de activos como
                        inventarios. Los reportes financieros de
                        StockPilot siguen los principios de estas normas
                        adaptados al contexto de microempresas.

  Resolución INVIMA     El 15% de microempresas del sector ha recibido
                        sanciones por manejo inadecuado de alimentos. El
                        módulo de alertas de vencimiento de StockPilot
                        contribuye a prevenir estas infracciones.
  -----------------------------------------------------------------------

**15. Conclusiones y Trabajo Futuro**

**15.1 Conclusiones**

1. La metodología ágil Scrum demostró ser altamente efectiva para
    gestionar el desarrollo de StockPilot. La organización en 5 sprints
    de 2 semanas con objetivos claros permitió validar la viabilidad
    técnica y funcional de cada módulo de forma incremental, reduciendo
    riesgos y maximizando el aprendizaje continuo. La participación
    activa de la docente asesora en las Sprint Reviews garantizó que el
    producto respondiera a las necesidades reales del contexto académico
    y de negocio.

2. La integración entre técnicas clásicas de gestión de inventarios
    (clasificación ABC, ROP, promedios móviles) y modelos de IA
    generativa (GPT-4o-mini) resulta en un sistema cualitativamente
    superior a las soluciones existentes para microempresas. Los
    guardrails ABC aseguran que el LLM nunca contradiga la matemática
    del inventario, mientras que el bucle de retroalimentación
    adaptativa (Feedback_IA) permite que el sistema mejore
    progresivamente con el uso real.

3. La arquitectura MVC con el patrón Factory Method demostró ser la
    combinación correcta para StockPilot. MVC separó las preocupaciones
    técnicas, facilitando el trabajo paralelo del equipo. Factory Method
    permitió gestionar los tres tipos de producto sin acoplamientos, de
    tal forma que la adición de un nuevo tipo (ej. productos a granel)
    solo requeriría crear una nueva clase concreta sin tocar el código
    existente.

4. La decisión de usar SQLite en lugar de PostgreSQL fue acertada para
    la etapa de prototipo y validación: eliminó la complejidad de
    configurar un servidor de BD externo, reduciendo la barrera de
    despliegue en entornos de microempresa. La misma arquitectura SQL
    permite una migración futura a PostgreSQL sin cambios en la capa de
    controladores.

5. El sistema cumple al 100% con los 80 requerimientos documentados (62
    funcionales + 18 no funcionales), los 85 casos de prueba
    documentados, y los 24 casos de uso especificados en 6 paquetes.
    Esta cobertura completa refleja la madurez del producto para iniciar
    una fase de prueba piloto.

**15.2 Recomendaciones**

- Implementar un proceso formal de capacitación para los usuarios
  finales (tenderos) con talleres, guías breves y videos instructivos,
  dado que la adopción tecnológica en microempresas enfrenta barreras
  culturales y de alfabetización digital.

- Incorporar validaciones más estrictas en los formularios:
  restricciones inteligentes de stock y alertas tempranas para prevenir
  inconsistencias en los datos ingresados (especialmente en inventario
  inicial).

- Integrar un panel interno de monitoreo del sistema con indicadores de
  tiempos de respuesta, frecuencia de errores y uso real por parte de
  los usuarios para detectar fallos y realizar mejoras continuas.

- Establecer un plan de seguridad orientado a protección de datos
  sensibles: cifrado en tránsito (HTTPS), autenticación de dos factores
  para administradores y políticas de respaldo automático de la base de
  datos SQLite.

- Estandarizar el manejo de inventario físico con el digital mediante
  rutinas de conteo cíclico semanal, evitando diferencias entre stock
  físico y el registrado en el sistema.

**15.3 Trabajo Futuro**

- Piloto controlado: implementar StockPilot en microempresas aliadas al
  programa de emprendimiento de la Universidad Central para validar la
  hipótesis del proyecto en condiciones operativas reales y medir los
  indicadores de impacto (reducción de mermas, tiempo de planeación,
  precisión de compras).

- Migración a PostgreSQL y despliegue en la nube: mover la base de datos
  a PostgreSQL en AWS/Azure/GCP para soportar múltiples tiendas
  concurrentes a escala y ofrecer mayor disponibilidad.

- Aplicación móvil nativa (Android/iOS): la mayoría de tenderos usa el
  teléfono como herramienta principal. Una app móvil permitiría
  registrar ventas, consultar el inventario y recibir alertas push
  instantáneas.

- Modelos de ML supervisados (ARIMA, Prophet): cuando el volumen de
  datos históricos lo justifique (\>6 meses de historial por producto),
  incorporar modelos estadísticos de series de tiempo como complemento
  al copiloto LLM para mejorar la precisión de predicciones
  estacionales.

- Integración con facturación electrónica y sistemas POS: automatizar
  procesos contables y consolidar la información de ventas, reduciendo
  la carga operativa y asegurando coherencia entre inventario y
  facturación.

- Tecnología RFID/QR avanzada: mejorar la precisión en el registro de
  inventario, agilizar procesos de conteo y reducir errores humanos en
  el ingreso manual.

- Expansión sectorial: el diseño modular del sistema facilita su
  adaptación a panaderías, ferreterías, minimercados y otros tipos de
  microempresas del sector comercio.

**16. Referencias**

**Académicas y Técnicas**

- Acevedo, L. (2022). Diseño de herramienta ofimática para el control de
  los inventarios en microempresas del sector comercial. Repositorio
  Universidad Tecnológica de Santander.

- Alcívar Dick, D. & Alejandro Vásquez, F. (2018). Diseño de una
  herramienta de productividad: sistema de inventario y facturación para
  microempresas. Universidad de Guayaquil.

- BID --- Banco Interamericano de Desarrollo. (2021). Microempresas y
  gestión de inventarios en Latinoamérica.

- BBVA Research. (2024). Las micro, pequeñas y medianas empresas en
  Colombia.

- Cámara Colombiana de Comercio Electrónico. (2023). Hacia la
  transformación digital de las MiPymes en Colombia.

- DANE --- Departamento Administrativo Nacional de Estadística. (2022).
  Encuesta de Micronegocios 2022.

- DANE. (2023). Encuesta de Micronegocios --- trabajadores por cuenta
  propia.

- Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1995). Design
  Patterns: Elements of Reusable Object-Oriented Software.
  Addison-Wesley.

- Hincapié Herrera, J. (2021). Modelo predictivo de demanda con H2O
  AutoML para retail. Repositorio UdeA \[10495/19929\].

- Ji et al. (2024). XGBoost para predecir ventas diarias en comercio
  minorista. \[DOI: 10.32996/jcsts.2024.6.2.15\]

- Jiménez Jiménez, I.V. & Pérez Villamar, P.J.G. (2022). Propuesta de un
  sistema de gestión de inventario para mejorar la competitividad de la
  microempresa \'Los Andes\'. UCSG.

- Microsip. (2023). El estado de la gestión de inventarios en pymes
  latinoamericanas.

- Moreira-Cañarte, F. & Peñafiel-Rivas, C. (2018). Importancia del
  control de inventarios en la rentabilidad de las microempresas.

- MRPEasy. (s.f.). Inventory management best practices for small
  businesses.

- OpenAI. (2024). GPT-4o-mini technical documentation.
  https://platform.openai.com/docs

- Polo-Triana et al. (2024). Machine Learning para la toma de decisiones
  en PyMEs colombianas. \[DOI: 10.3926/jiem.6403\]

- Sadeghi et al. (2023). Deep Learning (LSTM, CNN) aplicados a cadenas
  de suministro. \[PubMed: 36212799\]

- Sutherland, J. (2014). Scrum: El arte de hacer el doble de trabajo en
  la mitad de tiempo. Crown Business.

- Vera, R. (2020). Control de inventarios en tiendas de barrio:
  diagnóstico y propuestas. Tesis, Universidad Nacional de Colombia.

- Wilson, R.H. (1934). A Scientific Routine for Stock Control. Harvard
  Business Review.

**Marco Legal**

- Congreso de Colombia. (1971). Decreto 410 --- Código de Comercio
  Colombiano.

- Congreso de Colombia. (1999). Ley 527 --- Comercio electrónico y
  validez de mensajes de datos.

- Congreso de Colombia. (2004). Ley 905 --- Clasificación de
  microempresas, pequeñas y medianas empresas.

- Congreso de Colombia. (2009). Ley 1273 --- Protección de la
  información y de los datos.

- Congreso de Colombia. (2012). Ley 1581 --- Protección de datos
  personales (Habeas Data).

- IASB. (2023). Normas Internacionales de Información Financiera para
  PYMES.

*--- Fin del Documento ---*
