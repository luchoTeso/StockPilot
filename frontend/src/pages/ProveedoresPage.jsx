import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useSidebar } from '../context/SidebarContext';

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  
  // Modals state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  
  const [smartCart, setSmartCart] = useState(null); // Data if AI has been invoked
  const [riskEval, setRiskEval] = useState(null);
  const [isConsultingAI, setIsConsultingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // History state
  const [ordenesHistory, setOrdenesHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryDetail, setShowHistoryDetail] = useState(null);
  const [ordenDetail, setOrdenDetail] = useState([]);

  const toast = useToast();

  useEffect(() => {
    fetchProveedores();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/ordenes/historial');
      if (res.data.success) setOrdenesHistory(res.data.data);
    } catch (e) {
      console.error('Error cargando historial:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/proveedores');
      if (res.data.success) {
        setProveedores(res.data.data);
      }
    } catch (e) {
      toast.error('Error cargando la lista de proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForecast = async (proveedor) => {
    try {
      setSelectedSupplier(proveedor);
      setSmartCart(null);
      setRiskEval(null);
      setShowOrderModal(true);
      
      const res = await axios.get(`/api/proveedores/${proveedor.id_proveedor}/forecast`);
      if (res.data.success) {
        setForecastData(res.data.recomendaciones_matematicas);
      }
    } catch (e) {
      toast.error('Error calculando la demanda base');
    }
  };

  const requestCopilot = async () => {
    if (forecastData.length === 0) return toast.info('No hay productos críticos para recomendar.');
    
    setIsConsultingAI(true);
    try {
      const res = await axios.post(`/api/proveedores/${selectedSupplier.id_proveedor}/ai-copilot`, {
        recomendaciones_matematicas: forecastData,
        presupuesto_maximo: 5000000 // Presupuesto quemado para efectos de demo
      });
      if (res.data.success) {
        // Inicializar smartCart con campo 'incluido'
        const cartWithFlags = res.data.carrito_inteligente.map(i => ({ ...i, incluido: true }));
        setSmartCart(cartWithFlags);
        setRiskEval(res.data.evaluacion_riesgo);
        toast.success('El Copiloto IA ha analizado el carrito exitosamente.');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Falló la consulta al Oráculo IA');
    } finally {
      setIsConsultingAI(false);
    }
  };

  const handleToggleItem = (productId) => {
    const updated = smartCart.map(item => 
      item.id_producto === productId ? { ...item, incluido: !item.incluido } : item
    );
    setSmartCart(updated);
    recalculateRisk(updated);
  };

  const handleEditQty = (productId, newQty) => {
    const qty = parseInt(newQty) || 0;
    const updated = smartCart.map(item => {
      if (item.id_producto === productId) {
        const unitCost = item.presupuesto_estimado_final / (item.sugerencia_final || 1);
        return { 
          ...item, 
          sugerencia_final: qty, 
          presupuesto_estimado_final: Math.round(qty * unitCost)
        };
      }
      return item;
    });
    setSmartCart(updated);
    recalculateRisk(updated);
  };

  const recalculateRisk = (currentCart) => {
    const included = currentCart.filter(i => i.incluido);
    const total = included.reduce((acc, curr) => acc + curr.presupuesto_estimado_final, 0);
    const criticalCount = included.filter(i => i.nivel_riesgo === 'critical').length;
    
    let level = 'Bajo';
    let reason = 'Optimizado manualmente.';
    
    if (total > 5000000) {
      level = 'Alto';
      reason = 'El costo total excede el presupuesto estratégico.';
    } else if (criticalCount > 0) {
      level = 'Medio';
      reason = `Contiene ${criticalCount} ítems con stock crítico.`;
    }

    setRiskEval({
      nivel: level,
      justificacion: reason,
      costo_total_estimado: total
    });
  };

  const fetchOrderDetail = async (orden) => {
    setShowHistoryDetail(orden);
    try {
      const res = await axios.get(`/api/ordenes/${orden.id_orden}`);
      if (res.data.success) setOrdenDetail(res.data.rows || res.data.data);
    } catch (e) {
      toast.error('No se pudo cargar el detalle');
    }
  };

  const submitFinalOrder = async () => {
    setIsSubmitting(true);
    try {
      const includedItems = smartCart.filter(i => i.incluido);
      if (includedItems.length === 0) return toast.error('Debe incluir al menos un producto.');

      const res = await axios.post(`/api/proveedores/${selectedSupplier.id_proveedor}/ordenes`, {
        carrito_final: includedItems,
        evaluacion_riesgo: riskEval,
        estado_deseado: riskEval.nivel === 'Bajo' ? 'Aprobada' : 'Pendiente' // Regla de Negocio
      });
      if (res.data.success) {
        toast.success(`Orden registrada y Auditada (${res.data.orden_id})`);
        setShowOrderModal(false);
        fetchHistory();
      }
    } catch (e) {
      toast.error('Ocurrió un error guardando la Orden');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-fade-in font-outfit">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-inner border border-indigo-200">
              🏢
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Red de Proveedores</h1>
          </div>
          <p className="text-sm font-bold text-slate-400 max-w-xl">
            Centro logístico operado con Inteligencia Artificial. Consulta analíticas de inventario y genera órdenes de reposición trazables.
          </p>
        </div>
      </div>

      {/* SUPPLIERS GRID */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {proveedores.map(p => (
            <div key={p.id_proveedor} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all hover:-translate-y-1">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{p.nombre_empresa}</h3>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">Activo</span>
                </div>
                <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                  👤 {p.contacto_principal || 'Sin Contacto'}
                </p>
                <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                  📦 {p.productos_vinculados} Productos Vinculados
                </p>
              </div>
              
              <button 
                onClick={() => handleOpenForecast(p)}
                className="mt-6 w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Analizar Demanda ⚡
              </button>
            </div>
          ))}
          {proveedores.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-slate-300">
              No hay proveedores registrados.
            </div>
          )}
        </div>
      )}

      {/* SMART ORDER MODAL */}
      {showOrderModal && selectedSupplier && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowOrderModal(false)}></div>
          
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-scale-in border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Orden a: {selectedSupplier.nombre_empresa}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cálculo de Reabastecimiento Automático</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="w-8 h-8 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto scrollbar-premium flex-1 space-y-6 bg-slate-50/50">
              
              {/* STATUS CARD (RISK ENGINE) */}
              {riskEval && (
                <div className={`p-4 rounded-2xl border-2 flex items-center justify-between \${riskEval.nivel === 'Bajo' ? 'bg-emerald-50 border-emerald-200' : (riskEval.nivel === 'Alto' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200')}`}>
                  <div>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest \${riskEval.nivel === 'Bajo' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Métrica de Riesgo: {riskEval.nivel}
                    </h4>
                    <p className="text-sm font-bold text-slate-600 mt-1">{riskEval.justificacion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presupuesto Estimado</p>
                    <p className="text-xl font-black text-slate-800">${riskEval.costo_total_estimado.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* PRODUCTS LIST */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      {smartCart && <th className="p-4 border-b border-slate-100 w-10">INC.</th>}
                      <th className="p-4 border-b border-slate-100">Producto Crítico</th>
                      <th className="p-4 border-b border-slate-100">Clase</th>
                      <th className="p-4 border-b border-slate-100 text-center">Fórmula Base</th>
                      {smartCart && <th className="p-4 border-b border-slate-100 text-center bg-indigo-50 text-indigo-500">Ajuste IA</th>}
                      <th className="p-4 border-b border-slate-100 text-center text-emerald-600 border-x">Sugerencia Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(smartCart || forecastData).map(item => (
                      <tr key={item.id_producto} className={`border-b last:border-0 border-slate-50 transition-colors ${smartCart && !item.incluido ? 'opacity-40 grayscale' : 'hover:bg-slate-50/50'}`}>
                        {smartCart && (
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={item.incluido} 
                              onChange={() => handleToggleItem(item.id_producto)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                        )}
                        <td className="p-4 max-w-xs">
                          <p className="text-sm font-black text-slate-800">{item.nombre}</p>
                          {item.razon_ia && item.incluido && <p className="text-[10px] leading-tight font-bold text-indigo-500 mt-1 italic">"{item.razon_ia}"</p>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.clasificacion_abc === 'A' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            CLASE {item.clasificacion_abc}
                          </span>
                        </td>
                        <td className="p-4 text-center text-sm font-bold text-slate-400 italic">
                          {item.cantidad_sugerida !== undefined ? item.cantidad_sugerida : item.calculo_base} ud
                        </td>
                        {smartCart && (
                          <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/30">
                            {item.ajuste_ia}
                          </td>
                        )}
                        <td className="p-4 text-center border-x border-slate-50 bg-emerald-50/20">
                          {smartCart ? (
                            <input 
                              type="number"
                              disabled={!item.incluido}
                              value={item.sugerencia_final}
                              onChange={(e) => handleEditQty(item.id_producto, e.target.value)}
                              className="w-20 bg-transparent text-center font-black text-emerald-600 text-lg border-b-2 border-emerald-200 focus:border-emerald-500 outline-none"
                            />
                          ) : (
                            <span className="font-black text-emerald-600 text-lg">{item.cantidad_sugerida}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(smartCart || forecastData).length === 0 && (
                      <tr><td colSpan="6" className="p-8 text-center text-sm font-bold text-slate-400 italic uppercase tracking-widest">Calculando Oráculo Matemático...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer Align Action */}
            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 justify-end items-center">
              {!smartCart ? (
                <button 
                  onClick={requestCopilot}
                  disabled={isConsultingAI || forecastData.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isConsultingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '✨'} 
                  {isConsultingAI ? 'Analizando Oráculo...' : 'Consultar Copiloto IA'}
                </button>
              ) : (
                <>
                  <button onClick={() => setSmartCart(null)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest px-4">
                    Descartar IA
                  </button>
                  <button 
                    onClick={submitFinalOrder}
                    disabled={isSubmitting}
                    className={`text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                      riskEval?.nivel === 'Bajo' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                        : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                    }`}
                  >
                    {isSubmitting ? 'Guardando Trazabilidad...' : (riskEval?.nivel === 'Bajo' ? 'Aprobar Auto-Orden' : 'Enviar a Revisión')}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
      {/* HISTORY PANEL */}
      <div className="relative z-10 pt-10 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">📜</span>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Historial de Órdenes Inteligentes</h2>
        </div>
        
        {loadingHistory ? (
          <div className="h-40 bg-white rounded-3xl animate-pulse"></div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-5">Fecha</th>
                  <th className="p-5">Proveedor</th>
                  <th className="p-5">Riesgo</th>
                  <th className="p-5">Presupuesto</th>
                  <th className="p-5">Estado</th>
                  <th className="p-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ordenesHistory.map(o => (
                  <tr key={o.id_orden} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-xs font-bold text-slate-500">{new Date(o.fecha_creacion).toLocaleDateString()}</td>
                    <td className="p-5 text-sm font-black text-slate-800">{o.proveedor_nombre}</td>
                    <td className="p-5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${o.riesgo === 'Alto' ? 'bg-rose-100 text-rose-600' : (o.riesgo === 'Medio' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}`}>
                        {o.riesgo}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-black text-slate-700">${o.presupuesto_total.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${o.estado === 'Aprobada' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {o.estado}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => fetchOrderDetail(o)}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                      >
                        Ver Detalle →
                      </button>
                    </td>
                  </tr>
                ))}
                {ordenesHistory.length === 0 && (
                  <tr><td colSpan="6" className="p-10 text-center text-sm font-bold text-slate-400 italic uppercase">No hay órdenes registradas aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showHistoryDetail && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowHistoryDetail(null)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 uppercase italic">Detalle de Orden #{showHistoryDetail.id_orden}</h2>
              <button onClick={() => setShowHistoryDetail(null)} className="text-2xl text-slate-400 hover:text-rose-500 transition-colors">×</button>
            </div>

            {/* Metadata de la orden */}
            <div className="px-6 pt-5 pb-3 grid grid-cols-3 gap-3">
              <div className="col-span-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{showHistoryDetail.proveedor_nombre}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{(() => { const r = (showHistoryDetail.fecha_creacion || '').split('T')[0]; const [y,m,d] = r.split('-'); return (y && m && d) ? `${d}/${m}/${y}` : r; })()}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Presupuesto</p>
                <p className="text-sm font-black text-slate-800 mt-1">${showHistoryDetail.presupuesto_total?.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl p-3 border ${showHistoryDetail.estado === 'Aprobada' ? 'bg-emerald-50 border-emerald-200' : showHistoryDetail.estado === 'Rechazada' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                <p className={`text-sm font-black mt-1 ${showHistoryDetail.estado === 'Aprobada' ? 'text-emerald-600' : showHistoryDetail.estado === 'Rechazada' ? 'text-rose-600' : 'text-amber-600'}`}>{showHistoryDetail.estado}</p>
              </div>
            </div>

            <div className="px-6 pb-6 max-h-[40vh] overflow-y-auto scrollbar-premium">
              <div className="space-y-3">
                {ordenDetail.map(det => (
                  <div key={det.id_detalle} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase">{det.nombre_producto}</p>
                      <p className="text-[10px] font-bold text-slate-400">Base: {det.cantidad_base} ud → Final: <span className="text-emerald-600">{det.cantidad_final} ud</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase">Ajuste IA</p>
                      <p className="text-sm font-black text-indigo-600">{det.sugerencia_ia > 0 ? '+' : ''}{det.sugerencia_ia}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones de Revisión (solo para Pendiente/Borrador) */}
            {(showHistoryDetail.estado === 'Pendiente' || showHistoryDetail.estado === 'Borrador') && (
              <div className="p-5 border-t border-slate-100 bg-amber-50/50 flex gap-3 justify-end items-center">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mr-auto flex items-center gap-2">
                  ⚠️ Esta orden requiere su aprobación
                </span>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.patch(`/api/ordenes/${showHistoryDetail.id_orden}/estado`, { estado: 'Rechazada' });
                      if (res.data.success) {
                        toast.success('Orden rechazada correctamente.');
                        setShowHistoryDetail(null);
                        fetchHistory();
                      }
                    } catch (e) { toast.error(e.response?.data?.error || 'Error al rechazar'); }
                  }}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 transition-all active:scale-95"
                >
                  ✕ Rechazar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.patch(`/api/ordenes/${showHistoryDetail.id_orden}/estado`, { estado: 'Aprobada' });
                      if (res.data.success) {
                        toast.success('¡Orden aprobada! Lista para enviar al proveedor.');
                        setShowHistoryDetail(null);
                        fetchHistory();
                      }
                    } catch (e) { toast.error(e.response?.data?.error || 'Error al aprobar'); }
                  }}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  ✓ Aprobar Orden
                </button>
              </div>
            )}

            {/* Estado final (para órdenes ya aprobadas o rechazadas) */}
            {showHistoryDetail.estado === 'Aprobada' && (
              <div className="p-4 border-t border-emerald-100 bg-emerald-50 text-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ Orden aprobada y lista para enviar al proveedor</span>
              </div>
            )}
            {showHistoryDetail.estado === 'Rechazada' && (
              <div className="p-4 border-t border-rose-100 bg-rose-50 text-center">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">✕ Orden rechazada</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProveedoresPage;
