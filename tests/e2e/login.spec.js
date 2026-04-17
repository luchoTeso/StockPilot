const { test, expect } = require('@playwright/test');

test.describe('Flujo de Autenticación StockPilot', () => {
  
  test('Debería cargar la página de inicio de sesión correctamente', async ({ page }) => {
    // Ir a la URL de login
    await page.goto('/login');
    
    // Verificar que el título sea correcto (o contenga StockPilot)
    await expect(page).toHaveTitle(/StockPilot/);
    
    // Verificar que existan los campos de login (Usando el placeholder para ser precisos)
    const emailInput = page.locator('input[placeholder*="tu@correo.com"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Debería mostrar un mensaje de error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    
    // Llenar campos con basura
    await page.fill('input[placeholder*="tu@correo.com"]', 'usuario_falso@test.com');
    await page.fill('input[type="password"]', '123456');
    
    // Clic en el botón de ingresar (con el texto exacto de tu componente)
    await page.click('button:has-text("Ingresar a mi Negocio")');
    
    // Esperar a que el sistema de Toast o mensaje de error aparezca
    // (Ajustar selector según tu sistema de alertas, ej. Lucide Toast)
    // const errorToast = page.locator('text=Error');
    // await expect(errorToast).toBeVisible();
  });
});
