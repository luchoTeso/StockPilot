import { describe, it, expect } from 'vitest';

/**
 * Extracción directa de la lógica matemática pura del modelo Alert.js (líneas 27-103).
 * Probamos las fórmulas sin tocar la base de datos.
 */

import Alert from '../../models/Alert.js';

const {
  calcularClasificacionABC,
  calcularDiasAgotamiento,
  determinarAlertaStock,
  determinarAlertaVencimiento,
  determinarSobrestock
} = Alert;

// === PRUEBAS UNITARIAS ===

describe('Motor Matemático de Alertas (Alert.js)', () => {

  describe('Clasificación ABC Pareto', () => {
    it('Debería asignar A al producto con mayor ingreso (top 80%)', () => {
      const productos = [
        { id_producto: 1, precio: 100, velocity_30d: 20 },  // Rev: 60,000
        { id_producto: 2, precio: 100, velocity_30d: 10 },  // Rev: 30,000
        { id_producto: 3, precio: 100, velocity_30d: 5 },   // Rev: 15,000
        { id_producto: 4, precio: 100, velocity_30d: 1 },   // Rev: 3,000
      ];

      const resultado = calcularClasificacionABC(productos);

      // Total = 108,000
      // Prod 1: 60k/108k = 55.6% → A (≤ 80%)
      // Prod 2: 90k/108k = 83.3% → B (> 80%, ≤ 95%)
      // Prod 3: 105k/108k = 97.2% → C (> 95%)
      // Prod 4: 108k/108k = 100% → C
      expect(resultado[0].clasificacion_abc).toBe('A');
      expect(resultado[1].clasificacion_abc).toBe('B');
      expect(resultado[2].clasificacion_abc).toBe('C');
      expect(resultado[3].clasificacion_abc).toBe('C');
    });

    it('Debería ordenar productos de mayor a menor ingreso', () => {
      const productos = [
        { id_producto: 3, precio: 10, velocity_30d: 1 },    // Rev: 300 (menor)
        { id_producto: 1, precio: 1000, velocity_30d: 5 },  // Rev: 150,000 (mayor)
      ];

      const resultado = calcularClasificacionABC(productos);

      expect(resultado[0].id_producto).toBe(1); // Mayor primero
      expect(resultado[1].id_producto).toBe(3);
    });

    it('Debería manejar productos sin ventas (velocity = 0)', () => {
      const productos = [
        { id_producto: 1, precio: 1000, velocity_30d: 0 },
        { id_producto: 2, precio: 500, velocity_30d: 0 },
      ];

      const resultado = calcularClasificacionABC(productos);

      // Sin ingresos, totalRevenue = 0, pct sería 0 → todos clasificados como 'A' por la condición pct <= 0.8
      // Pero rev30 = 0 para todos, así que accum/totalRevenue = 0/0 → la condición totalRevenue > 0 es false → pct = 0
      resultado.forEach(p => {
        expect(p.rev30).toBe(0);
      });
    });

    it('Debería manejar productos con propiedades indefinidas (fallbacks a 0)', () => {
      const productos = [
        { id_producto: 1 } // Sin precio ni velocity_30d
      ];
      const resultado = calcularClasificacionABC(productos);
      expect(resultado[0].rev30).toBe(0);
      expect(resultado[0].clasificacion_abc).toBe('A');
    });

    it('Debería clasificar correctamente con distribución equilibrada', () => {
      // 5 productos con ingresos similares - la distribución debe ser más equitativa
      const productos = [
        { id_producto: 1, precio: 100, velocity_30d: 10 }, // 30,000
        { id_producto: 2, precio: 100, velocity_30d: 9 },  // 27,000
        { id_producto: 3, precio: 100, velocity_30d: 8 },  // 24,000
        { id_producto: 4, precio: 100, velocity_30d: 5 },  // 15,000
        { id_producto: 5, precio: 100, velocity_30d: 1 },  // 3,000
      ];

      const resultado = calcularClasificacionABC(productos);
      const total = 30000 + 27000 + 24000 + 15000 + 3000; // 99,000

      // Prod 1: 30k/99k = 30.3% → A
      // Prod 2: 57k/99k = 57.6% → A
      // Prod 3: 81k/99k = 81.8% → B (supera 80%)
      // Prod 4: 96k/99k = 97.0% → C (supera 95%)
      // Prod 5: 99k/99k = 100% → C
      expect(resultado[0].clasificacion_abc).toBe('A');
      expect(resultado[1].clasificacion_abc).toBe('A');
      expect(resultado[2].clasificacion_abc).toBe('B');
      expect(resultado[3].clasificacion_abc).toBe('C');
      expect(resultado[4].clasificacion_abc).toBe('C');
    });
  });

  describe('Días de Agotamiento', () => {
    it('Debería calcular correctamente con velocidad normal', () => {
      // 100 unidades, se venden 5/día → 20 días
      expect(calcularDiasAgotamiento(100, 5)).toBe(20);
    });

    it('Debería retornar 999 si la velocidad es prácticamente 0', () => {
      expect(calcularDiasAgotamiento(100, 0)).toBe(999);
      expect(calcularDiasAgotamiento(100, 0.005)).toBe(999);
    });

    it('Debería usar Math.floor (redondeo hacia abajo)', () => {
      // 10 / 3 = 3.33 → 3 días (conservador)
      expect(calcularDiasAgotamiento(10, 3)).toBe(3);
    });
  });

  describe('Alertas de Stock Logístico', () => {
    it('Debería generar stock_critico si se agota antes de que llegue el proveedor', () => {
      // 2 días de stock, proveedor tarda 4 → ¡Crítico!
      expect(determinarAlertaStock(2, 4, 7)).toBe('stock_critico');
    });

    it('Debería generar stock_bajo si estamos en la ventana de reorden', () => {
      // 8 días de stock, lead time 4, freq compra 7 → 8 <= (4+7) = 11 → Advertencia
      expect(determinarAlertaStock(8, 4, 7)).toBe('stock_bajo');
    });

    it('No debería generar alerta si hay stock suficiente', () => {
      // 30 días de stock, lead time 4, freq 7 → 30 > 11 → Sin alerta
      expect(determinarAlertaStock(30, 4, 7)).toBeNull();
    });

    it('Debería ser critico cuando agotamiento = lead time exacto', () => {
      expect(determinarAlertaStock(4, 4, 7)).toBe('stock_critico');
    });
  });

  describe('Alertas de Vencimiento (Cruce con Velocidad)', () => {
    it('Debería generar vencimiento_critico si vence en ≤7 días y quedarán sobrantes', () => {
      // 50 unidades, se vende 1/día, vence en 5 días → venderemos 5, sobran 45
      const resultado = determinarAlertaVencimiento(50, 1, 5);
      expect(resultado).not.toBeNull();
      expect(resultado.tipo).toBe('vencimiento_critico');
      expect(resultado.severidad).toBe('critico');
      expect(resultado.sobrantes).toBe(45);
    });

    it('Debería generar vencimiento_proximo si vence en ≤30 días con sobrantes', () => {
      // 100 unidades, se vende 2/día, vence en 20 días → venderemos 40, sobran 60
      const resultado = determinarAlertaVencimiento(100, 2, 20);
      expect(resultado).not.toBeNull();
      expect(resultado.tipo).toBe('vencimiento_proximo');
      expect(resultado.severidad).toBe('advertencia');
      expect(resultado.sobrantes).toBe(60);
    });

    it('No debería generar alerta si alcanzamos a vender todo', () => {
      // 10 unidades, se vende 5/día, vence en 5 días → venderemos 25, sobran -15 → OK
      const resultado = determinarAlertaVencimiento(10, 5, 5);
      expect(resultado).toBeNull();
    });

    it('No debería generar alerta si vence en más de 30 días', () => {
      const resultado = determinarAlertaVencimiento(100, 1, 60);
      expect(resultado).toBeNull();
    });
  });

  describe('Sobrestock (Capital Estancado)', () => {
    it('Debería detectar sobrestock: clase C, sobre máximo, +60 días de stock', () => {
      expect(determinarSobrestock(200, 100, 'C', 90)).toBe(true);
    });

    it('No debería marcar sobrestock si es clase A (producto importante)', () => {
      expect(determinarSobrestock(200, 100, 'A', 90)).toBe(false);
    });

    it('No debería marcar sobrestock si no supera el máximo', () => {
      expect(determinarSobrestock(50, 100, 'C', 90)).toBe(false);
    });

    it('No debería marcar sobrestock si se agota en menos de 60 días', () => {
      expect(determinarSobrestock(200, 100, 'C', 30)).toBe(false);
    });
  });
});
