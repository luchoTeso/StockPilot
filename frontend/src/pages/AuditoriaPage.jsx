import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Search, LayoutDashboard, Building2, X } from 'lucide-react';

const AuditoriaPage = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, desde_dashboard: 0, desde_proveedores: 0, desde_fiados: 0, ultima_consulta: null });
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
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-azul/10 text-azul rounded-lg flex items-center justify-center shadow-inner border border-azul/30"><Search size={20} /></div>
            <h2 className="titular text-4xl text-tinta">Historial del Copiloto</h2>
          </div>
          <p className="text-slate-500 font-bold text-xs mt-1">Revisa el por qué de las decisiones y sugerencias de compra</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500">Total Consultas</p>
          <p className="text-3xl font-bold text-tinta mt-1">{stats.total}</p>
        </div>
        <div className="bg-azul/10 rounded-2xl p-5 border border-azul/30">
          <p className="text-xs font-bold text-azul">Desde Dashboard</p>
          <p className="text-3xl font-bold text-azul mt-1">{stats.desde_dashboard}</p>
        </div>
        <div className="bg-azul/10 rounded-2xl p-5 border border-azul/30">
          <p className="text-xs font-bold text-azul">Desde Proveedores</p>
          <p className="text-3xl font-bold text-azul mt-1">{stats.desde_proveedores}</p>
        </div>
        <div className="bg-azul/10 rounded-2xl p-5 border border-azul/30">
          <p className="text-xs font-bold text-azul">Desde Fiados</p>
          <p className="text-3xl font-bold text-azul mt-1">{stats.desde_fiados || 0}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <p className="text-xs font-bold text-slate-500">Última Consulta</p>
          <p className="text-sm font-bold text-tinta-2 mt-2">{formatFecha(stats.ultima_consulta)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <p className="text-xs font-bold text-slate-500">Filtrar:</p>
        {['', 'dashboard', 'proveedor', 'fiados'].map(f => (
          <button
            key={f}
            onClick={() => setFiltroFuente(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
              filtroFuente === f 
                ? 'bg-azul text-white border-azul shadow-lg' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-azul/30'
            }`}
          >
            {f === '' ? 'Todas' : f === 'dashboard' ? 'Dashboard' : f === 'proveedor' ? 'Proveedores' : 'Fiados'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-tinta text-xs text-white font-bold">
                <th className="p-6 pl-8 rounded-tl-2xl text-left">Fecha y Hora</th>
                <th className="p-6 text-left">Origen</th>
                <th className="p-6 text-left">Productos</th>
                <th className="p-6 text-left">Resultado</th>
                <th className="p-6 pr-8 text-right rounded-tr-2xl">Revisar</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-12 text-slate-500 font-bold text-xs animate-pulse">Consultando Registros de Auditoría...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-slate-500 font-bold text-xs">No hay registros de auditoría</td></tr>
              ) : logs.map(log => {
                const datosBase = parseSafe(log.datos_base_json);
                let productCount = Array.isArray(datosBase) ? datosBase.length : (datosBase && datosBase.items ? datosBase.items.length : 0);
                
                let fuente = 'Dashboard';
                if (log.id_orden) fuente = 'Proveedor';
                else if (log.motor_ia?.includes('Fiados') || log.impacto_decision?.startsWith('Perfil:')) {
                  fuente = 'Fiados';
                  productCount = 1; // Un cliente
                }

                return (
                  <tr key={log.id_auditoria} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6 pl-8">
                      <p className="font-bold text-tinta text-sm">{formatFecha(log.fecha_auditoria)}</p>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                        fuente === 'Dashboard' 
                          ? 'bg-azul/10 text-azul border border-azul/30' 
                          : fuente === 'Fiados'
                          ? 'bg-azul/10 text-azul border border-azul/30'
                          : 'bg-azul/10 text-azul border border-azul/30'
                      }`}>
                        {fuente === 'Dashboard'
                          ? <><LayoutDashboard size={10} /> Dashboard</>
                          : fuente === 'Fiados'
                          ? <><Building2 size={10} /> Fiados</>
                          : <><Building2 size={10} /> {log.proveedor_nombre || 'Proveedor'}</>
                        }
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="bg-slate-100 text-tinta px-3 py-1 rounded-full text-xs font-bold">{productCount} ítems</span>
                    </td>
                    <td className="p-6 text-slate-600 font-bold text-xs truncate max-w-[150px]" title={log.impacto_decision}>
                      {log.impacto_decision || '---'}
                    </td>
                    <td className="p-6 pr-8 text-right">
                      <button
                        onClick={() => setDetailModal(log)}
                        className="px-4 py-2 bg-azul/10 text-azul hover:bg-azul-hondo hover:text-white rounded-lg text-xs font-bold border border-azul/30 transition-colors transition-transform shadow-sm"
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
            <p className="text-xs font-bold text-slate-500">
              Página {pagination.page} de {pagination.totalPages} • {pagination.total} registros
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchData(pagination.page - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30"
              >
                ← Anterior
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1)}
                className="px-4 py-2 bg-azul text-white rounded-lg text-xs font-bold hover:bg-azul-hondo transition-colors disabled:opacity-30 shadow-sm"
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
          <div className="absolute inset-0 bg-tinta/60 backdrop-blur-sm" onClick={() => setDetailModal(null)} role="presentation" aria-hidden="true"></div>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide shadow-lg animate-scale-in relative z-10" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-azul/10 rounded-t-2xl">
              <div>
                <h3 className="titular text-xl text-azul">Detalle de la sugerencia</h3>
                <p className="text-xs font-bold text-azul mt-1">{formatFecha(detailModal.fecha_auditoria)}</p>
              </div>
              <button onClick={() => setDetailModal(null)} aria-label="Cerrar modal" className="w-10 h-10 bg-white border border-azul/30 text-azul rounded-lg hover:text-rose-500 flex items-center justify-center transition-colors"><X size={16} /></button>
            </div>

            {/* Metadata */}
            <div className="p-6 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Fuente</p>
                <p className="text-sm font-bold text-tinta mt-1 flex items-center gap-1">
                  {detailModal.id_orden
                    ? <><Building2 size={14} /> Orden #{detailModal.id_orden}</>
                    : <><LayoutDashboard size={14} /> Dashboard</>
                  }
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Motor</p>
                <p className="text-sm font-bold text-tinta mt-1">{detailModal.motor_ia || detailModal.prompt_utilizado?.substring(0, 30) + '...' || 'N/A'}</p>
              </div>
              {detailModal.proveedor_nombre && (
                <div className="col-span-2 bg-azul/10 rounded-2xl p-3 border border-azul/30">
                  <p className="text-xs font-bold text-azul">Proveedor</p>
                  <p className="text-sm font-bold text-azul mt-1">{detailModal.proveedor_nombre}</p>
                </div>
              )}
            </div>

            {/* Razón IA */}
            <div className="px-6 pb-4">
              <div className="bg-azul/10 rounded-2xl p-4 border border-azul/30">
                <p className="text-xs font-bold text-azul mb-1">Razón / Contexto IA</p>
                <p className="text-sm font-medium text-tinta-2 leading-relaxed">{detailModal.razon_ia || 'Sin razón registrada'}</p>
              </div>
            </div>

            {/* Contenido Dinámico por Tipo */}
            {(() => {
              const isFiados = detailModal.motor_ia?.includes('Fiados') || detailModal.impacto_decision?.startsWith('Perfil:');
              const isEstrategia = detailModal.prompt_utilizado?.includes('Estrategia Directa');
              
              if (isFiados) {
                const aiData = parseSafe(detailModal.sugerencia_ia_json);
                const perfil = aiData.perfil || 'Desconocido';
                const riesgo = aiData.riesgo || 'Desconocido';
                const sugerencia = aiData.sugerencia || detailModal.impacto_decision;
                
                return (
                  <div className="px-6 pb-6">
                    <p className="text-xs font-bold text-slate-500 mb-3">Evaluación Crediticia</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">Perfil de Cliente</p>
                        <p className={`text-lg font-bold ${perfil.includes('Buen') ? 'text-exito' : perfil.includes('Mal') ? 'text-peligro' : 'text-aviso'}`}>{perfil}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-1">Nivel de Riesgo</p>
                        <p className={`text-lg font-bold ${riesgo === 'Bajo' ? 'text-exito' : riesgo === 'Alto' ? 'text-peligro' : 'text-aviso'}`}>{riesgo}</p>
                      </div>
                    </div>
                    <div className="bg-azul/10 p-4 rounded-2xl border border-azul/30">
                      <p className="text-xs font-bold text-azul mb-1">Sugerencia IA</p>
                      <p className="text-sm font-bold text-tinta leading-snug">{sugerencia}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="px-6 pb-6">
                  <p className="text-xs font-bold text-slate-500 mb-3">Productos Evaluados</p>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                    <tr className="bg-tinta text-xs text-white font-bold">
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
                          
                          const formatVal = (val) => isEstrategia && !isNaN(val) ? `$${Number(val).toLocaleString()}` : val.toLocaleString();
                          const baseText = baseVal !== '---' ? formatVal(baseVal) : '---';
                          const finalVal = s.final || s.nuevo_precio || s.discountedPrice || '---';
                          const finalText = finalVal !== '---' ? formatVal(finalVal) : '---';
                          
                          return (
                            <tr key={displayName} className="hover:bg-white transition-colors">
                              <td className="px-4 py-3 font-bold text-tinta text-xs">{displayName}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-600">{baseText}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`font-bold ${(s.adjustment || s.ajuste || '').toString().includes('+') || (s.discount && s.type !== 'discount') ? 'text-exito' : 'text-peligro'}`}>
                                  {s.adjustment || s.ajuste || (s.discount ? `-${s.discount}%` : '---')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-azul">{finalText}</td>
                              <td className="px-4 py-3 text-xs text-slate-500 leading-snug">{s.reason || s.razon || detailModal.razon_ia}</td>
                            </tr>
                          );
                        });
                      }

                      return (
                        <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500 text-xs font-bold">No pudimos cargar el detalle para esta acción</td></tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
              );
            })()}

            {/* Footer */}
            <div className="px-6 pb-6">
              <button onClick={() => setDetailModal(null)} className="w-full py-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
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
