import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Tooltip from '../components/Tooltip';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalArticulos: 0,
    valorInventario: 0,
    alertasStock: 0,
    ventasMes: 0,
    alertasCriticas: 0,
    alertasAdvertencia: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, aiRes] = await Promise.all([
          axios.get('/api/dashboard/stats'),
          axios.get('/api/ia/recommendations')
        ]);
        setStats(statsRes.data);
        setRecommendations(aiRes.data.recommendations || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getConfidenceColor = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="mb-0">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Panel de Control</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 decoration-indigo-200 underline underline-offset-8">Gestión Estratégica StockPilot</p>
      </header>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <Tooltip text="Total Artículos" className="w-full min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full">Total Artículos</p>
          </Tooltip>
          <div className="flex items-end justify-between mt-2 gap-2 min-w-0">
            <Tooltip text={String(stats.totalArticulos || 0)} className="flex-1">
              <p className="text-2xl xl:text-3xl font-black text-slate-800 tracking-tighter break-words">{stats.totalArticulos || 0}</p>
            </Tooltip>
            <span className="text-[10px] text-emerald-500 font-bold mb-1 shrink-0 truncate">Stock Físico</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <Tooltip text="Valor Inventario" className="w-full min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full">Valor Inventario</p>
          </Tooltip>
          <div className="flex items-end justify-between mt-2 gap-2 min-w-0">
            <Tooltip text={`$${(stats.valorInventario || 0).toLocaleString()}`} className="flex-1">
              <p className="text-2xl xl:text-3xl font-black text-indigo-600 tracking-tighter break-words">${(stats.valorInventario || 0).toLocaleString()}</p>
            </Tooltip>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 mb-1 shrink-0 truncate">Capital</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <Tooltip text="Alertas Stock" className="w-full min-w-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full">Vigilancia MBI</h3>
          </Tooltip>
          <div className="flex items-end justify-between mt-2 gap-2 min-w-0">
            <Tooltip text={`Críticas: ${stats.alertasCriticas} | Advertencias: ${stats.alertasAdvertencia} | Total: ${stats.alertasStock}`} className="flex-1">
              <p className={`text-2xl xl:text-3xl font-black tracking-tighter break-words ${stats.alertasCriticas > 0 ? 'text-rose-500' : (stats.alertasAdvertencia > 0 ? 'text-amber-500' : 'text-emerald-500')}`}>{stats.alertasCriticas > 0 ? stats.alertasCriticas : (stats.alertasAdvertencia > 0 ? stats.alertasAdvertencia : stats.alertasStock)}</p>
            </Tooltip>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 truncate ${stats.alertasCriticas > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : (stats.alertasAdvertencia > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')} mb-1`}>
              {stats.alertasCriticas > 0 ? 'URGENTE' : (stats.alertasAdvertencia > 0 ? 'PREVISIÓN' : 'ÓPTIMO')}
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between min-w-0">
          <Tooltip text="Ventas Recientes" className="w-full min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full">Ventas Recientes</p>
          </Tooltip>
          <div className="flex items-end justify-between mt-2 gap-2 min-w-0">
            <Tooltip text={`$${(stats.ventasMes || 0).toLocaleString()}`} className="flex-1">
              <p className="text-2xl xl:text-3xl font-black text-emerald-600 tracking-tighter break-words">${(stats.ventasMes || 0).toLocaleString()}</p>
            </Tooltip>
            <span className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-tighter shrink-0 truncate">Acumulado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asistente Estratégico IA */}
        <section className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-9xl">🤖</div>

          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">🚀</div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">Asistente Estratégico IA</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-indigo-500 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Modelo Proactivo</span>
                    <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Auditoría v2.4</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/analisis-detallado')}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95"
              >
                Ver Análisis Detallado
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
                        <span className={`shrink-0 whitespace-nowrap text-[9px] font-black px-2 py-0.5 rounded border ${rec.trend === 'alcista' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {rec.trend === 'alcista' ? '▲ ALTA VENTAS' : '▼ BAJA VENTAS'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-100/90 mt-2 mb-4 font-medium leading-relaxed italic">"{rec.reason}"</p>

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
                  <p className="text-slate-500 italic text-sm font-bold uppercase tracking-widest">Operación estable • No se requieren ajustes IA</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Semáforo de Estado en Tiempo Real */}
        <section className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 h-full flex flex-col">
            <h2 className="text-slate-800 font-black text-xs uppercase tracking-[0.3em] mb-8 border-b border-slate-50 pb-4 flex items-center gap-2">
              🚨 Vigilancia Logística
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
                      {stats.alertasCriticas > 0 ? 'Riesgo Crítico Inminente' : (stats.alertasAdvertencia > 0 ? 'Atención Preventiva' : 'Logística Saludable')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                      {stats.alertasCriticas > 0 ? `${stats.alertasCriticas} ítems exigen tu acción inmediata.` : (stats.alertasAdvertencia > 0 ? `Revise las ${stats.alertasAdvertencia} alertas de previsión.` : 'Sin amenazas en el horizonte calculadas.')}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => navigate('/analitica-visual')}
                className="group bg-indigo-600 p-5 rounded-[1.5rem] border border-indigo-400 shadow-xl shadow-indigo-100/30 cursor-pointer overflow-hidden relative transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="absolute -top-1 -right-1 p-2 opacity-10 text-4xl group-hover:scale-125 transition-transform">📈</div>
                <h4 className="text-base font-black text-white italic tracking-tighter uppercase mb-2 leading-tight">Acceder al Centro<br/>Analítico Visual</h4>
                <div className="flex items-center gap-2">
                   <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white group-hover:translate-x-1 transition-transform">→</span>
                   <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Ver Pareto y Tendencias</span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50">
                <p className={`text-[8px] font-bold uppercase text-center tracking-[0.3em] ${stats.alertasCriticas > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {stats.alertasCriticas > 0 ? '⚠️ El sistema requiere intervención' : 'Operación Estable MBI'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
