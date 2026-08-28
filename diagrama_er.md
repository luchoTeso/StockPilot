# Diagrama de Entidad Relación (ERD) - StockPilot

Este es el diagrama de la base de datos de StockPilot, generado a partir de la estructura real de PostgreSQL. Puedes copiar este código y pegarlo en cualquier visor de Mermaid (como [Mermaid Live](https://mermaid.live/) o usarlo directamente aquí en GitHub/Markdown).

```mermaid
erDiagram
    Tienda ||--o{ Usuarios : "tiene"
    Tienda ||--o{ Proveedores : "tiene"
    Tienda ||--o{ Productos : "vende"
    Tienda ||--o{ MovimientosStock : "registra"
    Tienda ||--o{ Ventas : "realiza"
    Tienda ||--o{ Ordenes_Compra : "genera"
    Tienda ||--o{ Alertas : "genera"
    Tienda ||--o{ Auditoria_IA : "audita"
    Tienda ||--o{ reportes : "emite"

    Usuarios ||--o{ MovimientosStock : "hace"
    Usuarios ||--o{ Ventas : "vende"
    Usuarios ||--o{ Ordenes_Compra : "aprueba"

    Proveedores ||--o{ Productos : "provee"
    Proveedores ||--o{ Ordenes_Compra : "recibe"

    Productos ||--o{ MovimientosStock : "sufre"
    Productos ||--o{ VentasProductos : "incluido_en"
    Productos ||--o{ Ordenes_Detalle : "solicitado_en"
    Productos ||--o{ Alertas : "genera"
    Productos ||--o{ Feedback_IA : "evaluado_en"
    Productos ||--o{ Historial_Precios : "tiene"

    Ventas ||--|{ VentasProductos : "contiene"

    Ordenes_Compra ||--|{ Ordenes_Detalle : "contiene"
    Ordenes_Compra ||--o{ Auditoria_IA : "auditada_por"
    Ordenes_Compra ||--o{ Feedback_IA : "evaluada_por"

    Tienda {
        int id_tienda PK
        varchar nombre_establecimiento
        varchar direccion
        int anio_creacion
        varchar estado
        varchar documento
        varchar razon_social
        varchar celular
        varchar ciudad
    }

    Usuarios {
        int id_usuario PK
        varchar nombres
        varchar genero
        varchar correo
        varchar celular
        varchar rol
        varchar usuario
        varchar contrasena
        timestamp fecha_registro
        int id_tienda FK
        varchar session_id
        text foto_url
        boolean cambio_clave_forzoso
        varchar reset_token
        varchar reset_expires
    }

    Proveedores {
        int id_proveedor PK
        varchar nombre_empresa
        varchar nit
        varchar contacto_nombre
        varchar contacto_principal
        varchar telefono
        varchar correo
        varchar email
        text direccion
        int id_tienda FK
        varchar estado
        timestamp fecha_registro
    }

    Productos {
        int id_producto PK
        varchar codigo
        varchar nombre_producto
        varchar categoria
        varchar subcategoria
        varchar tipo_producto
        numeric precio
        int cantidad
        int stock_minimo
        int stock_maximo
        int stock_seguridad
        int lead_time
        date fecha_entrada
        timestamp fecha_salida
        varchar estado
        int id_tienda FK
        int id_proveedor FK
        date fecha_vencimiento
        int frecuencia_compra_dias
        numeric costo_compra
        varchar clasificacion_abc
        numeric precio_original
        date fecha_fin_promocion
    }

    MovimientosStock {
        int id_movimiento PK
        int id_producto FK
        varchar tipo_movimiento
        int cantidad
        int stock_final
        timestamp fecha_movimiento
        text observacion
        int id_usuario FK
        int id_tienda FK
    }

    Ventas {
        int id_venta PK
        int id_vendedor FK
        int id_tienda FK
        timestamp fecha_salida
        numeric precio_total
    }

    VentasProductos {
        int id PK
        int id_venta FK
        int id_producto FK
        int cantidad
        numeric precio_unitario
    }

    Ordenes_Compra {
        int id_orden PK
        int id_tienda FK
        int id_proveedor FK
        int id_usuario FK
        timestamp fecha_creacion
        timestamp fecha_aprobacion
        varchar estado
        numeric total_estimado
        numeric presupuesto_total
        numeric monto_pagado
        varchar estado_pago
        varchar riesgo
        text notas
        text observaciones
    }

    Ordenes_Detalle {
        int id_detalle PK
        int id_orden FK
        int id_producto FK
        int cantidad_sugerida
        int cantidad_final
        numeric costo_unitario
        int sugerencia_ia
    }

    Alertas {
        int id_alerta PK
        int id_producto FK
        int id_tienda FK
        varchar tipo
        varchar severidad
        text mensaje
        timestamp fecha_creacion
        int resuelta
        timestamp fecha_resolucion
        text datos_json
    }

    Auditoria_IA {
        int id_auditoria PK
        timestamp fecha_auditoria
        int id_tienda FK
        int id_orden FK
        varchar motor_ia
        text prompt_utilizado
        text datos_base_json
        text sugerencia_ia_json
        text impacto_decision
        text razon_ia
    }

    Feedback_IA {
        int id_feedback PK
        int id_orden FK
        int id_producto FK
        int cantidad_sugerida
        int ventas_reales_periodo
        numeric factor_precision
        timestamp fecha_evaluacion
    }

    Historial_Precios {
        int id PK
        int id_producto FK
        numeric precio_anterior
        numeric precio_nuevo
        timestamp fecha_cambio
        text motivo
    }

    reportes {
        int id PK
        varchar titulo
        text descripcion
        date fecha_reporte
        varchar creador
        varchar tipo
        int id_tienda FK
        date fecha_inicio
        date fecha_fin
        timestamp creado_en
    }

    Cache_IA {
        varchar clave PK
        varchar data_hash
        text datos_json
        timestamp actualizado_at
    }
```
