import { describe, it, expect } from 'vitest';

// === PRUEBAS UNITARIAS: Lógica pura del Dashboard Controller ===
// Extraemos y probamos los cálculos matemáticos que se realizan
// en dashboardController.js sin tocar la base de datos.
//
// Plan 17, Fase 5: se quitaron los grupos de "Proyección de Pérdida por Vencimiento",
// "Nivel de Servicio Estimado" y "Variación de Ventas" — probaban una reimplementación local
// de las fórmulas de `getAdvancedStats` (nunca importaban el controlador real), y ese método
// se eliminó por no tener ningún consumidor en el frontend (`GET /api/dashboard/stats/advanced`
// sin llamadores; verificado con una búsqueda en todo `frontend/src`).

describe('Motor Analítico del Dashboard (dashboardController.js)', () => {

  // ────────────────────────────────────────────────────
  //  Margen Promedio
  //  Ref: dashboardController.js línea 18
  // ────────────────────────────────────────────────────

  function calcularMargenPromedio(productos) {
    if (productos.length === 0) return 0;
    const margenes = productos.map(p => {
      if (p.precio === 0) return 0;
      return ((p.precio - p.costo_compra) / p.precio) * 100;
    });
    return Math.round(margenes.reduce((a, b) => a + b, 0) / margenes.length);
  }

  describe('Margen de Ganancia Promedio', () => {
    it('Debería calcular margen 50% cuando costo = mitad del precio', () => {
      const prods = [{ precio: 10000, costo_compra: 5000 }];
      expect(calcularMargenPromedio(prods)).toBe(50);
    });

    it('Debería calcular margen 0% cuando costo = precio', () => {
      const prods = [{ precio: 5000, costo_compra: 5000 }];
      expect(calcularMargenPromedio(prods)).toBe(0);
    });

    it('Debería promediar múltiples productos', () => {
      const prods = [
        { precio: 10000, costo_compra: 5000 },  // 50%
        { precio: 10000, costo_compra: 8000 },   // 20%
      ];
      expect(calcularMargenPromedio(prods)).toBe(35); // (50+20)/2
    });

    it('Debería retornar 0 si no hay productos', () => {
      expect(calcularMargenPromedio([])).toBe(0);
    });

    it('Debería manejar precio = 0 sin error (división por cero)', () => {
      const prods = [{ precio: 0, costo_compra: 0 }];
      expect(calcularMargenPromedio(prods)).toBe(0);
    });
  });
});
