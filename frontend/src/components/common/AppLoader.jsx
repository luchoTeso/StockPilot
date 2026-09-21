/**
 * Pantalla de carga inicial mientras se verifica la sesión. Sin ella, si el servidor tarda (arranque en frío de la
 * base de datos), la aplicación se veía completamente en blanco y parecía rota.
 */
const AppLoader = () => (
  <div role="status" aria-live="polite" className="min-h-screen flex flex-col items-center justify-center gap-4 bg-papel">
    <div className="animate-spin w-10 h-10 border-4 border-azul border-t-transparent rounded-full"></div>
    <p className="text-sm font-bold text-tinta-2">Cargando StockPilot…</p>
  </div>
);

export default AppLoader;
