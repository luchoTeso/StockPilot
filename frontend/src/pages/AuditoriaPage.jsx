import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Search, LayoutDashboard, Building2, X } from 'lucide-react';

const AuditoriaPage = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, desde_dashboard: 0, desde_proveedores: 0, ultima_consulta: null });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filtroFuente, setFiltroFuente] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const fetchData = useCallback(async (page = 1, signal) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filtroFuente) params.fuente = filtroFuente;

      const [logsRes, statsRes] = await Promise.all([
        axios.get('/api/auditoria', { params, ...(signal && { signal }) }),
        axios.get('/api/auditoria/stats', { ...(signal && { signal }) })
      ]);

      if (signal && signal.aborted) return;

      if (logsRes.data.success) {
        setLogs(logsRes.data.data);
        setPagination(logsRes.data.pagination);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      if (axios.isCancel(err) || (signal && signal.aborted)) return;
      if (err.response?.status === 403) {
        toast.error('Acceso denegado. Solo administradores.');
      } else {
        toast.error('Error cargando auditoría');
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, [filtroFuente, toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(1, controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const formatFecha = (f) => {
    if (!f) return '---';
    const d = new Date(f);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Bogota' }) +
      ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
  };

  const parseSafe = (json) => {
    try { return JSON.parse(json); } catch { return []; }
  };

  return (
    <>
    <div className="animate-fade-in pb-12 font-outfit">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shadow-inner border border-violet-100"><Search size={20} /></div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Historial del Copiloto</h2>
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Revisa el por qué de las decisiones y sugerencias de compra</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Consultas</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100">
          <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Desde Dashboard</p>
          <p className="text-3xl font-black text-violet-700 mt-1">{stats.desde_dashboard}</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Desde Proveedores</p>
          <p className="text-3xl font-black text-indigo-700 mt-1">{stats.desde_proveedores}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Última Consulta</p>
          <p className="text-sm font-black text-slate-700 mt-2">{formatFecha(stats.ultima_consulta)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar:</p>
        {['', 'dashboard', 'proveedor'].map(f => (
          <button
            key={f}
            onClick={() => setFiltroFuente(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border ${
              filtroFuente === f 
                ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300'
            }`}
          >
            {f === '' ? 'Todas' : f === 'dashboard' ? 'Dashboard' : 'Proveedores'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                <th className="p-6 pl-8">Fecha y Hora</th>
                <th className="p-6">Origen</th>
                <th className="p-6">Motor utilizado</th>
                <th className="p-6">Productos</th>
                <th className="p-6">Resultado</th>
                <th className="p-6 pr-8 text-right">Revisar</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Consultando Registros de Auditoría...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay registros de auditoría</td></tr>
              ) : logs.map(log => {
                const datosBase = parseSafe(log.datos_base_json);
                const productCount = Array.isArray(datosBase) ? datosBase.length : 0;
                const fuente = log.id_orden ? 'Proveedor' : 'Dashboard';

                return (
                  <tr key={log.id_auditoria} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6 pl-8">
                      <p className="font-black text-slate-800 text-sm">{formatFecha(log.fecha_auditoria)}</p>
                    </td>
                    <td className="p-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        fuente === 'Dashboard' 
                          ? 'bg-violet-50 text-violet-600 border border-violet-100' 
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        {fuente === 'Dashboard'
                          ? <span className="flex items-center gap-1"><LayoutDashboard size={10} /> Dashboard</span>
                          : <span className="flex items-center gap-1"><Building2 size={10} /> {log.proveedor_nombre || 'Proveedor'}</span>
                        }
                      </span>
                    </td>
                    <td className="p-6 text-slate-600 font-bold text-xs truncate max-w-[180px]" title={log.prompt_utilizado}>
                      {log.prompt_utilizado || '---'}
                    </td>
                    <td className="p-6">
                      <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[10px] font-black">{productCount} ítems</span>
                    </td>
                    <td className="p-6 text-slate-600 font-bold text-xs truncate max-w-[150px]" title={log.impacto_decision}>
                      {log.impacto_decision || '---'}
                    </td>
                    <td className="p-6 pr-8 text-right">
                      <button
                        onClick={() => setDetailModal(log)}
                        className="px-4 py-2 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-100 transition-colors transition-transform shadow-sm hover:scale-105"
                      >
                        Inspeccionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Página {pagination.page} de {pagination.totalPages} • {pagination.total} registros
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchData(pagination.page - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30"
              >
                ← Anterior
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1)}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black hover:bg-violet-700 transition-colors disabled:opacity-30 shadow-sm"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

    </div>

    {/* Modal Detalle — portal directo a document.body para evitar stacking context del sidebar */}
    {detailModal && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDetailModal(null)} role="presentation" aria-hidden="true"></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl animate-scale-in relative z-10" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-violet-50 rounded-t-[2.5rem]">
              <div>
                <h3 className="text-xl font-black text-violet-800 tracking-tighter uppercase italic">Detalle de la sugerencia</h3>
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mt-1">{formatFecha(detailModal.fecha_auditoria)}</p>
              </div>
              <button onClick={() => setDetailModal(null)} aria-label="Cerrar modal" className="w-10 h-10 bg-white border border-violet-200 text-violet-400 rounded-xl hover:text-rose-500 flex items-center justify-center transition-colors"><X size={16} /></button>
            </div>

            {/* Metadata */}
            <div className="p-6 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fuente</p>
                <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
                  {detailModal.id_orden
                    ? <><Building2 size={14} /> Orden #{detailModal.id_orden}</>
                    : <><LayoutDashboard size={14} /> Dashboard</>
                  }
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Motor</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{detailModal.prompt_utilizado}</p>
              </div>
              {detailModal.proveedor_nombre && (
                <div className="col-span-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Proveedor</p>
                  <p className="text-sm font-bold text-indigo-800 mt-1">{detailModal.proveedor_nombre}</p>
                </div>
              )}
            </div>

            {/* Razón IA */}
            <div className="px-6 pb-4">
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-1">Razón / Contexto IA</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{detailModal.razon_ia || 'Sin razón registrada'}</p>
              </div>
            </div>

            {/* Tabla de productos evaluados */}
            <div className="px-6 pb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Productos Evaluados</p>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-[9px] text-white font-black uppercase tracking-widest">
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3 text-center">Base</th>
                      <th className="px-4 py-3 text-center">Ajuste IA</th>
                      <th className="px-4 py-3 text-center">Final</th>
                      <th className="px-4 py-3">Razón</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      let sugerencias = parseSafe(detailModal.sugerencia_ia_json);
                      let datosBase = parseSafe(detailModal.datos_base_json);

                      // Si no es un array, lo convertimos para que la tabla mapee bien (Resiliencia)
                      if (sugerencias && typeof sugerencias === 'object' && !Array.isArray(sugerencias)) sugerencias = [sugerencias];
                      if (datosBase && typeof datosBase === 'object' && !Array.isArray(datosBase)) datosBase = [datosBase];

                      if (Array.isArray(sugerencias) && sugerencias.length > 0) {
                        return sugerencias.map((s, i) => {
                          const itemBase = Array.isArray(datosBase) ? datosBase[i] : datosBase;
                          const baseVal = s.base || itemBase?.base || itemBase?.precio || s.originalPrice || '---';
                          
                          const name = s.product || s.productName || itemBase?.product || itemBase?.nombre_producto || null;
                          const id = s.id || s.id_producto || itemBase?.id || itemBase?.id_producto || '';
                          const displayName = name || (id ? `Producto #${id}` : 'Producto');
                          
                          return (
                            <tr key={displayName} className="hover:bg-white transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800 uppercase italic text-[11px] tracking-tight">{displayName}</td>
                              <td className="px-4 py-3 text-center font-black text-slate-600">${baseVal.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`font-black ${(s.adjustment || s.ajuste || '').toString().includes('+') || (s.discount && s.type !== 'discount') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {s.adjustment || s.ajuste || (s.discount ? `-${s.discount}%` : '---')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-black text-indigo-600">
                                ${(s.final || s.nuevo_precio || s.discountedPrice || '---').toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500 italic leading-snug">{s.reason || s.razon || detailModal.razon_ia}</td>
                            </tr>
                          );
                        });
                      }

                      return (
                        <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No pudimos cargar el detalle para esta acción</td></tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button onClick={() => setDetailModal(null)} className="w-full py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                Cerrar Inspección
              </button>
            </div>
          </div>
        </div>,
      document.body
    )}
    </>
  );
};

export default AuditoriaPage;
