import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart2, Brain, ArrowLeft, CheckCircle2, AlertTriangle, Microscope } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Cell, PieChart, Pie, AreaChart, Area, Line,
  RadialBarChart, RadialBar
} from 'recharts';
import { CHART } from '../theme/chartColors';

const PALETTE = {
  A: { main: CHART.primary, light: CHART.primarySoft, border: CHART.primaryBorder, glow: '' },
  B: { main: CHART.secondary, light: CHART.secondarySoft, border: CHART.secondaryBorder, glow: '' },
  C: { main: CHART.neutral, light: CHART.neutralSoft, border: CHART.neutralBorder, glow: '' },
  risk: { high: CHART.negative, medium: CHART.secondary, low: CHART.positive }
};

const CustomTooltipPareto = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName || payload[0]?.payload?.name;
  return (
    <div className="bg-tinta text-white px-5 py-4 rounded-2xl shadow-2xl border border-tinta-2 min-w-[180px]">
      <p className="text-[10px] font-black uppercase tracking-widest text-resaltador mb-2">{fullName}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between items-center gap-6 py-1">
          <span className="text-[10px] font-bold text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full ring-1 ring-white/70" style={{ backgroundColor: entry.color }}></span>
            {entry.name}
          </span>
          <span className="text-sm font-black text-white">
            {entry.name.includes('%') ? `${entry.value}%` : `$${entry.value?.toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltipGeneric = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName || label;
  return (
    <div className="bg-tinta text-white px-4 py-3 rounded-xl shadow-2xl border border-tinta-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">{fullName}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-black text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full ring-1 ring-white/70" style={{ backgroundColor: entry.color || '#fff' }}></span>
          {entry.value?.toLocaleString()} {entry.name}
        </p>
      ))}
    </div>
  );
};

const AnalyticsDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [priceTrend, setPriceTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        // allSettled: cada request falla de forma independiente sin bloquear las demás
        const [snapshotRes, statsRes, trendRes] = await Promise.allSettled([
          axios.get('/api/ia/snapshot', { signal: controller.signal }),
          axios.get('/api/dashboard/stats', { signal: controller.signal }),
          axios.get('/api/ia/price-trend', { signal: controller.signal })
        ]);
        if (controller.signal.aborted) return;
        if (snapshotRes.status === 'fulfilled') setData(snapshotRes.value.data.data || []);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (trendRes.status === 'fulfilled') setPriceTrend(trendRes.value.data.trend || []);
        if (snapshotRes.status === 'rejected') console.error('snapshot error:', snapshotRes.reason);
        if (statsRes.status === 'rejected') console.error('stats error:', statsRes.reason);
        if (trendRes.status === 'rejected') console.error('price-trend error:', trendRes.reason);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching analytics data:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => controller.abort();
  }, [refreshKey]);

  // === DATA TRANSFORMS ===
  const paretoData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = sorted.reduce((sum, item) => sum + item.revenue, 0);
    let cumulative = 0;
    return sorted.slice(0, 15).map(item => {
      cumulative += item.revenue;
      const pct = totalRevenue > 0 ? Math.round((cumulative / totalRevenue) * 100) : 0;
      return {
        name: item.nombre?.length > 20 ? item.nombre.substring(0, 18) + '…' : item.nombre,
        fullName: item.nombre,
        revenue: item.revenue,
        cumulativePercent: pct,
        category: item.category
      };
    });
  }, [data]);

  const donutData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 };
    data.forEach(item => { if (counts[item.category] !== undefined) counts[item.category]++; });
    return [
      { name: 'Alta Rotación (A)', value: counts.A, fill: PALETTE.A.main },
      { name: 'Media (B)', value: counts.B, fill: PALETTE.B.main },
      { name: 'Baja (C)', value: counts.C, fill: PALETTE.C.main }
    ].filter(d => d.value > 0);
  }, [data]);

  const riskData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    data.forEach(item => { if (counts[item.risk] !== undefined) counts[item.risk]++; });
    return [
      { name: 'Crítico', value: counts.high, fill: PALETTE.risk.high },
      { name: 'Moderado', value: counts.medium, fill: PALETTE.risk.medium },
      { name: 'Estable', value: counts.low, fill: PALETTE.risk.low }
    ];
  }, [data]);

  const exhaustData = useMemo(() => {
    return data
      .filter(item => item.days_to_exhaust !== null && item.days_to_exhaust !== Infinity && item.days_to_exhaust < 90)
      .sort((a, b) => a.days_to_exhaust - b.days_to_exhaust)
      .slice(0, 10)
      .map(item => ({
        name: item.nombre?.length > 20 ? item.nombre.substring(0, 18) + '…' : item.nombre,
        fullName: item.nombre,
        dias: item.days_to_exhaust,
        category: item.category
      }));
  }, [data]);

  // === KPI Summaries ===
  const kpis = useMemo(() => {
    const totalProducts = data.length;
    const classA = data.filter(d => d.category === 'A');
    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const revenueA = classA.reduce((s, d) => s + d.revenue, 0);
    const concentrationA = totalRevenue > 0 ? Math.round((revenueA / totalRevenue) * 100) : 0;
    const avgDays = data.filter(d => d.days_to_exhaust && d.days_to_exhaust < 999).reduce((s, d, _, arr) => s + d.days_to_exhaust / arr.length, 0);
    const criticalCount = data.filter(d => d.risk === 'high').length;
    return { totalProducts, concentrationA, avgDays: Math.round(avgDays), criticalCount, totalRevenue };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-azul border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando Motores Analíticos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20 space-y-8 h-full">

      {/* ═══════════ HEADER ═══════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/dashboard')} aria-label="Volver al dashboard" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 hover:bg-azul/10 hover:border-azul/30 rounded-2xl transition-colors shadow-sm active:scale-95">
             <ArrowLeft size={18} className="text-tinta-2" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-azul/10 text-azul rounded-xl flex items-center justify-center shadow-inner border border-azul/30"><BarChart2 size={20} /></div>
              <h2 className="text-3xl font-black text-tinta tracking-tighter italic uppercase">Centro Analítico</h2>
            </div>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 ml-[52px]">Inteligencia de Datos y Patrones Estratégicos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/aprendizaje')}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-azul/10 border border-azul/30 text-azul rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-azul/10 transition-colors shadow-sm"
          >
            <Brain size={14} />
            <span>Ver Aprendizaje IA</span>
          </button>
          
          <div className="bg-tinta px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-lg">
             <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
             <span className="font-black text-[9px] uppercase tracking-widest text-slate-100">Motor Proactivo v3.0</span>
          </div>
        </div>
      </div>

      {/* ═══════════ KPI CARDS ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Productos Activos</p>
          <p className="text-3xl font-black text-tinta tracking-tighter mt-2">{kpis.totalProducts}</p>
          <p className="text-[9px] text-slate-500 font-bold mt-1">Catálogo actual</p>
        </div>
        <div className="bg-azul/10 p-5 rounded-2xl border border-azul/30 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[9px] font-black text-azul uppercase tracking-widest">Dependencia de Estrellas</p>
          <p className="text-3xl font-black text-azul tracking-tighter mt-2">{kpis.concentrationA}%</p>
          <p className="text-[9px] text-azul font-bold mt-1">Del ingreso total (Alta Rotación)</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-aviso-suave shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Stock Promedio</p>
          <p className="text-3xl font-black text-aviso tracking-tighter mt-2">{kpis.avgDays}d</p>
          <p className="text-[9px] text-amber-600 font-bold mt-1">Para agotarse la mercancía</p>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${kpis.criticalCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-exito-suave'}`}>
          <p className={`text-[9px] font-black uppercase tracking-widest ${kpis.criticalCount > 0 ? 'text-peligro' : 'text-exito'}`}>Productos en Riesgo</p>
          <p className={`text-3xl font-black tracking-tighter mt-2 ${kpis.criticalCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{kpis.criticalCount}</p>
          <p className={`text-[9px] font-bold mt-1 ${kpis.criticalCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{kpis.criticalCount > 0 ? '¡Requieren tu acción ya!' : 'Todo en orden'}</p>
        </div>
      </div>

      {/* ═══════════ PARETO ABC ═══════════ */}
      <section className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
        <div className="bg-tinta px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Tus Productos Estrella (Pareto 80/20)</h3>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">Tus 5 productos principales generan la mayoría de tus ingresos</p>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-3 h-3 rounded-sm bg-azul ring-2 ring-white/70"></div>
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Ingresos</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-exito ring-2 ring-white/70"></div>
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">% Acumulado</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="name" fontSize={12} fontWeight="bold" stroke={CHART.axis} angle={-35} textAnchor="end" interval={0} height={70} />
                <YAxis yAxisId="left" orientation="left" stroke={CHART.axis} fontSize={12} width={60} tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" stroke={CHART.positive} fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip content={<CustomTooltipPareto />} />
                <Bar yAxisId="left" dataKey="revenue" name="Ingresos (30d)" radius={[6, 6, 0, 0]}>
                  {paretoData.map((entry) => (
                    <Cell key={entry.name} fill={entry.category === 'A' ? CHART.primary : entry.category === 'B' ? CHART.secondary : CHART.neutral} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="% Acumulado" stroke={CHART.positive} strokeWidth={3} dot={{ r: 5, fill: CHART.positive, strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-3 px-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-azul h-full" style={{ width: `${kpis.concentrationA}%` }}></div>
              <div className="bg-ambar h-full" style={{ width: `${Math.min(100 - kpis.concentrationA, 25)}%` }}></div>
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">
              {kpis.concentrationA}% de ingresos provienen de productos muy rentables (Clase A)
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ DONUT + RIESGO (Row) ═══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Donut ABC */}
        <section className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
          <div className="px-8 pt-7 pb-4 border-b border-slate-50">
            <h3 className="text-base font-black text-tinta uppercase tracking-tight italic">Tu Portafolio de Productos</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">¿Cuáles te dejan más dinero? (Clase A = Más rentables)</p>
          </div>
          <div className="px-8 py-6">
            <div className="flex items-center gap-8">
              <div className="w-[200px] h-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltipGeneric />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-4">
                {donutData.map((item) => {
                  const total = donutData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: item.fill }}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-tinta-2 uppercase">{item.name}</span>
                          <span className="text-xs font-black" style={{ color: item.fill }}>{item.value} Productos ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-colors duration-1000" style={{ width: `${pct}%`, backgroundColor: item.fill }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Riesgo Logístico */}
        <section className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
          <div className="px-8 pt-7 pb-4 border-b border-slate-50">
            <h3 className="text-base font-black text-tinta uppercase tracking-tight italic">Mapa de Riesgo Logístico</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Distribución por Nivel de Alerta</p>
          </div>
          <div className="px-8 py-6 space-y-5">
            {riskData.map((item) => {
              const maxVal = Math.max(...riskData.map(r => r.value), 1);
              const pct = (item.value / maxVal) * 100;
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                      <span className="text-xs font-black text-tinta-2 uppercase tracking-wide">{item.name}</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter" style={{ color: item.fill }}>{item.value}</span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                    <div 
                      className="h-full rounded-lg transition-colors duration-1000 ease-out" 
                      style={{ width: `${pct}%`, backgroundColor: item.fill, opacity: 0.75 }}
                    ></div>
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[9px] text-slate-500 font-bold text-center uppercase tracking-widest">
                {riskData[0].value === 0
                  ? <span className="flex items-center justify-center gap-1"><CheckCircle2 size={10} /> Sin productos en riesgo crítico</span>
                  : <span className="flex items-center justify-center gap-1"><AlertTriangle size={10} /> {riskData[0].value} producto(s) requieren intervención inmediata</span>
                }
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════ PRICE HISTORY (IA STRATEGY) ═══════════ */}
      <section className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
        <div className="px-8 pt-7 pb-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-tinta uppercase tracking-tight italic">Evolución de Estrategia de Precios (IA)</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Historial de variaciones aplicadas por el motor de decisión</p>
          </div>
          <div className="bg-azul/10 border border-azul/30 px-3 py-1 rounded-full text-[9px] font-black text-azul uppercase tracking-widest">
            Auditoría Activa
          </div>
        </div>
        <div className="p-8">
          <div className="h-[280px] w-full flex items-center justify-center">
            {priceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceTrend} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <defs>
                    <linearGradient id="gradientTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={CHART.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="fecha" fontSize={12} fontWeight="bold" stroke={CHART.axis} interval="preserveStartEnd" />
                  <YAxis stroke={CHART.axis} fontSize={12} tickFormatter={(v) => `$${v?.toLocaleString()}`} />
                  <Tooltip content={<CustomTooltipGeneric />} />
                  <Area type="stepAfter" dataKey="precioNuevo" name="Precio Venta" stroke={CHART.primary} strokeWidth={3} fillOpacity={1} fill="url(#gradientTrend)" dot={{ r: 4, fill: CHART.primary }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-3 w-full px-4">
                <div className="grayscale opacity-50 flex justify-center"><Microscope size={36} /></div>
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Esperando Datos Estratégicos</p>
                  <p className="text-[10px] text-slate-400 font-medium italic mt-1 leading-tight">
                    "Las variaciones de precio aplicadas por la IA aparecerán aquí una vez <br className="hidden sm:block" /> que empieces a activar ofertas comerciales."
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando los últimos 100 movimientos en el historial de precios aplicados
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ PROYECCIÓN DE AGOTAMIENTO ═══════════ */}
      {exhaustData.length > 0 && (
        <section className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden">
          <div className="px-8 pt-7 pb-4 border-b border-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-tinta uppercase tracking-tight italic">¿Cuándo se te acaba el stock?</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Días que le quedan a tus 10 productos más críticos antes de agotarse</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest overflow-x-auto pb-2 sm:pb-0">
                <span className="flex items-center gap-1.5 shrink-0"><span className="w-3 h-3 rounded bg-peligro"></span><span className="text-slate-600">&lt; 5d</span></span>
                <span className="flex items-center gap-1.5 shrink-0"><span className="w-3 h-3 rounded bg-ambar"></span><span className="text-slate-600">&lt; 15d</span></span>
                <span className="flex items-center gap-1.5 shrink-0"><span className="w-3 h-3 rounded bg-exito"></span><span className="text-slate-600">&gt; 15d</span></span>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exhaustData} margin={{ bottom: 70, left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={12} fontWeight="bold" stroke={CHART.axis} height={80} />
                  <YAxis stroke={CHART.axis} fontSize={12} allowDecimals={false} />
                  <Tooltip content={<CustomTooltipGeneric />} />
                  <Bar dataKey="dias" name="Días Restantes" radius={[6, 6, 0, 0]}>
                    {exhaustData.map((entry) => (
                      <Cell key={entry.name} fill={entry.dias < 5 ? CHART.negative : entry.dias < 15 ? CHART.secondary : CHART.positive} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ RITMO DE CAJA ═══════════ */}
      <section data-surface="dark" className="bg-tinta rounded-[2rem] shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <div className="px-8 pt-8 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Ritmo de Caja Semanal</h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">Ventas Consolidadas — Últimos 7 Días</p>
              </div>
              <div className="text-left sm:text-right flex flex-col items-end gap-2">
                <p className="text-2xl font-black text-white tracking-tighter italic">
                  ${(stats?.ventasSemanales?.reduce((s, d) => s + d.total, 0) || 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">total semanal</p>
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  disabled={loading}
                  className="text-[9px] font-bold uppercase tracking-widest text-resaltador hover:bg-resaltador hover:text-tinta border border-resaltador px-3 py-1 rounded-full transition-colors disabled:opacity-40"
                >
                  {loading ? 'Actualizando…' : '↻ Actualizar'}
                </button>
              </div>
            </div>
          </div>
          <div className="px-8 pb-8">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.ventasSemanales || []} margin={{ top: 20, right: 10, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="gradientCaja" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.onDark} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={CHART.onDark} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.gridOnDark} />
                  <XAxis dataKey="dia" stroke={CHART.axisOnDark} fontSize={12} fontWeight="bold" tickLine={false} />
                  <YAxis stroke={CHART.axisOnDark} fontSize={12} width={60} tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: CHART.ink, borderRadius: '1rem', border: `1px solid ${CHART.inkBorder}`, color: '#fff' }}
                    itemStyle={{ color: CHART.onDark, fontWeight: 'bold' }}
                    labelStyle={{ color: CHART.labelOnDark, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="total" stroke={CHART.onDark} strokeWidth={3} fillOpacity={1} fill="url(#gradientCaja)" dot={{ r: 5, fill: CHART.onDark, strokeWidth: 3, stroke: CHART.ink }} activeDot={{ r: 7, fill: CHART.onDark }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AnalyticsDashboardPage;
