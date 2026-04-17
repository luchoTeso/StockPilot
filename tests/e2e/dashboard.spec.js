const { test, expect } = require('@playwright/test');

test.describe('Auditoría Integral StockPilot', () => {
  
  test('Flujo Completo: Login -> Dashboard -> Inventario', async ({ page }) => {
    // 1. Ir a Login
    await page.goto('/login');
    
    // 2. Llenar Credenciales Reales (basadas en seed data)
    await page.fill('input[placeholder*="tu@correo.com"]', 'admin');
    await page.fill('input[placeholder="••••••••"]', 'admin123');
    
    // 3. Seleccionar Rol (Interactuando con CustomSelect)
    // Primero hacemos clic en el selector para abrirlo
    await page.click('text=Seleccione...');
    // Luego seleccionamos la opción de Administrador
    await page.click('text=Administrador (Dueño)');
    
    // 4. Ingresar
    await page.click('button:has-text("Ingresar a mi Negocio")');
    
    // 5. Verificar que llegamos al Dashboard (buscando un título único del dashboard)
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText(/Vista General/i);
    
    // Esperar a que carguen las estadísticas (buscamos un símbolo de moneda o un valor)
    const statsCard = page.locator('text=Valor Inventario').or(page.locator('text=Ventas de Hoy'));
    await expect(statsCard).toBeVisible();

    // 6. Navegar a Productos usando el Sidebar
    // Buscamos el enlace que dice "Catálogo" (según tu Sidebar.jsx)
    await page.click('nav >> text=Catálogo');
    
    // 7. Verificar Inventario
    await expect(page).toHaveURL(/.*productos/);
    await expect(page.locator('h2')).toContainText(/Inventario/i);
    
    // Verificar que la tabla de productos tenga contenido
    const tablaProductos = page.locator('table');
    await expect(tablaProductos).toBeVisible();
    
    // Verificar que haya al menos una fila de datos (excluyendo el encabezado)
    const filasProductos = page.locator('tbody tr');
    const conteo = await filasProductos.count();
    console.log(`Auditoría: Se encontraron ${conteo} productos en bodega.`);
    expect(conteo).toBeGreaterThan(0);
    
    // 8. Cerrar Sesión (Finalizar Ciclo)
    await page.click('button:has-text("Cerrar Sesión")');
    await expect(page).toHaveURL(/.*login/);
  });
});
