import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Estado de error de carga. Sustituye al mensaje de "no hay datos", que engaña: si la petición falló, la lista
 * vacía no significa que no existan registros.
 */
const ErrorState = ({ title = 'No pudimos cargar la información', message = 'Revisa tu conexión e inténtalo de nuevo. Si el problema continúa, avisa al administrador.', onRetry }) => (
  <div role="alert" className="flex flex-col items-center text-center gap-3 py-12 px-6">
    <div className="w-12 h-12 rounded-2xl bg-peligro-suave text-peligro flex items-center justify-center">
      <AlertTriangle size={22} aria-hidden="true" />
    </div>
    <p className="font-bold text-tinta">{title}</p>
    {message && <p className="text-sm text-slate-600 max-w-md">{message}</p>}
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-azul hover:bg-azul-hondo text-white text-xs font-bold transition-colors"
      >
        <RefreshCw size={14} aria-hidden="true" /> Reintentar
      </button>
    )}
  </div>
);

export default ErrorState;
