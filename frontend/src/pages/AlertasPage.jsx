import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { AlertCircle, AlertTriangle, Info, ShieldCheck, RefreshCw } from 'lucide-react';

const AlertasPage = () => {
  const [alertas, setAlertas] = useState([]);
  const [stats, setStats] = useState({ critico: 0, advertencia: 0, info: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState('todas'); // 'todas', 'critico', 'advertencia', 'info'
  const toast = useToast();

  const fetchAlertas = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [alertasRes, statsRes, sessionRes] = await Promise.all([
        axios.get('/api/alertas'),
        axios.get('/api/alertas/stats'),
        axios.get('/api/session-info')
      ]);

      if (sessionRes.data) {
        setIsAdmin(sessionRes.data.rol === 'Administrador');
      }

      if (alertasRes.data.success) setAlertas(alertasRes.data.alerts);
      if (statsRes.data.success) setStats(statsRes.data.stats);
    } catch (e) {
      toast.error('Error cargando el panel de alertas');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas(true);
    const interval = setInterval(() => fetchAlertas(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post('/api/alertas/generate');
      if (res.data.success) {
        toast.success(`Motor de reglas ejecutado. Se generaron ${res.data.generadas} alertas nuevas.`);
        await fetchAlertas();
      }
    } catch (e) {
      toast.error('Falló el procesamiento matemático de alertas.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResolve = async (idAlerta) => {
    try {
      const res = await axios.patch(`/api/alertas/${idAlerta}/resolve`);
      if (res.data.success) {
        toast.success('Alerta archivada');
        setAlertas(alertas.filter(a => a.id_alerta !== idAlerta));
        await fetchAlertas(); // Recargar stats
      }
    } catch (e) {
      toast.error('No se pudo archivar la alerta');
    }
  };

  const filteredAlertas = alertas.filter(a => filter === 'todas' ? true : a.severidad === filter);

  const SeveridadColors = {
    critico: 'bg-rose-50 text-rose-700 border-rose-200',
    advertencia: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  const SeveridadIcon = {
    critico: AlertCircle,
    advertencia: AlertTriangle,
    info: Info,
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-fade-in font-outfit">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 w-full mb-4 md:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-inner border border-rose-100">
              <AlertCircle size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Centro de Alertas</h1>
          </div>
          <p className="text-sm font-bold text-slate-600">
            Monitoreo constante e inteligente de stock bajo, excesos o problemas en ventas.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-shrink-0 w-full md:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? 'Buscando problemas...' : <><RefreshCw size={13} className="inline mr-1" />Actualizar Alertas</>}
          </button>
        )}
      </div>

      {/* TABS E INDICADORES (RESUMEN AVANZADO) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 z-10 relative">
        <button
          onClick={() => setFilter('todas')}
          className={`w-full h-24 sm:h-28 flex flex-col justify-center items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${filter === 'todas' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
        >
          <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Todas</p>
          <p className="text-3xl font-black">{stats.total}</p>
        </button>

        <button
          onClick={() => setFilter('critico')}
          className={`w-full h-24 sm:h-28 flex flex-col justify-center items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${filter === 'critico' ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-rose-200 shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-rose-200'}`}
        >
          <p className="text-[10px] uppercase font-black tracking-widest opacity-100 mb-1 flex items-center justify-center gap-1"><AlertCircle size={10} /> Críticas</p>
          <p className="text-3xl font-black">{stats.critico}</p>
        </button>

        <button
          onClick={() => setFilter('advertencia')}
          className={`w-full h-24 sm:h-28 flex flex-col justify-center items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${filter === 'advertencia' ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-amber-200 shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-amber-200'}`}
        >
          <p className="text-[10px] uppercase font-black tracking-widest opacity-100 mb-1 flex items-center justify-center gap-1"><AlertTriangle size={10} /> Advertencias</p>
          <p className="text-3xl font-black">{stats.advertencia}</p>
        </button>

        <button
          onClick={() => setFilter('info')}
          className={`w-full h-24 sm:h-28 flex flex-col justify-center items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${filter === 'info' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-blue-200 shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}
        >
          <p className="text-[10px] uppercase font-black tracking-widest opacity-100 mb-1 flex items-center justify-center gap-1"><Info size={10} /> Sobrestock</p>
          <p className="text-3xl font-black">{stats.info}</p>
        </button>
      </div>

      {/* LISTA DE ALERTAS */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
        ) : filteredAlertas.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-[2rem]">
            <div className="mb-4 flex justify-center text-slate-300"><ShieldCheck size={48} /></div>
            <p className="text-lg font-black text-slate-800 tracking-tight">No tienes ninguna alerta activa aquí.</p>
            <p className="text-sm font-bold text-slate-400 mt-1">El inventario está en perfecto estado y cubierto.</p>
          </div>
        ) : (
          filteredAlertas.map(alerta => (
            <div key={alerta.id_alerta} className={`p-4 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 transition-all hover:shadow-xl ${SeveridadColors[alerta.severidad]}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = SeveridadIcon[alerta.severidad]; return <Icon size={20} />; })()}
                  <h3 className="text-lg font-black uppercase tracking-tight">{alerta.nombre_producto} <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded ml-2 shadow-sm">{alerta.codigo}</span></h3>
                </div>
                <p className="text-sm font-bold opacity-100 text-slate-800 leading-relaxed max-w-3xl">
                  {alerta.mensaje}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-80 text-slate-600">
                  Detectada: {new Date(alerta.fecha_creacion).toLocaleString()} • Tipo: {alerta.tipo.replace('_', ' ')}
                </p>
              </div>

              <button
                onClick={() => handleResolve(alerta.id_alerta)}
                className="px-6 py-3 bg-white/60 hover:bg-white text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors border border-transparent hover:border-slate-200 shrink-0"
              >
                ✓ Marcar Resuelta
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default AlertasPage;
