import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, BarChart2, Clock } from 'lucide-react';

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
             <ArrowLeft size={20} className="text-slate-800" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">Detalle de Productos</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Revisión de rotación y salud del inventario</p>
          </div>
        </div>
        <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Motor IA Activo
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                <th className="p-6">Producto</th>
                <th className="p-6">Tipo</th>
                <th className="p-6 text-center">Estado</th>
                <th className="p-6 text-center">Ventas / Día</th>
                <th className="p-6 text-center text-[9px]">Stock / Mínimo</th>
                <th className="p-6 text-center">Stock para</th>
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
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${item.category === 'A' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : item.category === 'B' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{item.category === 'A' ? 'A (Alta)' : item.category === 'B' ? 'B (Media)' : 'C (Baja)'}</span>
                    </td>
                    <td className="p-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${item.risk === 'high' ? 'bg-rose-500 animate-pulse' : item.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                          {item.risk === 'high' ? 'ALTO' : item.risk === 'medium' ? 'MEDIO' : 'BAJO'}
                       </span>
                    </td>
                    <td className="p-6 text-center font-black text-indigo-600 italic">{(Number(item.velocity) || 0).toFixed(2)} <span className="text-[9px] opacity-50 not-italic">u/d</span></td>
                    <td className="p-6 text-center">
                       <p className="font-black text-slate-800 text-base tracking-tighter">{item.stock_actual}</p>
                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mt-1">Sugerido: {item.stock_seguridad}u</p>
                    </td>
                    <td className="p-6 text-center">
                       <span className={`text-base font-black tracking-tighter ${item.days_to_exhaust === null || item.days_to_exhaust === Infinity || item.days_to_exhaust > 90 ? 'text-emerald-600' : (item.days_to_exhaust < 5 ? 'text-rose-600' : 'text-amber-600')}`}>
                          {item.days_to_exhaust === null || item.days_to_exhaust === Infinity ? 'Estable' : `${item.days_to_exhaust} días`}
                       </span>
                    </td>
                    <td className="p-6 text-right px-10 font-black text-slate-800 text-base tracking-tighter italic">${(Number(item.revenue) || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Rocket size={20} /></div>
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Ritmo de Ventas</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Cuánto se está vendiendo al día (en promedio), adaptándose automáticamente a cambios rápidos para que nunca quedes sin producto.</p>
         </div>
         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors"><BarChart2 size={20} /></div>
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Ganancia Principal</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Clasificamos tus productos para mostrarte cuáles te dejan la mayor rentabilidad (Tus estrellas Tipo A).</p>
         </div>
         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-rose-500 group-hover:text-white transition-colors"><Clock size={20} /></div>
            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Alertas de Agotamiento</h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Te avisamos cuando tu stock está tan bajo que no te alcanzará mientras esperas al camión del proveedor.</p>
         </div>
      </div>
    </div>
  );
};

export default AnalisisDetalladoPage;
