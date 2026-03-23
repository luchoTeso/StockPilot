import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AnalisisDetalladoPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/ia/snapshot');
        // El controlador ahora devuelve response.data.data según mi actualización previa
        setData(response.data.data || []);
      } catch (err) {
        console.error('Error fetching snapshot:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
  }, []);

  return (
    <div className="animate-fade-in p-2 md:p-6 pb-20 space-y-10 font-outfit">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm active:scale-95">
             <span className="text-xl font-bold text-slate-800">←</span>
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">Análisis de Profundidad</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Métricas de Velocidad y Riesgo IA Strategic Core</p>
          </div>
        </div>
        <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100">
           Núcleo Estratégico v3.0
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                <th className="p-6">Identidad</th>
                <th className="p-6">ABC</th>
                <th className="p-6 text-center">Riesgo</th>
                <th className="p-6 text-center">Velocidad</th>
                <th className="p-6 text-center text-[9px]">Físico / Mínimo</th>
                <th className="p-6 text-center">Proyección</th>
                <th className="p-6 text-right px-10">Ingresos (30d)</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="7" className="p-24 text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">Analizando trazas de inventario...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="p-24 text-center text-slate-400 italic font-bold">No hay datos de rotación disponibles</td></tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6 font-black text-slate-800 uppercase tracking-tight">
                       <p className="text-sm">{item.nombre}</p>
                       <p className="text-[10px] text-slate-400 font-medium">#{item.id_producto}</p>
                    </td>
                    <td className="p-6">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${item.category === 'A' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : item.category === 'B' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{item.category}</span>
                    </td>
                    <td className="p-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${item.risk === 'high' ? 'bg-rose-500 animate-pulse' : item.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                          {item.risk === 'high' ? 'ALTO' : item.risk === 'medium' ? 'MEDIO' : 'BAJO'}
                       </span>
                    </td>
                    <td className="p-6 text-center font-black text-indigo-600 italic">{item.velocity.toFixed(2)} <span className="text-[9px] opacity-50 not-italic">u/d</span></td>
                    <td className="p-6 text-center">
                       <p className="font-black text-slate-800 text-base tracking-tighter">{item.stock_actual}</p>
                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mt-1">Sugerido: {item.stock_seguridad}u</p>
                    </td>
                    <td className="p-6 text-center">
                       <span className={`text-base font-black tracking-tighter ${item.days_to_exhaust < 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.days_to_exhaust === Infinity ? '∞' : `${item.days_to_exhaust}d`}
                       </span>
                    </td>
                    <td className="p-6 text-right px-10 font-black text-slate-800 text-base tracking-tighter italic">${item.revenue.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">🚀</div>
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Cálculo de Velocidad</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Tasa de consumo calculada mediante promedios móviles y estacionalidad predictiva.</p>
         </div>
         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">📊</div>
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Modelo Pareto ABC</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Segmentación de inventario por importancia financiera basada en el ticket total proyectado a 30 días.</p>
         </div>
         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:bg-rose-500 group-hover:text-white transition-colors">⏳</div>
            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Alerta Lead Time</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Indicadores críticos de reabastecimiento basados en el tiempo de respuesta del proveedor.</p>
         </div>
      </div>
    </div>
  );
};

export default AnalisisDetalladoPage;
