/**
 * @file recomendacionesDashboard.js
 * @description Reglas puras (sin BD ni OpenAI) del Consejero IA del Dashboard:
 * qué productos se le entregan a la IA y qué recomendaciones se muestran.
 *
 * Motivo: `base_load` es la cantidad a pedir (stock objetivo − stock actual, mínimo 0).
 * Antes se entregaban a la IA los 8 productos que más facturan aunque tuvieran stock de sobra
 * (base_load = 0). La IA razonaba "aumenta el pedido" y el resultado se mostraba como "+0u",
 * mientras los productos que sí necesitaban reposición nunca llegaban al Consejero.
 *
 * @module utils/recomendacionesDashboard
 */

// Menor número = más urgente
const PRIORIDAD_RIESGO = { 'CRÍTICO': 0, 'MEDIO': 1, 'BAJO': 2 };

/**
 * Elige los productos que realmente necesitan reposición (base_load > 0), primero los de mayor
 * riesgo de quiebre y, a igualdad de riesgo, el orden de entrada (los más facturados primero,
 * porque el snapshot llega ordenado por ingresos).
 *
 * @param {Array<{base_load:number, risk:string}>} items - Productos analizados.
 * @param {number} [limite=8] - Máximo de productos que se envían a la IA.
 * @returns {Array} Subconjunto ordenado por urgencia.
 */
function seleccionarCandidatosReabastecimiento(items, limite = 8) {
  return items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => Number(item.base_load) > 0)
    .sort((a, b) => {
      const pa = PRIORIDAD_RIESGO[a.item.risk] ?? 3;
      const pb = PRIORIDAD_RIESGO[b.item.risk] ?? 3;
      return pa - pb || a.idx - b.idx;
    })
    .slice(0, limite)
    .map(({ item }) => item);
}

/**
 * Una recomendación solo es accionable si sugiere comprar al menos una unidad.
 * @param {{final:number}} rec
 * @returns {boolean}
 */
function esRecomendacionAccionable(rec) {
  return Boolean(rec) && Number.isFinite(rec.final) && rec.final > 0;
}

module.exports = { seleccionarCandidatosReabastecimiento, esRecomendacionAccionable, PRIORIDAD_RIESGO };
