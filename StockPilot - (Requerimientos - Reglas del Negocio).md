 ![C:\\Users\\Carlos\\Desktop\\Física I\\logo.png][image1]

**Bases de Datos Avanzadas**

***StockPilot: Sistema Web de Gestión de Inventarios con Inteligencia Artificial Predictiva para Microempresas de Distribución de víveres en Bogotá*** 

Luis Alberto Diuche Peña

Jennifer López Vanegas

Profesor: Jorge Elicer Vargas Puerto

Facultad de Ingeniería y Ciencias Básicas

Universidad Central

Bogotá D.C

2026 \- 2

# **Requerimientos Funcionales y No Funcionales**

Los requerimientos del sistema se establecen a partir de las necesidades identificadas durante el análisis del problema y representan las condiciones y capacidades que deberá cumplir la solución propuesta. Estos constituyen la base para orientar el desarrollo, las pruebas y la validación del sistema. De acuerdo con la naturaleza de las necesidades identificadas, los requerimientos se clasifican en funcionales y no funcionales.

Los requerimientos funcionales describen las funciones y servicios que el sistema deberá proporcionar, así como las transformaciones que realizará sobre las entradas para generar las salidas correspondientes. Por otra parte, los requerimientos no funcionales establecen características y restricciones relacionadas con aspectos como rendimiento, seguridad, usabilidad, mantenimiento, disponibilidad, compatibilidad e interoperabilidad.

## **1.1 Requerimientos Funcionales**

Los requerimientos funcionales se organizan de acuerdo con los principales procesos y módulos que conforman el sistema.

**1.1.1. Módulo de autenticación y gestión de usuarios**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-001 | El sistema debe permitir a los usuarios iniciar sesión mediante sus credenciales (usuario, contraseña) y rol asignado (Administrador o Colaborador). | Alta |
| RF-002 | El sistema debe permitir registrar nuevos usuarios proporcionando sus datos personales nombre, correo, celular) y la información básica del negocio al que pertenecen (nombre tienda, dirección). | Alta |
| RF-003 | El sistema debe permitir recuperar el acceso a una cuenta mediante un mecanismo de verificación por código de 6 dígitos enviado al correo registrado. | Alta |
| RF-004 | El sistema debe restringir el acceso a las funcionalidades privadas a usuarios que no hayan iniciado sesión.	 | Alta |
| RF-005 | El sistema debe permitir a los usuarios actualizar la información de su perfil (nombre, género, correo, celular, nombre de usuario y foto de perfil) . | Media |
| RF-006 | El sistema debe almacenar las credenciales de acceso de manera segura. | Alta |
| RF-007 | El sistema debe impedir que una misma cuenta mantenga sesiones activas simultáneamente en diferentes dispositivos. | Alta |
| RF-008 | El sistema debe solicitar el cambio de contraseña durante el primer inicio de sesión de los usuarios creados por un administrador. | Alta |

### **1.1.2. Módulo de gestión de productos**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-009 | El sistema debe permitir crear, consultar, actualizar y eliminar productos. | Alta |
| RF-010 | El sistema debe permitir registrar para cada producto información como código, nombre, categoría, subcategoría, precio, costo, cantidad disponible, niveles mínimo y máximo de inventario, fecha de vencimiento, frecuencia de compra, stock de seguridad y tiempo de abastecimiento. | Alta |
| RF-011 | El sistema debe clasificar los productos mediante el método ABC (Pareto) de acuerdo con su contribución a los ingresos: A (80%), B (95%), C (100%). | Alta |
| RF-012 | El sistema debe registrar las fechas de vencimiento de los productos para permitir su seguimiento (alertas) y control. | Alta |
| RF-013 | El sistema debe presentar información gráfica relacionada con la clasificación ABC de los productos. | Media |

### **1.1.3. Módulo de gestión de ventas**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-014 | El sistema debe permitir registrar las ventas realizadas, asociando los productos, cantidades y precios correspondientes. | Alta |
| RF-015 | El sistema debe actualizar las existencias de los productos cuando se confirme una venta. | Alta |
| RF-016 | El sistema debe mostrar un ranking de los productos con mayor cantidad de unidades vendidas e ingresos generados | Media |
| RF-017 | El sistema debe permitir consultar el historial de ventas mediante filtros y búsqueda por fechas. | Media |

	

### **1.1.4. Módulo de control de movimientos de inventario**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-018 | El sistema debe permitir registrar entradas y salidas de inventario indicando la fecha, tipo de movimiento, cantidad, observación y usuario responsable. | Alta |
| RF-019 | El sistema debe actualizar las existencias de los productos después de registrar un movimiento de inventario. | Alta |

### **1.1.5. Módulo de gestión de tiendas**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-020 | El sistema debe permitir administrar múltiples tiendas o sucursales pertenecientes a una misma organización. | Alta |
| RF-021 | El sistema debe mantener separados los productos, ventas, inventarios, alertas y reportes correspondientes a cada tienda. | Alta |

### **1.1.6. Módulo de análisis y predicción de demanda**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-022 | El sistema debe calcular la velocidad promedio de venta de cada producto para diferentes períodos de análisis (de 7 y 30 días). | Alta |
| RF-023 | El sistema debe permitir al usuario administrador  establecer el período de proyección de demanda dentro de un rango definido. | Media |
| RF-024 | El sistema debe identificar la tendencia de comportamiento de cada producto como creciente, decreciente o estable, a partir de la comparación de períodos de venta (7 días contra 30 días). | Alta |
| RF-025 | El sistema debe estimar la fecha de agotamiento de cada producto basándose en las existencias disponibles y su comportamiento de venta. | Alta |
| RF-026 | El sistema debe calcular el punto de reorden (ROP) de cada producto usando la fórmula: ((velocidad × lead\_time) \+ stock\_seguridad) × factor\_ia, donde factor\_ia es un multiplicador de aprendizaje continuo (ver Módulo 1.1.14) que ajusta el ROP según la precisión histórica de las sugerencias para ese producto (1.0 por defecto si no hay historial de evaluaciones). | Alta |
| RF-027 | El sistema debe generar recomendaciones de ajuste sobre las cantidades de reabastecimiento a partir del análisis del comportamiento histórico de las ventas y las condiciones actuales del inventario a través de un modelo de IA. | Alta |
| RF-028 | El sistema debe registrar las recomendaciones generadas por el componente de análisis inteligente (IA) junto con los parámetros y resultados utilizados para su generación. | Alta |

### **1.1.7. Módulo de compras sugeridas**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-029 | El sistema debe generar listas de compra sugeridas a partir de las necesidades de reabastecimiento identificadas para los productos, priorizando productos Clase A \> B \> C. | Alta |
| RF-030 | El sistema debe permitir al usuario modificar las cantidades sugeridas antes de confirmar una orden de compra. | Alta |
| RF-031 | El sistema debe permitir incluir o excluir productos de una orden de compra sugerida. | Alta |
| RF-032 | El sistema debe clasificar el nivel de riesgo de una orden de compra (Bajo/Medio/Alto) de acuerdo con los criterios establecidos para el presupuesto y los productos críticos. | Alta |
| RF-033 | El sistema debe almacenar las órdenes de compra confirmadas junto con el detalle de los productos, cantidades y valores correspondientes. | Alta |
| RF-034 | El sistema debe permitir consultar el historial de órdenes de compra y visualizar el detalle de productos, cantidades base, ajuste IA y cantidad final. | Media |

### **1.1.8. Módulo de alertas inteligentes**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-035 | El sistema debe generar alertas cuando las existencias de un producto sean insuficientes para cubrir su tiempo estimado de abastecimiento. | Alta |
| RF-036 | El sistema debe generar alertas cuando un producto se encuentre dentro del período establecido para su reposición. | Alta |
| RF-037 | El sistema debe generar alertas sobre productos próximos a vencer considerando su fecha de vencimiento y comportamiento de venta (crítico ≤7 días, advertencia ≤30 días). | Alta |
| RF-038 | El sistema debe generar alertas cuando se identifiquen niveles de sobrestock de acuerdo con los criterios definidos para cada producto. | Media |
| RF-039 | El sistema debe permitir filtrar las alertas de acuerdo con su nivel de severidad y marcarlas como resueltas. | Media |
| RF-040 | El sistema debe recalcular automáticamente las alertas de un producto cada vez que cambie su stock (venta, entrada, salida o ajuste de inventario) o se edite su configuración de reposición (stock de seguridad, stock mínimo, lead time o frecuencia de compra), sin depender de que el administrador presione "Forzar Recálculo" manualmente. | Alta |

### **1.1.9. Módulo de dashboard y centro analítico**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-041 | El sistema debe presentar un dashboard con indicadores relacionados con el inventario, las ventas y las alertas activas, tales como: total de artículos, valor total del inventario, alertas activas (con semáforo de color rojo/amarillo/verde) y ventas acumuladas. | Alta |
| RF-042 | El sistema debe presentar las recomendaciones generadas por el componente de análisis inteligente, indicando el producto, tendencia, ajuste sugerido y nivel de confianza cuando esta información esté disponible. | Alta |
| RF-043 | El sistema debe presentar gráficamente el comportamiento de las ventas durante el período seleccionado. | Media |
| RF-044 | ~~El sistema debe mostrar los productos con mayor riesgo de agotamiento y estimar el impacto económico asociado a productos próximos a vencer.~~ — **Retirado.** Era parte del endpoint `GET /api/dashboard/stats/advanced`, eliminado por no tener consumidor en el frontend (plan 17, Fase 5). La proyección de agotamiento por producto sigue disponible en el Centro Analítico (RF-025). | Media |
| RF-045 | ~~El sistema debe calcular un indicador de nivel de servicio del inventario a partir de los niveles actuales de existencias y los puntos de reorden establecidos.~~ — **Retirado**, mismo motivo que RF-044. | Media |
| RF-046 | ~~El sistema debe permitir comparar las ventas de diferentes períodos y presentar la variación correspondiente.~~ — **Retirado**, mismo motivo que RF-044. | Baja |

### **1.1.10. Módulo de reportes y exportación**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-047 | El sistema debe permitir generar reportes relacionados con inventario, ventas, información financiera y operación del negocio. | Alta |
| RF-048 | El sistema debe permitir consultar, modificar y eliminar reportes previamente generados, solicitando confirmación para las acciones de eliminación. | Media |
| RF-049 | El sistema debe permitir exportar los datos de los reportes a un formato de hoja de cálculo (xlsx) con los datos del rango de fechas seleccionado. | Alta |
| RF-050 | El sistema debe informar al usuario cuando no existan datos para el período seleccionado antes de generar un reporte. | Baja |
| RF-051 | El sistema debe permitir generar un reporte en PDF de las pérdidas asociadas a productos vencidos, incluyendo producto, proveedor, cantidad, valor unitario y valor total de la pérdida. | Alta |

		

### **1.1.11. Módulo de gestión de proveedores**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-052 | El sistema debe permitir crear, consultar, actualizar y eliminar proveedores con datos como (nombre empresa, contacto principal, email, teléfono, dirección). | Alta |
| RF-053 | El sistema debe permitir asociar productos con sus respectivos proveedores para facilitar la gestión del abastecimiento y las órdenes de compra. | Alta |

### **1.1.12. Módulo de gestión de colaboradores**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-054 | El sistema debe permitir al administrador registrar, consultar, actualizar y eliminar usuarios con rol de colaborador. | Alta |
| RF-055 | El sistema debe restringir la administración de colaboradores a los usuarios que cuenten con permisos de administrador. | Alta |

### **1.1.13. Módulo de simulación de escenarios de compra**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-056 | El sistema debe permitir al usuario establecer una cantidad de días de cobertura deseada y calcular las cantidades necesarias de cada producto. | Alta |
| RF-057 | El sistema debe permitir establecer un presupuesto máximo y generar una propuesta de compra ajustada al presupuesto disponible. | Alta |
| RF-058 | El sistema debe permitir convertir una simulación aprobada en una orden de compra en estado borrador. | Media |

### **1.1.14. Módulo de retroalimentación del componente de análisis inteligente**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-059 | El sistema debe comparar las cantidades recomendadas para reabastecimiento con el comportamiento posterior de las ventas para determinar el nivel de precisión de las recomendaciones (ventas\_reales / cantidad\_sugerida), con período adaptativo de max(lead\_time × 2, 14\) días. | Alta |
| RF-060 | El sistema debe almacenar los resultados de precisión de las recomendaciones para utilizarlos en posteriores procesos de análisis. | Alta |
| RF-061 | El sistema debe presentar indicadores históricos sobre el nivel de precisión de las recomendaciones generadas. | Media |

### **1.1.15. Módulo de automatización y comunicación**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-062 | El sistema debe enviar periódicamente a los administradores un resumen de las alertas activas y de mayor prioridad de la tienda. | Alta |
| RF-063 | El sistema debe permitir al administrador solicitar manualmente el envío del resumen de alertas. | Alta |

### **1.1.16. Módulo de gestión de cartera y fiados**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-064 | El sistema debe permitir registrar ventas como "Fiado", asociándose obligatoriamente a un cliente y excluyendo dicho monto del efectivo esperado en caja. | Alta |
| RF-065 | El sistema debe mantener un saldo pendiente por cliente, calculado como la suma de las compras fiadas menos la suma de los abonos pagados. | Alta |
| RF-066 | El sistema debe permitir registrar abonos (pagos parciales o totales) al saldo de un cliente, sumando el efectivo recibido a la sesión de caja activa. | Alta |
| RF-067 | El sistema debe contar con un motor de IA que evalúe el historial de pagos y compras fiadas del cliente para generar un nivel de riesgo y una sugerencia comercial. | Alta |
| RF-068 | El sistema debe restringir el acceso a la interfaz de Cartera y al método de pago "Fiado" exclusivamente al rol Administrador. | Alta |
| RF-069 *(complementa el Módulo 1.1.1)* | El sistema debe permitir a los usuarios habilitar autenticación de dos factores (2FA) mediante un código TOTP, solicitándolo como paso adicional durante el inicio de sesión cuando esté activado. | Alta |
| RF-070 *(complementa el Módulo 1.1.2)* | El Catálogo debe mostrar el nivel de stock de cada producto (agotado, crítico, por reponer o suficiente), calculado con el mismo motor de reposición que usan el Dashboard, el análisis de demanda y las compras sugeridas. | Alta |
| RF-071 *(complementa el Módulo 1.1.15)* | El sistema debe emitir una alerta sonora cuando se detecte un incremento en el número de alertas activas, usando un tono distinto para alertas críticas. | Media |

### **1.1.17. Módulo de Punto de Venta y Gestión de Caja**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RF-072 | El sistema debe requerir que el usuario abra una sesión de caja, declarando el monto de apertura, antes de poder registrar ventas. | Alta |
| RF-073 | El sistema debe permitir cerrar la sesión de caja, declarando el monto final en efectivo, y calcular automáticamente la diferencia entre lo declarado y lo esperado (apertura + ventas en efectivo − egresos aprobados). | Alta |
| RF-074 | El sistema debe permitir registrar egresos de caja menor, indicando monto, motivo, categoría y, opcionalmente, una foto de soporte. | Alta |
| RF-075 | El sistema debe permitir a un administrador aprobar o rechazar los egresos de caja menor registrados por un colaborador; el egreso solo afecta el cálculo del cierre de caja si es aprobado. | Alta |
| RF-076 | El sistema debe permitir consultar el historial de sesiones de caja de la tienda. | Media |

## **1.2 Requerimientos no funcionales**

Los requerimientos no funcionales establecen las características de calidad y restricciones que deberá cumplir el sistema. Entre estos aspectos se encuentran el rendimiento, la seguridad, la usabilidad, la disponibilidad, la mantenibilidad y la interoperabilidad.

### **1.2.1. Rendimiento**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RNF-001 | El dashboard debe mostrar sus principales indicadores en un tiempo máximo de 3 segundos después de la autenticación del usuario. | Alta |
| RNF-002 | Las operaciones estándar de consulta y modificación de información deben obtener respuesta de la base de datos en un tiempo máximo de 500 milisegundos bajo las condiciones definidas para las pruebas. | Alta |
| RNF-003 | El sistema debe evitar la ejecución repetida de solicitudes de análisis inteligente cuando los datos utilizados para generar una recomendación no hayan cambiado. | Alta |

### **1.2.2. Seguridad**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RNF-004 | El sistema debe almacenar las contraseñas de los usuarios utilizando mecanismos de cifrado o hash seguro. | Alta |
| RNF-005 | El sistema debe gestionar las sesiones de usuario de forma segura y permitir su invalidación al cerrar sesión. | Alta |
| RNF-006 | El sistema debe impedir el acceso a los servicios y recursos restringidos a usuarios que no cuenten con una sesión válida. | Alta |
| RNF-007 | El sistema debe aplicar restricciones de seguridad a las recomendaciones generadas por el componente de análisis inteligente para evitar valores fuera de los límites establecidos. | Alta |
| RNF-008 | El sistema debe impedir que un usuario mantenga sesiones concurrentes y debe invalidar la sesión anterior cuando se detecte un nuevo inicio de sesión. | Alta |

### **1.2.3. Usabilidad**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RNF-009 | La interfaz del sistema debe adaptarse a dispositivos con diferentes tamaños de pantalla, desde dispositivos móviles hasta computadores de escritorio. | Alta |
| RNF-010 | El sistema debe proporcionar retroalimentación visual al usuario después de realizar operaciones como crear, actualizar, eliminar, enviar o confirmar información. | Alta |
| RNF-011 | Los formularios del sistema deben validar la información obligatoria antes de permitir su envío. | Media |

### **1.2.4. Disponibilidad y compatibilidad**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RNF-012 | El sistema debe funcionar correctamente en las versiones vigentes de los navegadores Chrome, Edge y Firefox definidas para las pruebas del proyecto. | Alta |
| RNF-013 | El sistema debe conservar la información almacenada durante reinicios del servidor o de la aplicación. | Media |

### **1.2.5. Mantenibilidad**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RNF-014 | El sistema debe mantener una separación organizada entre las diferentes capas y componentes de la aplicación para facilitar su mantenimiento. | Alta |
| RNF-015 | La base de datos debe permitir realizar modificaciones estructurales mediante mecanismos de migración sin afectar la información existente. | Alta |
| RNF-016 | El sistema debe conservar un registro de las recomendaciones generadas por el componente de análisis inteligente para facilitar su trazabilidad y auditoría. | Alta |

### **1.2.6. Interoperabilidad**

| ID | Descripción | Prioridad |
| ----- | ----- | :---: |
| RNF-017 | El sistema debe registrar el resultado de los procesos de comunicación automatizada (correo) para permitir verificar su ejecución exitosa o identificar errores. | Media |
| RNF-018 | Los documentos generados por el sistema deben utilizar formatos compatibles con la información y configuración regional establecida para Colombia, incluyendo la representación de valores monetarios en pesos colombianos. | Media |

# **Requerimientos del negocio**

A grandes rasgos, se pueden definir los requerimientos del negocio, que consiste en permitir al sistema gestionar el inventario de múltiples tiendas de manera independiente, teniendo en cuenta lo siguiente:

* Se debe llevar un registro exacto de las entradas y salidas de productos.  
* El sistema debe procesar ventas y descontar el stock automáticamente.  
* Se debe alertar al administrador cuando un producto esté por agotarse antes de la próxima reposición.  
* Una Inteligencia Artificial debe analizar el inventario y sugerir órdenes de compra.  
* Se debe llevar un historial de auditoría de todas las decisiones tomadas por la IA.

# **Reglas del Negocio**

**RN01 — Tienda (Multitenencia)**

Toda la información debe estar separada y agrupada por establecimiento comercial. Una tienda es el eje central del sistema.

**RN02 — Usuario y Roles**

Un usuario debe pertenecer a una tienda y ocupar un rol específico (Ej: Administrador, Colaborador). Un administrador puede gestionar toda la tienda, mientras que el colaborador tiene permisos limitados (ventas). TIENDA 1 ───── N USUARIO

**RN03 — Proveedor**

Una tienda puede trabajar con diferentes proveedores de mercancía. TIENDA 1 ───── N PROVEEDOR

**RN04 — Producto**

Todo producto pertenece al catálogo de una tienda y puede tener un proveedor asignado. TIENDA 1 ───── N PRODUCTO, PROVEEDOR 1 ───── N PRODUCTO

**RN05 — Historial de Precios**

El precio de un producto puede fluctuar en el tiempo. Por motivos de trazabilidad financiera, cuando el precio de un producto cambia, se debe guardar un historial para saber en qué fecha varió el costo. PRODUCTO 1 ───── N HISTORIAL\_PRECIOS

**RN06 — Movimientos de Stock**

Para mantener la precisión del inventario, cada entrada, salida o ajuste manual de cantidad de un producto debe registrarse detalladamente junto con la fecha y el usuario responsable. PRODUCTO 1 ───── N MOVIMIENTOS\_STOCK, USUARIO 1 ───── N MOVIMIENTOS\_STOCK

**RN07 — Ventas**

Para cada venta se liquida un cobro total. Una venta es procesada por un usuario vendedor en una tienda específica. USUARIO 1 ───── N VENTAS, TIENDA 1 ───── N VENTAS

**RN08 — Detalle de Venta**

Una venta puede contener diferentes productos (conceptos de cobro) y un producto puede venderse muchas veces en ventas distintas. Se debe registrar la cantidad y el precio congelado en el momento exacto de la venta. VENTA 1 ───── N VENTAS\_PRODUCTOS y PRODUCTO 1 ───── N VENTAS\_PRODUCTOS

**RN09 — Alertas de Inventario**

Cuando el motor de reposición determina que un producto se agotará antes de que llegue el próximo pedido (comparando su stock actual, velocidad de venta, stock de seguridad y tiempo de entrega del proveedor), el sistema genera una alerta para que el administrador esté informado de que debe reabastecerse. stock\_minimo no decide esta alerta por sí solo: solo actúa como piso adicional de cantidad sugerida cuando el producto no tiene ventas registradas. PRODUCTO 1 ───── N ALERTAS

**RN10 — Órdenes de Compra**

La tienda realiza pedidos a proveedores para reabastecerse. Una orden puede tener sugerencias de la IA basadas en el historial de ventas. TIENDA 1 ───── N ORDENES\_COMPRA y PROVEEDOR 1 ───── N ORDENES\_COMPRA

**RN11 — Auditoría y Decisiones IA**

Toda decisión o recomendación generada por la Inteligencia Artificial (sobre cuánto comprar) debe auditarse para evaluar si su precisión fue correcta comparada con las ventas reales. ORDEN\_COMPRA 1 ───── N AUDITORIA\_IA y ORDEN\_COMPRA 1 ───── N FEEDBACK\_IA.

**RN12 — Cliente y Abono (Fiados)**

Un cliente puede tener múltiples ventas fiadas y realizar múltiples abonos a su deuda. El saldo pendiente se calcula dinámicamente: suma de ventas fiadas menos suma de abonos. TIENDA 1 ——— N CLIENTE, CLIENTE 1 ——— N VENTA (fiada), CLIENTE 1 ——— N ABONO.

[image1]: <data:image/png;base64,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>