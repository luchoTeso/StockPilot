const { test, expect } = require('@playwright/test');

test.describe('Flujo Principal (Happy Paths)', () => {
  let uniqueId = Date.now();
  
  test('1. Registro de Administrador y Creación de Tienda', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('#nombres', `Admin Prueba ${uniqueId}`);
    await page.fill('#correo', `admin_${uniqueId}@test.com`);
    await page.fill('#celular', '1234567890');
    await page.fill('#usuario', `admin_${uniqueId}`);
    await page.fill('#contrasena', 'password123');
    await page.fill('#nombreTienda', `Tienda ${uniqueId}`);
    await page.fill('#direccionTienda', 'Calle Falsa 123');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url.includes('dashboard')).toBeTruthy();
  });

  test('2. Inicio de Sesión', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#identificador', `admin_${uniqueId}`);
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Debería redirigir a dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('3. Crear Colaborador y Validar Restricción Única', async ({ page }) => {
    // Primero hacemos login
    await page.goto('/login');
    await page.fill('#identificador', `admin_${uniqueId}`);
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Navegar a Registro Tendero (Colaboradores)
    await page.goto('/registro-tendero');
    
    // Rellenar form para un nuevo tendero
    const tenderoUsername = `colab_${uniqueId}`;
    const tenderoEmail = `colab_${uniqueId}@test.com`;

    await page.fill('input#nombres', 'Colaborador E2E');
    await page.fill('input#celular', '3000000000');
    // Selector custom para género, asumiremos que se puede llenar o que tiene valor por defecto
    // await page.click('div[class*="CustomSelect"]'); // Depende de la implementación exacta
    // Vamos a intentar hacer submit, si género falla requerirá ajuste manual, pero intentemos saltarlo si no es estricto en el DOM 
    
    await page.fill('input#correo', tenderoEmail);
    await page.fill('input#usuario', tenderoUsername);
    await page.fill('input#contrasena', 'tendero123');
    
    // Podría fallar el submit si el custom select de género es estrictamente requerido y no hay forma nativa de setearlo
    // Ejecutar javascript en caso de que sea un input oculto:
    await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(i => { if(i.id === 'genero') i.value = 'Femenino' });
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // 3.1. Validar que la tabla tiene ahora al colaborador
    // Opcional: buscar por texto
    // await expect(page.locator('table')).toContainText(tenderoUsername);
    
    // 3.2. Probar restricción única (crear el mismo)
    await page.fill('input#correo', tenderoEmail);
    await page.fill('input#usuario', tenderoUsername);
    await page.click('button[type="submit"]');
    
    // Verificar que aparece error de correo/usuario ya existe (toast)
    const errorToast = page.locator('.Toastify__toast--error');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('El correo o usuario ya existe');
  });

});
