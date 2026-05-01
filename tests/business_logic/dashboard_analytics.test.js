import { describe, it, expect } from 'vitest';

// === PRUEBAS UNITARIAS: Lógica pura del Dashboard Controller ===
// Extraemos y probamos los cálculos matemáticos que se realizan
// en dashboardController.js sin tocar la base de datos.

describe('Motor Analítico del Dashboard (dashboardController.js)', () => {

  // ────────────────────────────────────────────────────
  //  Proyección de Pérdida por Vencimiento
  //  Ref: dashboardController.js líneas 93-113
  // ────────────────────────────────────────────────────

  function calcularPerdidaVencimiento(cantidad, velocity, diasRestantes, precio) {
    const ventasEstimadas = velocity * diasRestantes;
    const unidadesQueVenceran = Math.max(0, cantidad - ventasEstimadas);
    return {
      unidadesQueVenceran: Math.round(unidadesQueVenceran),
      perdida: Math.round(unidadesQueVenceran * precio)
    };
  }

  describe('Proyección de Pérdida por Vencimiento', () => {
    it('Debería calcular unidades invendibles si se vende lento', () => {
      // 100 unidades, se vende 1/día, vence en 10 días → sobran 90
      const result = calcularPerdidaVencimiento(100, 1, 10, 2000);
      expect(result.unidadesQueVenceran).toBe(90);
      expect(result.perdida).toBe(180000);
    });

    it('Debería retornar 0 pérdida si se vende todo a tiempo', () => {
      // 50 unidades, se vende 10/día, vence en 10 días → sobran 0
      const result = calcularPerdidaVencimiento(50, 10, 10, 5000);
      expect(result.unidadesQueVenceran).toBe(0);
      expect(result.perdida).toBe(0);
    });

    it('Debería manejar velocity = 0 (producto sin ventas)', () => {
      // 30 unidades, sin ventas, vence en 5 días → sobran 30
      const result = calcularPerdidaVencimiento(30, 0, 5, 1500);
      expect(result.unidadesQueVenceran).toBe(30);
      expect(result.perdida).toBe(45000);
    });

    it('Debería manejar diasRestantes = 0 (vence hoy)', () => {
      const result = calcularPerdidaVencimiento(20, 5, 0, 3000);
      expect(result.unidadesQueVenceran).toBe(20);
      expect(result.perdida).toBe(60000);
    });
  });

  // ────────────────────────────────────────────────────
  //  Nivel de Servicio Estimado
  //  Ref: dashboardController.js líneas 130-138
  // ────────────────────────────────────────────────────

  function calcularNivelServicio(productos) {
    const total = productos.length;
    if (total === 0) return 100;
    let saludables = 0;
    productos.forEach(p => {
      const rop = (p.velocity * p.lead_time) + p.stock_seguridad;
      if (p.stock_actual > rop) saludables++;
    });
    return Math.round((saludables / total) * 100);
  }

  describe('Nivel de Servicio Estimado (% productos sobre ROP)', () => {
    it('Debería retornar 100% si todos los productos superan el ROP', () => {
      const prods = [
        { stock_actual: 50, velocity: 2, lead_time: 3, stock_seguridad: 5 }, // ROP = 11
        { stock_actual: 100, velocity: 5, lead_time: 4, stock_seguridad: 10 }, // ROP = 30
      ];
      expect(calcularNivelServicio(prods)).toBe(100);
    });

    it('Debería retornar 0% si ningún producto supera el ROP', () => {
      const prods = [
        { stock_actual: 5, velocity: 10, lead_time: 3, stock_seguridad: 5 },  // ROP = 35
        { stock_actual: 2, velocity: 5, lead_time: 4, stock_seguridad: 10 }, // ROP = 30
      ];
      expect(calcularNivelServicio(prods)).toBe(0);
    });

    it('Debería retornar 50% si la mitad supera el ROP', () => {
      const prods = [
        { stock_actual: 50, velocity: 2, lead_time: 3, stock_seguridad: 5 },  // ROP=11, OK
        { stock_actual: 5, velocity: 10, lead_time: 3, stock_seguridad: 5 },  // ROP=35, FAIL
      ];
      expect(calcularNivelServicio(prods)).toBe(50);
    });

    it('Debería retornar 100% si no hay productos (sin catálogo)', () => {
      expect(calcularNivelServicio([])).toBe(100);
    });
  });

  // ────────────────────────────────────────────────────
  //  Variación de Ventas (Comparativa 30d)
  //  Ref: dashboardController.js línea 147
  // ────────────────────────────────────────────────────

  function calcularVariacionVentas(ventasActual, ventasPrevio) {
    if (ventasPrevio > 0) return Math.round(((ventasActual - ventasPrevio) / ventasPrevio) * 100);
    return 0;
  }

  describe('Variación de Ventas (30d actuales vs 30d anteriores)', () => {
    it('Debería calcular +100% si se duplicaron las ventas', () => {
      expect(calcularVariacionVentas(200000, 100000)).toBe(100);
    });

    it('Debería calcular -50% si cayeron a la mitad', () => {
      expect(calcularVariacionVentas(50000, 100000)).toBe(-50);
    });

    it('Debería retornar 0% si no hubo ventas previas', () => {
      expect(calcularVariacionVentas(100000, 0)).toBe(0);
    });

    it('Debería calcular 0% si son iguales', () => {
      expect(calcularVariacionVentas(50000, 50000)).toBe(0);
    });

    it('Debería manejar crecimiento masivo (+200%)', () => {
      expect(calcularVariacionVentas(300000, 100000)).toBe(200);
    });
  });

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
