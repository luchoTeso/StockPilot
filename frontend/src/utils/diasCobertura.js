// `days_to_exhaust` viene de utils/reposicion.js (backend): `null` cuando no hay ventas recientes
// para medir cuánto durará el stock. Antes se representaba como `Infinity`; se acepta también aquí
// por si algún consumidor viejo todavía lo normaliza así.
export const esEstable = (d) => d === null || d === undefined || d === Infinity;
export const formatDias = (d) => (esEstable(d) ? 'Sin ventas recientes' : `${d} días`);
