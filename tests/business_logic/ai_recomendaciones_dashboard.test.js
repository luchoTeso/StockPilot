import { describe, it, expect } from 'vitest';

/**
 * Reglas puras del Consejero IA del Dashboard (utils/recomendacionesDashboard.js).
 * Regresión: la tarjeta mostraba "Sugerido: +0u" porque se analizaban los productos más
 * facturados aunque tuvieran stock de sobra (base_load = 0).
 */
import recomendaciones from '../../utils/recomendacionesDashboard.js';

const { seleccionarCandidatosReabastecimiento, esRecomendacionAccionable } = recomendaciones;

const item = (nombre, base_load, risk) => ({ nombre, base_load, risk });

describe('Consejero IA — selección de candidatos', () => {
  it('Excluye los productos con base_load = 0 (stock de sobra), aunque sean los más facturados', () => {
    const items = [item('Arroz', 0, 'BAJO'), item('Agua', 0, 'BAJO'), item('Pan', 6, 'BAJO')];
    expect(seleccionarCandidatosReabastecimiento(items).map(i => i.nombre)).toEqual(['Pan']);
  });

  it('Ordena por urgencia: CRÍTICO antes que MEDIO y BAJO', () => {
    const items = [item('A', 5, 'BAJO'), item('B', 5, 'MEDIO'), item('C', 5, 'CRÍTICO')];
    expect(seleccionarCandidatosReabastecimiento(items).map(i => i.nombre)).toEqual(['C', 'B', 'A']);
  });

  it('A igual riesgo conserva el orden de entrada (los más facturados primero)', () => {
    const items = [item('Top', 3, 'CRÍTICO'), item('Segundo', 9, 'CRÍTICO'), item('Tercero', 1, 'CRÍTICO')];
    expect(seleccionarCandidatosReabastecimiento(items).map(i => i.nombre)).toEqual(['Top', 'Segundo', 'Tercero']);
  });

  it('Respeta el límite de productos enviados a la IA', () => {
    const items = Array.from({ length: 12 }, (_, i) => item(`P${i}`, 1, 'BAJO'));
    expect(seleccionarCandidatosReabastecimiento(items, 8)).toHaveLength(8);
  });

  it('Devuelve vacío si nada necesita reposición (no hay que llamar a la IA)', () => {
    expect(seleccionarCandidatosReabastecimiento([item('A', 0, 'BAJO'), item('B', 0, 'CRÍTICO')])).toEqual([]);
  });

  it('Un riesgo desconocido se trata como el menos urgente', () => {
    const items = [item('X', 2, 'RARO'), item('Y', 2, 'BAJO')];
    expect(seleccionarCandidatosReabastecimiento(items).map(i => i.nombre)).toEqual(['Y', 'X']);
  });
});

describe('Consejero IA — recomendación accionable', () => {
  it('Acepta sugerencias de una o más unidades', () => {
    expect(esRecomendacionAccionable({ final: 1 })).toBe(true);
    expect(esRecomendacionAccionable({ final: 24 })).toBe(true);
  });

  it('Rechaza 0 unidades, negativos, no numéricos y nulos', () => {
    expect(esRecomendacionAccionable({ final: 0 })).toBe(false);
    expect(esRecomendacionAccionable({ final: -3 })).toBe(false);
    expect(esRecomendacionAccionable({ final: 'N/A' })).toBe(false);
    expect(esRecomendacionAccionable(null)).toBe(false);
  });
});
