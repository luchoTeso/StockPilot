import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Tooltip from '../components/Tooltip';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SYNC_EVENTS, subscribeToSync } from '../utils/stockSync';

const DashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const storeKey = user?.tiendaId ?? 'default';
  const [stats, setStats] = useState({
    totalArticulos: 0,
    valorInventario: 0,
    alertasStock: 0,
    ventasMes: 0,
    alertasCriticas: 0,
    alertasAdvertencia: 0,
    utilidadPotencial: 0,
    margenPromedio: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [applyingStrategy, setApplyingStrategy] = useState(null);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchDashboardData = async () => {
    // --- Fase 0: caché local para respuesta instantánea ---
    const cachedStats = localStorage.getItem(`stockpilot_stats_${storeKey}`);
    const cachedPromos = localStorage.getItem(`stockpilot_promos_${storeKey}`);
    const cachedRecs = localStorage.getItem(`stockpilot_recs_${storeKey}`);

    if (cachedStats) { setStats(JSON.parse(cachedStats)); setLoading(false); }
    if (cachedRecs) setRecommendations(JSON.parse(cachedRecs));
    if (cachedPromos) { setPromotions(JSON.parse(cachedPromos)); setLoadingPromos(false); }

    // --- Fase 1: stats SQL puros (~100–200ms), quita el spinner de inmediato ---
    try {
      const statsRes = await axios.get('/api/dashboard/stats');
      setStats(statsRes.data);
      setLoading(false);
      localStorage.setItem(`stockpilot_stats_${storeKey}`, JSON.stringify(statsRes.data));
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }

    // --- Fase 2: IA en background, no bloquea las tarjetas de stats ---
    try {
      const [aiRes, promoRes] = await Promise.all([
        axios.get('/api/ia/recommendations'),
        axios.get('/api/ia/promotions').catch(() => ({ data: { promotions: [] } }))
      ]);

      setRecommendations(aiRes.data.recommendations || []);
      localStorage.setItem(`stockpilot_recs_${storeKey}`, JSON.stringify(aiRes.data.recommendations || []));

      setPromotions(promoRes.data.promotions || []);
      localStorage.setItem(`stockpilot_promos_${storeKey}`, JSON.stringify(promoRes.data.promotions || []));
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === SYNC_EVENTS.SALE_COMPLETED ||
        event.type === SYNC_EVENTS.STOCK_UPDATED ||
        event.type === SYNC_EVENTS.PRODUCT_MODIFIED
      ) {
        fetchDashboardData();
      }
    });

    return () => unsubscribe();
  }, [storeKey]); // re-ejecutar si cambia la tienda activa

  const handleApplyStrategy = (promo) => {
    setSelectedPromo(promo);
    setShowModal(true);
  };

  const confirmExecution = async () => {
    if (!selectedPromo) return;
    
    try {
      setApplyingStrategy(true);
      const res = await axios.post('/api/ia/apply-strategy', {
        id_producto: selectedPromo.id,
        nuevo_precio: selectedPromo.discountedPrice,
        duration_days: selectedPromo.duration_days,
        tipo: selectedPromo.type,
        razon: selectedPromo.reason
      });

      if (res.data.success) {
        toast.success(`✨ ¡Estrategia aplicada! El precio de "${selectedPromo.productName}" se ha actualizado.`);
        setShowModal(false);
        // En lugar de recargar todo (fetchDashboardData), actualizamos localmente
        setPromotions(prev => prev.filter(p => p.id !== selectedPromo.id));
      }
    } catch (error) {
      console.error('Error aplicando estrategia:', error);
      toast.error(error.response?.data?.error || 'Error al ejecutar la estrategia');
    } finally {
      setApplyingStrategy(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Vista General</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 decoration-indigo-200 underline underline-offset-8">Resumen Actual de tu Negocio</p>
      </header>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Productos */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Productos</p>
          <div className="flex items-end justify-between mt-2 gap-2">
            <p className="text-2xl xl:text-3xl font-black text-slate-800 tracking-tighter">{stats.totalArticulos || 0}</p>
            <span className="text-[10px] text-emerald-500 font-bold mb-1 shrink-0">Catálogo</span>
          </div>
        </div>

        {/* Inversión */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Valor Inventario</p>
          <div className="flex items-end justify-between mt-2 gap-2">
            <p className="text-2xl xl:text-3xl font-black text-indigo-600 tracking-tighter">${(stats.valorInventario || 0).toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 font-bold mb-1 shrink-0">Valor Total</span>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Alertas</p>
          <div className="flex items-end justify-between mt-2 gap-2">
            <p className={`text-2xl xl:text-3xl font-black tracking-tighter ${stats.alertasCriticas > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{stats.alertasCriticas || stats.alertasStock || 0}</p>
            <span className={`text-[10px] font-black mb-1 shrink-0 ${stats.alertasCriticas > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
              {stats.alertasCriticas > 0 ? 'URGENTE' : 'OK'}
            </span>
          </div>
        </div>

        {/* Ventas Hoy */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Ventas de Hoy</p>
          <div className="flex items-end justify-between mt-2 gap-2">
            <p className="text-2xl xl:text-3xl font-black text-emerald-600 tracking-tighter">${(stats.ventasHoy || 0).toLocaleString()}</p>
            <div className="text-right">
              <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Total Mes</span>
              <span className="text-[10px] text-slate-500 font-black">${(stats.ventasMes || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asistente Estratégico IA */}
        <section className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-9xl">🤖</div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-2xl">🚀</div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">Consejero IA</h2>
                  <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mt-1">Recomendaciones Inteligentes</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/analisis-detallado')}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
              >
                Ver Más
              </button>
            </div>

            <div className="flex-grow">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-white/5 rounded-[1.5rem] animate-pulse"></div>
                  <div className="h-24 bg-white/5 rounded-[1.5rem] animate-pulse"></div>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map((rec, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-[1.5rem] hover:bg-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <span className="text-indigo-300 font-black text-sm uppercase tracking-tight leading-tight flex-1">{rec.product}</span>
                        <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded border ${rec.trend === 'alcista' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {rec.trend === 'alcista' ? 'ALTA DEMANDA' : 'BAJA ROTACIÓN'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-100/90 mt-2 font-medium leading-relaxed italic">"{rec.reason}"</p>
                      <div className="mt-auto pt-4 border-t border-white/5">
                        <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest">
                          <span className="text-slate-500">Sugerido: <b className="text-white text-base font-black italic tracking-tighter">+{rec.final}u</b></span>
                          <span className={getConfidenceColor(rec.confidence)}>Confianza: {rec.confidence}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full opacity-80 transition-all duration-1000 ${rec.confidence >= 90 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500'}`}
                            style={{ width: `${rec.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10">
                  <p className="text-slate-500 italic text-sm font-bold uppercase tracking-widest">Sistemas Estables</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Estado del Inventario */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col">
          <h2 className="text-slate-800 font-black text-xs uppercase tracking-[0.3em] mb-8 border-b border-slate-50 pb-4">
            🚨 Estado del Inventario
          </h2>
          <div className="space-y-6 flex-grow">
            <div 
              onClick={() => navigate('/alertas')}
              className={`p-6 rounded-[1.5rem] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${stats.alertasCriticas > 0 ? 'bg-rose-50 border border-rose-100 shadow-xl shadow-rose-100/50 hover:shadow-rose-200/50' : (stats.alertasAdvertencia > 0 ? 'bg-amber-50 border border-amber-100 shadow-xl shadow-amber-100/50' : 'bg-emerald-50 border border-emerald-100 hover:shadow-lg')}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${stats.alertasCriticas > 0 ? 'bg-rose-500 animate-ping' : (stats.alertasAdvertencia > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]')}`}></div>
                <div>
                  <p className={`text-sm font-black uppercase tracking-tight ${stats.alertasCriticas > 0 ? 'text-rose-700' : (stats.alertasAdvertencia > 0 ? 'text-amber-700' : 'text-emerald-700')}`}>
                    {stats.alertasCriticas > 0 ? 'Acción Urgente' : (stats.alertasAdvertencia > 0 ? 'Revisar Stock' : 'Todo en Orden')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                    {stats.alertasCriticas > 0 ? `${stats.alertasCriticas} productos necesitan atención hoy.` : (stats.alertasAdvertencia > 0 ? `Hay ${stats.alertasAdvertencia} productos con poco stock.` : 'No hay alertas pendientes.')}
                  </p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => navigate('/analitica-visual')}
              className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 cursor-pointer relative overflow-hidden group hover:scale-[1.02] transition-transform"
            >
              <div className="absolute -top-1 -right-1 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform text-indigo-600">📈</div>
              <h4 className="text-xl font-black italic tracking-tighter uppercase mb-4 text-slate-800">Centro<br/><span className="text-indigo-600">Analítico</span></h4>
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">Ver Detalles →</span>
            </div>

            {/* Margen Promedio (Movido a Sidebar & Convertido a Blanco) */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform text-slate-800">💰</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate relative z-10">Margen de Ganancia</p>
              <div className="flex items-end justify-between mt-2 gap-2 relative z-10">
                <p className="text-3xl font-black text-slate-800 tracking-tighter">
                  {stats.margenPromedio ? Number(stats.margenPromedio).toFixed(1) : 0}%
                </p>
                <div className="flex flex-col items-end mb-1">
                   <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Promedio General</span>
                   <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                     <div className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" style={{ width: `${stats.margenPromedio || 0}%` }}></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Oportunidades de Promoción IA */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-6 opacity-5 text-9xl">💰</div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)]">🎯</div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic">Estrategias de Venta</h2>
              <p className="text-[9px] text-indigo-300 font-black uppercase tracking-widest mt-1">Sugerencias para optimizar la rotación e ingresos</p>
            </div>
          </div>

          {loadingPromos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-56 bg-white/5 rounded-[2rem] animate-pulse"></div>)}
            </div>
          ) : promotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {promotions.map((promo, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all flex flex-col group h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">PROPUESTA IA</span>
                      <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 inline-block w-fit uppercase tabular-nums">
                        🎯 {promo.type === 'discount' ? 'Descuento Directo' : (promo.type === 'liquidation' ? 'Liquidación' : promo.type)}
                      </span>
                    </div>
                    <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded text-indigo-100/60">⏱️ {promo.duration_days}d</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tighter leading-tight italic uppercase text-white mb-2">
                    {promo.type === 'combo' && promo.complementary_name 
                      ? `${promo.productName} + ${promo.complementary_name}` 
                      : promo.productName}
                  </h3>
                  <p className="text-[11px] font-medium leading-relaxed italic mb-6 text-indigo-100/70">"{promo.reason}"</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Dinero a Recuperar</p>
                        <p className="text-xl font-black text-white">${promo.impact.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs">-{promo.discount}%</div>
                    </div>
                    <button 
                      onClick={() => handleApplyStrategy(promo)}
                      disabled={applyingStrategy === promo.id}
                      className="w-full py-4 rounded-xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      {applyingStrategy === promo.id ? '⚡ PROCESANDO...' : '🎯 Activar Oferta'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10">
              <p className="text-slate-500 italic text-sm font-bold uppercase tracking-widest">Mercado Estable • Sin sugerencias de descuento</p>
            </div>
          )}
        </div>
      </section>

      {/* STRATEGY MODAL */}
      {showModal && selectedPromo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-8 text-white relative">
               <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">🎯</div>
               <h3 className="text-2xl font-black tracking-tighter uppercase italic">Activar Promoción</h3>
               <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mt-1">Detalles de la Sugerencia</p>
            </div>

            <div className="p-8 space-y-8">
               <div className="space-y-2 text-center sm:text-left">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intervenir Producto</p>
                 <p className="text-2xl font-black text-white tracking-tight uppercase italic">{selectedPromo.productName}</p>
               </div>

               <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Precio Hoy</p>
                   <p className="text-2xl font-black text-slate-400 line-through opacity-50 italic">${selectedPromo.originalPrice?.toLocaleString()}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Nuevo Precio</p>
                   <p className="text-3xl font-black text-white tracking-tighter italic border-b-2 border-emerald-500/50 pb-1 inline-block">
                     ${selectedPromo.discountedPrice?.toLocaleString()}
                   </p>
                 </div>
               </div>

               <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                 <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Ahorro para el Cliente</p>
                 <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">-{selectedPromo.discount}% OFF</span>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 transition-colors">Cancelar</button>
                 <button 
                  onClick={confirmExecution} 
                  disabled={applyingStrategy}
                  className="flex-[1.5] bg-white text-slate-900 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl disabled:opacity-50"
                 >
                   {applyingStrategy ? 'Procesando...' : '🔥 Ejecutar Ahora'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
