# Plan 19: Requisitos de la intervención (Práctica V) antes de datos reales

**Estado:** 3.1 y 3.2 implementadas y verificadas. 3.3 y 3.4 documentadas como diseño, sin implementar (a pedido explícito del usuario — "solo documentar por ahora").
**Fecha:** 2026-09-25
**Origen:** `docs/contexto_revision_cowork_2026-09-23.md`, sección 3 ("Decisiones y sugerencias de producto"), y el análisis de resultados de `Documentacion/StockPilot_Intervencion_y_Viabilidad.docx` (sección 2.6, "Antes de recibir datos de negocios reales se deben cumplir dos condiciones...").

---

## 3.1 Copias de seguridad de PostgreSQL — implementado

**Problema:** `utils/backup.js` copiaba el archivo físico `database/inventario.db` (SQLite). Al migrar a PostgreSQL, `createBackup()` nunca encontraba ese archivo y no generaba ningún respaldo en producción — ya estaba deshabilitado en `app.js` con el comentario `// (Obsoleto en Postgres)`.

**Solución implementada:**
- `utils/backup.js` reescrito: usa `pg_dump` (formato `-Fc`, restaurable con `pg_restore`) sobre `process.env.DATABASE_URL`, guarda el volcado en `backups/` con el mismo esquema de nombre por fecha que tenía el mecanismo viejo, y conserva solo los últimos 14 (antes 10, ajustado a dos semanas de respaldo diario).
- `services/schedulerService.js` agrega un cron nuevo: `0 2 * * *` (diario, 2:00 AM), junto a los demás jobs existentes (resumen semanal, reversión de precios, evaluación de IA).
- `app.js` ya no importa `createBackup` directamente (quedaba comentado); ahora solo el scheduler lo dispara.

**Limitación conocida, documentada en el propio archivo:** el sistema de archivos de un servicio web en Render (y la mayoría de PaaS) es **efímero** — estos respaldos no sobreviven un redeploy ni un reinicio del contenedor. Sirven como red de seguridad de corto plazo entre despliegues, pero **no reemplazan una copia en almacenamiento externo** (S3, Backblaze, etc.). Subir automáticamente el volcado a ese almacenamiento queda pendiente de que el equipo provisione credenciales — no se inventó ninguna integración de nube sin que existan esas credenciales.

**Riesgo adicional no resuelto en esta ronda:** `pg_dump` debe estar disponible en la imagen del servicio de Render; algunos planes no incluyen el cliente de PostgreSQL. El código no falla el proceso si `pg_dump` no está (`try/catch` con log de error), pero conviene verificar manualmente en el entorno real que el binario existe antes de confiar en este mecanismo.

---

## 3.2 Política de Tratamiento de Datos (Ley 1581 de 2012) — implementado

**Implementado:**
- Página nueva `frontend/src/pages/PoliticaDatosPage.jsx`, ruta pública `/politica-datos` (no requiere sesión), con las secciones exigibles: responsable del tratamiento, qué datos se recopilan, para qué se usan (incluyendo la aclaración de que el resumen enviado a OpenAI no incluye datos personales), derechos del titular (conocer/actualizar/rectificar/suprimir) y vigencia.
- `RegisterPage.jsx`: checkbox obligatorio "Acepto la Política de Tratamiento de Datos", con enlace a la página anterior; el botón de registro queda deshabilitado hasta marcarlo.
- `controllers/authController.js`: rechaza el registro con 400 si `acepta_politica_datos` no llega en `true`.
- `models/User.js` / `database/init_pg.sql` / `config/database.js`: columna nueva `Usuarios.fecha_aceptacion_politica_datos` (TIMESTAMP, nullable), que solo se completa en el flujo de registro propio — **no** cuando un administrador da de alta a un colaborador desde `tenderoController.js`, porque quien acepta la política es el titular de la cuenta, no quien lo registra.
- Enlace adicional desde el pie de la Landing Page, para quien no vaya a registrarse pero quiera consultarla.

**Fuera de esta ronda (no pedido):** un flujo de re-consentimiento si el texto de la política cambia en el futuro, y el ejercicio real de los derechos (hoy dice "escribiendo al soporte", no hay un formulario de autoservicio).

---

## 3.3 Métrica de activación de la prueba gratuita — solo documentado, sin implementar

Del `docx` (sección 3.3 del contexto y 2.6/4.2 de la intervención): la meta es **≥ 25% de activación**, definida como "registros que cargan al menos 20 productos y registran ventas durante 7 días ÷ registros totales".

**Diseño propuesto (no implementado):**

```sql
-- Candidato a vista o consulta bajo demanda, NO a tabla materializada (el volumen no lo justifica).
WITH RegistrosNuevos AS (
  SELECT t.id_tienda, t.fecha_creacion
  FROM Tienda t
),
CatalogoCargado AS (
  SELECT id_tienda, COUNT(*) AS productos
  FROM Productos
  GROUP BY id_tienda
),
VentasPrimeros7Dias AS (
  SELECT v.id_tienda, COUNT(*) AS ventas
  FROM Ventas v
  JOIN RegistrosNuevos rn ON rn.id_tienda = v.id_tienda
  WHERE v.fecha_salida BETWEEN rn.fecha_creacion AND rn.fecha_creacion + INTERVAL '7 days'
  GROUP BY v.id_tienda
)
SELECT
  rn.id_tienda,
  COALESCE(cc.productos, 0) AS productos_cargados,
  COALESCE(vp.ventas, 0) AS ventas_primeros_7_dias,
  (COALESCE(cc.productos, 0) >= 20 AND COALESCE(vp.ventas, 0) > 0) AS activado
FROM RegistrosNuevos rn
LEFT JOIN CatalogoCargado cc ON cc.id_tienda = rn.id_tienda
LEFT JOIN VentasPrimeros7Dias vp ON vp.id_tienda = rn.id_tienda;
```

**Dónde viviría:** un método nuevo en `models/Tienda.js` (p. ej. `Tienda.getActivacion()`) y un endpoint `GET /api/tiendas/activacion`, restringido a un rol interno del equipo (no es información que deba ver cualquier administrador de tienda — es una métrica del negocio de StockPilot, no del negocio del tendero). No se construyó porque el piloto/la convocatoria pública (fase 5 de la intervención) todavía no arrancó — no hay registros que medir todavía. Implementar esto ahora sería instrumentación sin datos que instrumentar.

---

## 3.4 Modo básico (divulgación progresiva) — solo documentado, sin implementar

Del hallazgo H4 del docx ("La facilidad de uso decide la adopción") y la decisión 3.2 del contexto: los 15 módulos actuales son demasiados para una capacitación de 15 minutos.

**Diseño propuesto (no implementado):**
- **Modo tienda (por defecto):** 4 accesos grandes en el home — *Vender*, *¿Qué pido?* (Consejero IA simplificado), *Alertas*, *Recibir mercancía*. Reutiliza pantallas ya existentes (`PuntoVentaPage`, una vista recortada del Consejero, `AlertasPage`, el flujo de recepción de `ProveedoresPage`), no páginas nuevas.
- **Modo avanzado:** el resto de módulos (Simulador, Aprendizaje, Reportes, Promociones, Analítica, etc.), accesible con un toggle visible en el `Sidebar`.
- **Persistencia de la preferencia:** por *usuario*, no por tienda — un campo nuevo `Usuarios.modo_interfaz` (`'basico' | 'avanzado'`, default `'basico'` para cuentas nuevas) es más simple que por tienda y evita que el administrador imponga el modo avanzado a un colaborador que apenas se está capacitando.
- **Punto de decisión pendiente antes de implementar:** si el toggle debe estar disponible para el rol Colaborador o solo para Administrador — el hallazgo H4 habla de los "administradores de microempresas", que suelen ser los dueños, así que probablemente el colaborador debería quedar siempre en modo básico salvo que el administrador lo habilite explícitamente.

**Por qué no se implementó:** es un cambio de UX que toca la navegación principal de la aplicación; el propio contexto lo marca como "idea en evaluación... no implementar sin aprobación", y la intervención (fase 4, prueba de usabilidad con 5 tenderos) es precisamente el paso diseñado para validar si esto hace falta antes de construirlo.
