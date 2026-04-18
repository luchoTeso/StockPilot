import { describe, it, expect } from 'vitest';

/**
 * Extracción directa de la lógica de feedbackController.js (líneas 71-94).
 * Probamos el cálculo de precisión de la IA sin tocar la base de datos.
 */

import feedbackController from '../../controllers/feedbackController.js';

const {
  calcularPeriodoObjetivo,
  proyectarVentas,
  calcularFactorPrecision,
  determinarVeredicto
} = feedbackController;

// === PRUEBAS UNITARIAS ===

describe('Módulo de Feedback IA (feedbackController.js)', () => {

  describe('Periodo Objetivo Adaptativo', () => {
    it('Debería usar max(lead_time * 2, 14) → Lead time 7 → 14 días', () => {
      expect(calcularPeriodoObjetivo(7)).toBe(14);
    });

    it('Debería escalar con lead times largos → Lead time 10 → 20 días', () => {
      expect(calcularPeriodoObjetivo(10)).toBe(20);
    });

    it('Debería usar mínimo 14 días si lead time es muy corto', () => {
      expect(calcularPeriodoObjetivo(3)).toBe(14);
      expect(calcularPeriodoObjetivo(1)).toBe(14);
    });

    it('Debería usar fallback de 3 si lead time es null/undefined', () => {
      expect(calcularPeriodoObjetivo(null)).toBe(14); // max(3*2, 14) = 14
      expect(calcularPeriodoObjetivo(undefined)).toBe(14);
    });
  });

  describe('Proyección de Ventas', () => {
    it('Debería proyectar ventas si no ha pasado el periodo completo', () => {
      // Vendimos 50 en 7 días, periodo objetivo es 14 → proyección = (50/7)*14 = 100
      expect(proyectarVentas(50, 7, 14)).toBe(100);
    });

    it('Debería usar ventas reales si ya pasó el periodo completo', () => {
      expect(proyectarVentas(120, 20, 14)).toBe(120);
    });

    it('Debería proyectar correctamente con 1 día transcurrido', () => {
      // 10 vendidos en 1 día, periodo 14 → 140
      expect(proyectarVentas(10, 1, 14)).toBe(140);
    });
  });

  describe('Factor de Precisión con Clamping', () => {
    it('Debería calcular factor correcto: IA sugirió 100, se vendieron 50 → 0.5', () => {
      const factor = calcularFactorPrecision(50, 100);
      expect(factor).toBe(0.5);
    });

    it('Debería calcular factor 1.0 cuando la IA acertó perfectamente', () => {
      const factor = calcularFactorPrecision(100, 100);
      expect(factor).toBe(1.0);
    });

    it('Debería aplicar clamping mínimo (0.2) si ventas son 0', () => {
      // 0 / 100 = 0 → clamp a 0.2
      const factor = calcularFactorPrecision(0, 100);
      expect(factor).toBe(0.2);
    });

    it('Debería aplicar clamping máximo (3.0) si la IA subestimó enormemente', () => {
      // 500 / 100 = 5.0 → clamp a 3.0
      const factor = calcularFactorPrecision(500, 100);
      expect(factor).toBe(3.0);
    });

    it('Debería manejar sugerido = 0 con ventas > 0 → factor fijo 2.0', () => {
      const factor = calcularFactorPrecision(50, 0);
      expect(factor).toBe(2.0);
    });

    it('Debería manejar ambos en 0 → factor por defecto 1.0', () => {
      const factor = calcularFactorPrecision(0, 0);
      // sugerido no es > 0, y ventasProyectadas no es > 0 → factor = 1.0
      expect(factor).toBe(1.0);
    });
  });

  describe('Veredicto de Precisión', () => {
    it('Factor 1.0 → Acertado', () => {
      expect(determinarVeredicto(1.0)).toBe('Acertado');
    });

    it('Factor 0.95 → Acertado (dentro del margen ±10%)', () => {
      expect(determinarVeredicto(0.95)).toBe('Acertado');
    });

    it('Factor 0.5 → Sugirió de más', () => {
      expect(determinarVeredicto(0.5)).toBe('Sugirió de más');
    });

    it('Factor 1.5 → Sugirió de menos', () => {
      expect(determinarVeredicto(1.5)).toBe('Sugirió de menos');
    });

    it('Factor 0.2 (mínimo) → Sugirió de más', () => {
      expect(determinarVeredicto(0.2)).toBe('Sugirió de más');
    });

    it('Factor 3.0 (máximo) → Sugirió de menos', () => {
      expect(determinarVeredicto(3.0)).toBe('Sugirió de menos');
    });
  });
});
