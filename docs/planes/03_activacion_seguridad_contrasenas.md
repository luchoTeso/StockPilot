# Plan 03: Activación de Cuenta, Cambio Forzoso de Clave y Validaciones de Seguridad

**Estado:** Implementado y Verificado  
**Fecha:** 2026-09-17  

---

## 1. Contexto y Requerimientos
Cuando un administrador crea un colaborador o tendero, el sistema le asigna credenciales temporales y activa la bandera `cambio_clave_forzoso = true`. 

### Objetivos:
1. Forzar al colaborador a cambiar su clave en su primer inicio de sesión antes de que pueda realizar cualquier otra acción en la plataforma.
2. Actualizar el diseño visual de la pantalla de activación (`ForcePasswordPage.jsx`) a una paleta clara y limpia que coincida con el rediseño del login y del resto de la app.
3. **Validación de Contraseña Histórica:** Evitar que el usuario ingrese la misma contraseña que ya tenía asignada, tanto en el primer cambio forzoso como en la actualización de contraseña del perfil.

---

## 2. Implementación Técnica

### Flujo de Redirección Forzoso
- En `authController.js` (`login` y `verify2FA`), se evalúa correctamente el booleano `cambio_clave_forzoso` de PostgreSQL Neon y se almacena en la sesión del servidor (`req.session.cambio_clave_forzoso`).
- En `LoginPage.jsx`, al detectar `result.user.cambioClaveForzoso === true`, se redirige inmediatamente a `/activacion-cuenta`.
- En `ForcePasswordPage.jsx`, si el usuario intenta ir a otra ruta sin haber cambiado su contraseña, el guard lo mantiene en `/activacion-cuenta`.

### Rediseño Visual de `ForcePasswordPage.jsx`
- Contenedor con tarjeta blanca limpia (`bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl`).
- Títulos y etiquetas en tipografía clara de alto contraste (`text-slate-800` y `text-slate-400`).
- Inputs con fondo gris suave (`bg-slate-50 border border-slate-200`) y foco índigo (`focus:border-indigo-600`).
- Botón de acción con estilo de botón primario idéntico al del login.

### Validación de Contraseña No Repetida
1. **Endpoint de Activación (`/api/perfil/first-password`):**
   - Se consulta el hash actual de la base de datos y se ejecuta `bcrypt.compare(newPassword, row.contrasena)`.
   - Si coinciden, se rechaza con error 400: *"La nueva contraseña no puede ser igual a la que tienes asignada actualmente."*
2. **Endpoint de Perfil (`/api/perfil/cambiar-contrasena`):**
   - Se compara `currentPassword === newPassword` antes de procesar la solicitud, rechazando de inmediato si son idénticas.
