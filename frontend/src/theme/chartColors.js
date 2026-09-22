// Colores de gráficas: única fuente de verdad (los componentes no llevan hex sueltos).
// Recharts pinta con atributos SVG, no con clases de Tailwind, por eso los valores viven aquí.
// Deben coincidir con los tokens de `@theme` en `src/index.css`.
export const CHART = {
  // Series
  primary: '#252C93',   // azul
  secondary: '#E08A00', // ámbar (solo relleno/trazo, nunca texto)
  positive: '#0B6B45',  // exito
  line: '#0E9A5F',      // verde vivo para líneas sobre barras azules (3,5:1 sobre blanco); con halo blanco
  negative: '#B42A26',  // peligro
  soft: '#989DE2',      // indigo-300
  neutral: '#8F94B8',   // slate-400
  onDark: '#FFD84A',    // resaltador: serie protagonista sobre panel tinta (el azul no se ve: 1,52:1)

  // Estructura de la gráfica sobre fondo claro
  grid: '#EEF0F8',      // papel
  axis: '#4F5480',      // slate-600 (4,5:1 mínimo para texto de ejes)

  // Estructura sobre fondo oscuro (panel tinta)
  ink: '#2B3486',       // menu (mismo azul de la barra lateral)
  inkBorder: '#4A54A8', // menu aclarado
  gridOnDark: 'rgba(255,255,255,0.09)',
  axisOnDark: 'rgba(255,255,255,0.65)',
  labelOnDark: '#C3C7DE', // slate-300

  // Tarjetas por clase ABC (fondo suave y borde de la misma familia que la serie)
  primarySoft: '#DEE0F7',   // indigo-100
  primaryBorder: '#C3C6EF', // indigo-200
  secondarySoft: '#FFF1D6', // amber-100
  secondaryBorder: '#FFE0A3', // amber-200
  neutralSoft: '#EEF0F8',   // slate-100
  neutralBorder: '#DDE0EF', // slate-200
};

export const CHART_SERIES = [CHART.primary, CHART.secondary, CHART.positive, CHART.soft, CHART.neutral];
