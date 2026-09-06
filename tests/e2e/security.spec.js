const { test, expect } = require('@playwright/test');

test.describe('Pruebas de Seguridad StockPilot', () => {

  test('1. Control de Acceso: Redirección desde rutas protegidas', async ({ page }) => {
    // Intentar acceder a una ruta protegida sin estar autenticado
    await page.goto('/productos');
    
    // Debería redirigir al login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Intentar acceder al dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('2. Prevención Inyección SQL en Login', async ({ page }) => {
    await page.goto('/login');
    
    // Rellenar login con payload SQL
    await page.fill('#identificador', "admin' OR '1'='1");
    await page.fill('#password', "123456");
    await page.click('button[type="submit"]');

    // Debe mostrar error de credenciales, NO entrar ni romper el backend
    const toast = page.locator('.Toastify__toast--error');
    await expect(toast).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('3. Prevención XSS en Login/Registro', async ({ page }) => {
    await page.goto('/register');
    
    // Payload XSS básico
    const xssPayload = "<script>alert('XSS')</script>";
    
    await page.fill('#nombres', xssPayload);
    await page.fill('#correo', `test_xss_${Date.now()}@test.com`);
    await page.fill('#celular', '1234567890');
    await page.fill('#usuario', `user_xss_${Date.now()}`);
    await page.fill('#contrasena', 'password123');
    await page.fill('#nombreTienda', xssPayload);
    await page.fill('#direccionTienda', xssPayload);
    
    await page.click('button[type="submit"]');
    
    // Si el registro es exitoso, verificar que el nombre no ejecute scripts en el frontend
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Asegurarse de que no hay diálogos modales de alerta nativa del navegador disparados
    page.on('dialog', async dialog => {
      // Si el diálogo es una alerta, el test fallará si el script se ejecutó
      expect(dialog.type()).not.toBe('alert');
      await dialog.dismiss();
    });
    
    // Esperar a que cargue el nombre de la tienda
    await page.waitForTimeout(1000); 
    
    // El texto debe estar escapado y visible literalmente como cadena
    await expect(page.locator('body')).toContainText('<script>alert(\'XSS\')</script>');
  });

});
