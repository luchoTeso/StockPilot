import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, BarChart2, Lightbulb, TrendingUp, ClipboardList, Inbox, Package, CheckCircle2, X, Flame } from 'lucide-react';

const AprendizajePage = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        global: { promedio: 1, totalEval: 0 },
        evolucion: [],
        topPredecibles: [],
        topImpredecibles: [],
        todos: []
    });
    
    const [modalOpen, setModalOpen] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [evaluableOrders, setEvaluableOrders] = useState([]);
    const [evalLoading, setEvalLoading] = useState(false);
    const [evalResult, setEvalResult] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const loadMetrics = useCallback(async (signal) => {
        try {
            setLoading(true);
            const [resMetrics, resOrders] = await Promise.all([
                axios.get('/api/feedback/metrics', { withCredentials: true, ...(signal && { signal }) }),
                axios.get('/api/feedback/orders/evaluable', { withCredentials: true, ...(signal && { signal }) })
            ]);
            if (signal && signal.aborted) return;

            if (resMetrics.data.success) {
                setMetrics(resMetrics.data.data);
            }
            if (resOrders.data.success) {
                setEvaluableOrders(resOrders.data.data);
            }
        } catch (error) {
            if (axios.isCancel(error) || (signal && signal.aborted)) return;
            console.error(error);
            addToast('Error al cargar métricas de IA', 'error');
        } finally {
            if (!signal || !signal.aborted) {
                setLoading(false);
            }
        }
    }, [addToast]);

    useEffect(() => {
        const controller = new AbortController();
        loadMetrics(controller.signal);
        return () => controller.abort();
    }, [loadMetrics]);

    const handleEvaluate = async (e) => {
        e.preventDefault();
        if (!orderId) return;
        
        try {
            setEvalLoading(true);
            setEvalResult(null);
            const res = await axios.post(`/api/feedback/evaluate/${orderId}`, {}, { withCredentials: true });
            
            if (res.data.success) {
                setEvalResult(res.data);
                addToast('Evaluación completada', 'success');
                loadMetrics();
            }
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.error || 'Error evaluando orden', 'error');
        } finally {
            setEvalLoading(false);
        }
    };

    // === Helpers de visualización ===
    
    // Convierte factor (0.2-3.0) a un porcentaje de acierto intuitivo (0-100%)
    const factorToAccuracy = (factor) => {
        const f = parseFloat(factor);
        return Math.max(0, Math.round((1 - Math.abs(f - 1)) * 100));
    };

    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', bar: 'bg-emerald-500' };
        if (accuracy >= 50) return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', bar: 'bg-amber-500' };
        return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', bar: 'bg-rose-500' };
    };

    const getVerdict = (factor) => {
        const f = parseFloat(factor);
        if (Math.abs(f - 1.0) <= 0.15) return { label: 'Predicción acertada', icon: CheckCircle2, desc: 'Lo sugerido estuvo muy cerca de lo vendido' };
        if (f < 0.85) return { label: 'Se sugirió de más', icon: Package, desc: 'Se recomendó comprar más de lo que se vendió' };
        return { label: 'Se sugirió de menos', icon: Flame, desc: 'La demanda superó lo que se recomendó comprar' };
    };

    const globalAccuracy = factorToAccuracy(metrics.global.promedio);
    const globalColor = getAccuracyColor(globalAccuracy);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando aprendizaje...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar-premium bg-slate-50 relative min-h-screen">
            
            {/* ───── HEADER PREMIUM ───── */}
            <div className="p-4 lg:p-6">
                <div className="relative bg-gradient-to-br from-slate-800 via-indigo-900 to-indigo-950 rounded-[2rem] shadow-xl overflow-hidden">
                    {/* Decorative orbs */}
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-indigo-400/5 rounded-full blur-3xl rotate-12"></div>
                    
                    <div className="relative z-10 px-8 lg:px-12 py-10 lg:py-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                        <div className="flex-1 max-w-2xl">
                            <div className="flex items-center gap-3 mb-5">
                                <span className="w-9 h-9 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-400/20 shadow-lg shadow-indigo-500/10">
                                    <Brain size={18} />
                                </span>
                                <span className="text-[10px] font-bold text-indigo-300/90 uppercase tracking-[0.25em]">Aprendizaje Inteligente</span>
                            </div>
                            <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug mb-4">
                                ¿Qué tan bien <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-400">predice</span> el sistema?
                            </h1>
                            <p className="text-indigo-200/70 font-normal text-sm leading-relaxed">
                                Compara lo que el sistema sugirió comprar contra lo que realmente se vendió. Con cada evaluación, las futuras recomendaciones se vuelven más precisas.
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4 min-w-[260px] lg:min-w-[280px]">
                            {/* Accuracy Card with glow */}
                            <div className="relative group">
                                <div className={`absolute -inset-0.5 rounded-[1.8rem] opacity-40 group-hover:opacity-60 blur transition-opacity ${globalAccuracy >= 80 ? 'bg-emerald-400' : globalAccuracy >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                                <div className="relative bg-slate-800/90 backdrop-blur-xl border border-white/10 p-6 rounded-[1.6rem] shadow-2xl text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Nivel de Acierto</p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-5xl font-extrabold text-white tracking-tighter">
                                            {globalAccuracy}
                                        </span>
                                        <span className="text-2xl font-bold text-slate-400">%</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-3 font-medium">
                                        {metrics.global.totalEval === 0 
                                            ? 'Sin evaluaciones aún' 
                                            : `${metrics.global.totalEval} productos evaluados`}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setEvalResult(null); setOrderId(''); setIsDropdownOpen(false); setModalOpen(true); }}
                                className="bg-indigo-500 hover:bg-indigo-400 text-white py-3.5 px-6 rounded-2xl font-bold text-xs tracking-wider transition-colors transition-shadow transition-transform shadow-lg shadow-indigo-500/20 active:scale-[0.97] flex items-center justify-center gap-2.5 border border-indigo-400/30"
                            >
                                <span>Evaluar una orden</span>
                                <BarChart2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ───── CONTENIDO PRINCIPAL ───── */}
            <div className="max-w-7xl mx-auto px-8 lg:px-12 py-10 space-y-8">

                {/* ── Explicación rápida ── */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
                    <Lightbulb size={22} className="mt-0.5 text-indigo-500 shrink-0" />
                    <div>
                        <p className="font-bold text-indigo-800 text-sm mb-1">¿Cómo funciona?</p>
                        <p className="text-indigo-700/80 text-xs leading-relaxed">
                            Cada vez que evalúas una orden antigua, el sistema compara <strong>cuánto te sugirió comprar</strong> vs. <strong>cuánto realmente vendiste</strong>. 
                            Si el acierto es bajo, la próxima vez el sistema ajustará automáticamente sus sugerencias para ser más preciso. 
                            <strong> 100% = predicción perfecta</strong>.
                        </p>
                    </div>
                </div>

                {/* ── Gráfica de Evolución ── */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-1 flex items-center gap-2"><TrendingUp size={18} /> Evolución del Acierto</h2>
                            <p className="text-xs font-medium text-slate-400">Cómo ha mejorado (o empeorado) la precisión del sistema mes a mes</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                            <div className="w-3 h-0.5 bg-indigo-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Precisión (Ideal = 100%)</span>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        {(metrics.evolucion && metrics.evolucion.length > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.evolucion.map(m => ({ ...m, precision_pct: factorToAccuracy(m.factor_promedio) }))}>
                                    <defs>
                                        <linearGradient id="colorFactor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} tickFormatter={v => `${v}%`} />
                                    <ReferenceLine y={100} stroke="#10b981" strokeDasharray="8 4" strokeWidth={2} label={{ value: '← Ideal', position: 'right', fill: '#10b981', fontSize: 11, fontWeight: 700 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                                        formatter={(value) => [`${value}%`, 'Precisión']}
                                        labelFormatter={(label) => `Mes: ${label}`}
                                    />
                                    <Area type="monotone" dataKey="precision_pct" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorFactor)" dot={{ fill: '#6366f1', r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <BarChart2 size={40} className="mb-3" />
                                <p className="font-bold text-sm">Aún no hay datos suficientes</p>
                                <p className="text-xs mt-1">Evalúa al menos 2 órdenes en meses diferentes para ver la gráfica</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Tabla completa de productos ── */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-2 flex items-center gap-2"><ClipboardList size={18} /> Rendimiento por Producto</h2>
                    <p className="text-xs font-medium text-slate-400 mb-6">Qué tan bien acertó el sistema para cada producto que evaluaste</p>
                    
                    {/* Leyenda de colores */}
                    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">80-100% = Muy acertado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">50-79% = Necesita mejorar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">0-49% = Muy desviado</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {metrics.todos?.length > 0 ? metrics.todos.map(prod => {
                            const accuracy = factorToAccuracy(prod.factor_historico);
                            const color = getAccuracyColor(accuracy);
                            const verdict = getVerdict(prod.factor_historico);
                            
                            return (
                                <div key={prod.id_producto} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-5 rounded-2xl border ${color.border} ${color.bg} gap-3`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {(() => { const Icon = verdict.icon; return <Icon size={16} />; })()}
                                            <p className="font-black text-slate-800 text-sm">{prod.nombre_producto}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-7">{verdict.label} · {prod.evaluaciones} {prod.evaluaciones === 1 ? 'evaluación' : 'evaluaciones'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 ml-7 sm:ml-0">
                                        {/* Barra de progreso visual */}
                                        <div className="w-32 h-2.5 bg-white/80 rounded-full overflow-hidden border border-slate-200/50">
                                            <div className={`h-full rounded-full ${color.bar} transition-colors`} style={{ width: `${accuracy}%` }}></div>
                                        </div>
                                        <span className={`text-lg font-black ${color.text} min-w-[50px] text-right`}>{accuracy}%</span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <Inbox size={36} className="block mb-3 mx-auto" />
                                <p className="font-bold text-sm">No hay productos evaluados todavía</p>
                                <p className="text-xs mt-1">Usa el botón "Evaluar una orden" para comenzar a medir la precisión</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ───── MODAL DE EVALUACIÓN ───── */}
            {modalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setModalOpen(false)} role="presentation" aria-hidden="true"></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-scale-in relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="p-8 bg-indigo-600 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black tracking-tighter uppercase italic flex items-center gap-2">
                                    <BarChart2 size={20} /> Evaluar Precisión
                                </h3>
                                <p className="text-[11px] font-medium opacity-90 mt-2 leading-relaxed">
                                    Selecciona una orden antigua para que el sistema compare lo que sugirió comprar vs. lo que realmente se vendió desde entonces.
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} aria-label="Cerrar modal" className="w-8 h-8 flex items-center justify-center bg-indigo-500 hover:bg-white hover:text-indigo-600 rounded-xl transition-colors shrink-0 ml-4">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto scrollbar-premium flex-1">
                            {!evalResult ? (
                                <form onSubmit={handleEvaluate} className="space-y-6">
                                    <div>
                                        <label htmlFor="eval-order-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                            Orden de compra a evaluar
                                        </label>
                                        <div className="relative">
                                            {/* Select Custom Premium */}
                                            <button
                                                type="button"
                                                id="eval-order-select"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className={`w-full text-left p-4 bg-slate-50 border rounded-2xl text-sm transition-colors transition-shadow focus:outline-none focus:ring-4 focus:ring-indigo-500/10 flex justify-between items-center group shadow-sm
                                                    ${isDropdownOpen ? 'border-indigo-400 bg-white ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-300 hover:bg-white'}
                                                `}
                                            >
                                                <span className={`${orderId ? 'font-black text-indigo-700' : 'font-bold text-slate-500'}`}>
                                                    {orderId 
                                                        ? evaluableOrders.find(o => o.id_orden === orderId)
                                                            ? `#${evaluableOrders.find(o => o.id_orden === orderId).id_orden} · ${evaluableOrders.find(o => o.id_orden === orderId).proveedor} · ${new Date(evaluableOrders.find(o => o.id_orden === orderId).fecha_aprobacion).toLocaleDateString()}`
                                                            : 'Elige una orden aprobada...'
                                                        : 'Elige una orden aprobada...'
                                                    }
                                                </span>
                                                <div className={`p-1.5 rounded-lg transition-colors flex shrink-0 ${isDropdownOpen ? 'bg-indigo-100' : 'bg-slate-200 group-hover:bg-indigo-50'}`}>
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-600' : 'text-slate-500 group-hover:text-indigo-500'}`} 
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </div>
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isDropdownOpen && (
                                                <>
                                                    {/* Overlay invisible para cerrar al hacer clic afuera */}
                                                    <div className="fixed inset-0 z-[115]" onClick={() => setIsDropdownOpen(false)} role="presentation" aria-hidden="true"></div>
                                                    
                                                    <div className="absolute z-[120] w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-56 overflow-y-auto scrollbar-premium py-2 animate-scale-in origin-top">
                                                        <div className="px-3 pb-2 pt-1 border-b border-slate-50">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Órdenes disponibles ({evaluableOrders.length})</p>
                                                        </div>
                                                        {evaluableOrders.length === 0 ? (
                                                            <div className="p-4 text-center text-xs font-bold text-slate-400">
                                                                No hay órdenes evaluables
                                                            </div>
                                                        ) : (
                                                            evaluableOrders.map(ord => (
                                                                <button
                                                                    key={ord.id_orden}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOrderId(ord.id_orden);
                                                                        setIsDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-5 py-3.5 text-sm transition-colors border-b border-slate-50/50 last:border-0 hover:bg-slate-50 group flex items-center justify-between
                                                                        ${orderId === ord.id_orden ? 'bg-indigo-50 hover:bg-indigo-50/80 before:absolute before:left-0 before:w-1 before:h-8 before:bg-indigo-500 before:rounded-r-full relative' : ''}
                                                                    `}
                                                                >
                                                                    <div className={`flex flex-col gap-1 transition-transform ${orderId === ord.id_orden ? 'pl-2' : 'group-hover:translate-x-1'}`}>
                                                                        <span className={`font-black ${orderId === ord.id_orden ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                                            #{ord.id_orden} <span className="text-slate-400 font-medium px-1">·</span> {ord.proveedor}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-slate-400">Fecha: {new Date(ord.fecha_aprobacion).toLocaleDateString()}</span>
                                                                    </div>
                                                                    {orderId === ord.id_orden && (
                                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 ml-1 font-medium">
                                            Solo aparecen órdenes ya aprobadas. Cuanto más tiempo haya pasado, más preciso será el análisis.
                                        </p>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={evalLoading || !orderId}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        {evalLoading ? 'Analizando ventas reales...' : 'Comparar sugerencia vs. realidad'}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-5">
                                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-5 rounded-2xl text-center">
                                        <p className="font-black text-sm uppercase tracking-wide flex items-center justify-center gap-1"><CheckCircle2 size={14} /> Evaluación Completada</p>
                                        <p className="text-xs font-medium mt-1 opacity-80">El sistema ha registrado estos resultados para mejorar futuras sugerencias</p>
                                    </div>

                                    {/* Resumen */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orden evaluada</p>
                                        <p className="text-sm font-bold text-slate-700">#{orderId} · Días desde la aprobación: {evalResult.diasTranscurridos}</p>
                                    </div>
                                    
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle por producto</h4>
                                    
                                    <div className="space-y-3">
                                        {evalResult.evaluaciones?.map(ev => {
                                            const accuracy = factorToAccuracy(ev.factor_precision);
                                            const color = getAccuracyColor(accuracy);
                                            const verdict = getVerdict(ev.factor_precision);
                                            
                                            return (
                                                <div key={ev.id_producto} className={`p-4 rounded-2xl border ${color.border} ${color.bg}`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                                                {(() => { const Icon = verdict.icon; return <Icon size={16} />; })()} {ev.nombre_producto || `Producto #${ev.id_producto}`}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-500 mt-1 ml-6">{verdict.label}</p>
                                                        </div>
                                                        <span className={`text-xl font-black ${color.text}`}>{accuracy}%</span>
                                                    </div>
                                                    {/* Detalle numérico claro */}
                                                    <div className="grid grid-cols-2 gap-3 ml-6">
                                                        <div className="bg-white/70 rounded-xl p-3 border border-white">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sugerido comprar</p>
                                                            <p className="text-lg font-black text-slate-700">{ev.sugerido} <span className="text-xs font-bold text-slate-400">unidades</span></p>
                                                        </div>
                                                        <div className="bg-white/70 rounded-xl p-3 border border-white">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Realmente vendido</p>
                                                            <p className="text-lg font-black text-slate-700">{ev.ventasReales} <span className="text-xs font-bold text-slate-400">unidades</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            setEvalResult(null);
                                            setOrderId('');
                                            setModalOpen(false);
                                        }}
                                        className="w-full mt-2 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors transition-transform active:scale-95"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AprendizajePage;
