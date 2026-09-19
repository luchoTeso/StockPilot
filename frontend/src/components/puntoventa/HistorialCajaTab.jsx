import { useState, useEffect } from 'react';
import axios from 'axios';

const HistorialCajaTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('/api/caja/historial');
        if (data.success) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Error al cargar historial de caja:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleString('es-CO', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
      <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-800 mb-6">Historial de Sesiones de Caja</h2>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
      ) : history.length === 0 ? (
        <p className="text-center text-slate-400 font-bold py-8 uppercase tracking-widest text-sm">No hay registros de sesiones de caja.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">
                <th className="p-4">Estado</th>
                <th className="p-4">Apertura</th>
                <th className="p-4">Cierre</th>
                <th className="p-4">Vendedor</th>
                <th className="p-4 text-right">M. Apertura</th>
                <th className="p-4 text-right">M. Calculado</th>
                <th className="p-4 text-right">M. Declarado</th>
                <th className="p-4 text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {history.map((s) => {
                const diff = parseFloat(s.diferencia || 0);
                const isDescuadre = diff !== 0 && s.estado === 'Cerrada';
                return (
                  <tr key={s.id_sesion} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        s.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {s.estado}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{formatDate(s.fecha_apertura)}</td>
                    <td className="p-4 text-slate-600">{formatDate(s.fecha_cierre)}</td>
                    <td className="p-4 font-bold text-slate-800">{s.vendedor_nombre || `ID: ${s.id_vendedor}`}</td>
                    <td className="p-4 text-right text-indigo-700 font-bold">{formatCurrency(s.monto_apertura)}</td>
                    <td className="p-4 text-right text-slate-600">{s.estado === 'Cerrada' ? formatCurrency(s.monto_cierre_calculado) : '---'}</td>
                    <td className="p-4 text-right text-slate-800 font-bold">{s.estado === 'Cerrada' ? formatCurrency(s.monto_cierre_declarado) : '---'}</td>
                    <td className={`p-4 text-right font-black ${isDescuadre ? (diff < 0 ? 'text-rose-600' : 'text-amber-500') : 'text-emerald-500'}`}>
                      {s.estado === 'Cerrada' ? formatCurrency(diff) : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistorialCajaTab;
