import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, X, AlertTriangle } from 'lucide-react';
import ExpenseModal from '../ExpenseModal';

const HistorialEgresosTab = ({ isSessionActive, setIsCashRegisterOpen, user: propUser }) => {
  const toast = useToast();
  const { user: authUser, checkSession } = useAuth();
  const user = propUser || authUser;
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [rejectExpenseId, setRejectExpenseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Estado para el límite de egreso configurable
  const [limiteEgreso, setLimiteEgreso] = useState(user?.limiteEgresoTendero || 150000);
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/caja/egresos');
      if (res.data.success) {
        setExpenses(res.data.expenses);
      }
    } catch {
      toast.error('Error al cargar egresos.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/caja/egreso/${id}/aprobar`);
      toast.success('Egreso aprobado');
      fetchExpenses();
    } catch {
      toast.error('Error al aprobar.');
    }
  };

  const handleRejectClick = (id) => {
    setRejectExpenseId(id);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectExpenseId) return;
    try {
      await axios.put(`/api/caja/egreso/${rejectExpenseId}/rechazar`, { notas_admin: rejectReason });
      toast.success('Egreso rechazado');
      setRejectExpenseId(null);
      fetchExpenses();
    } catch {
      toast.error('Error al rechazar.');
    }
  };

  const handleSaveLimit = async () => {
    if (savingLimit) return;
    try {
      setSavingLimit(true);
      const res = await axios.put(`/api/tienda/update/${user.tiendaId}`, { limite_egreso_tendero: limiteEgreso });
      if (res.data.success) {
        toast.success('Límite actualizado correctamente');
        if (typeof checkSession === 'function') {
          await checkSession(); // Actualiza el contexto global
        }
      }
    } catch (error) {
      console.error('Error al actualizar límite:', error);
      toast.error(error.response?.data?.error || error.message || 'Error al actualizar límite');
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6 border-b border-slate-100 pb-6">
          <h2 className="titular text-3xl text-tinta">Gestión de Egresos</h2>
          
          <div className="flex flex-wrap items-center gap-4">
             <button
               type="button"
               onClick={() => {
                 if (!isSessionActive) {
                   toast.error('Debes abrir la caja antes de registrar un egreso.');
                   if (setIsCashRegisterOpen) setIsCashRegisterOpen(true);
                   return;
                 }
                 setIsExpenseModalOpen(true);
               }}
               className="h-11 px-5 bg-rose-500 hover:bg-peligro text-white rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2 whitespace-nowrap active:scale-95"
             >
               <DollarSign size={16} /> Registrar Egreso
             </button>

             <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
               <div className="flex flex-col">
                 <label className="text-xs font-bold text-slate-500">Límite para Tenderos</label>
                 <div className="relative mt-1">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                   <input 
                     type="number" 
                     value={limiteEgreso}
                     onChange={(e) => setLimiteEgreso(e.target.value)}
                     className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-tinta-2 w-32 focus:outline-none focus:border-azul focus:ring-2 focus:ring-azul/30 transition-all"
                   />
                 </div>
               </div>
               <button 
                 type="button"
                 onClick={handleSaveLimit} 
                 disabled={savingLimit || !limiteEgreso}
                 className="h-10 mt-1 sm:mt-5 px-4 bg-azul hover:bg-azul-hondo text-white rounded-lg text-xs font-bold transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
               >
                 {savingLimit ? 'Guardando...' : 'Guardar'}
               </button>
             </div>
          </div>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-100 rounded-lg"></div>
          <div className="h-12 bg-slate-100 rounded-lg"></div>
          <div className="h-12 bg-slate-100 rounded-lg"></div>
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-center text-slate-500 font-bold py-8 text-sm">No hay egresos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 bg-slate-50/50">
                <th className="p-4">Fecha</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Motivo</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Evidencia</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {expenses.map((e) => (
                <tr key={e.id_egreso} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500 text-xs">
                     {new Date(e.fecha_registro).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}<br/>
                     <span className="text-xs">{new Date(e.fecha_registro).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="p-4">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        e.estado === 'Aprobado' ? 'bg-exito-suave text-emerald-700' : e.estado === 'Rechazado' ? 'bg-peligro-suave text-rose-700' : 'bg-aviso-suave text-aviso'
                     }`}>
                        {e.estado}
                     </span>
                  </td>
                  <td className="p-4 text-tinta-2">{e.usuario_nombre}</td>
                  <td className="p-4 text-slate-600 font-bold">{e.categoria}</td>
                  <td className="p-4 text-slate-500 max-w-[200px] truncate" title={e.motivo}>{e.motivo}</td>
                  <td className="p-4 text-right font-bold text-peligro">${Number(e.monto).toLocaleString('es-CO')}</td>
                  <td className="p-4 text-center">
                    {e.foto_soporte ? (
                      <button onClick={() => setPreviewImage(e.foto_soporte)} className="text-azul hover:text-azul underline text-xs font-bold">
                        Ver Foto
                      </button>
                    ) : (
                      <span className="text-slate-500 text-xs">Sin Foto</span>
                    )}
                  </td>
                  <td className="p-4 text-center flex justify-center items-center gap-2">
                    {e.estado === 'Registrado' ? (
                      <>
                        <button onClick={() => handleApprove(e.id_egreso)} className="bg-exito-suave text-exito hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors">Aprobar</button>
                        <button onClick={() => handleRejectClick(e.id_egreso)} className="bg-peligro-suave text-peligro hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors">Rechazar</button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-500">
                          Por: {e.admin_nombre || 'Desconocido'}
                        </span>
                        {e.notas_admin && (
                          <span className="text-xs text-peligro truncate max-w-[100px]" title={e.notas_admin}>
                            Nota: {e.notas_admin}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Preview Foto */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
           <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
             <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white hover:text-rose-400 bg-black/50 p-2 rounded-full transition-colors z-10"><X size={24}/></button>
             <img src={previewImage} alt="Evidencia" className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-lg" />
           </div>
        </div>
      )}

      {/* Modal Registrar Egreso */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseRegistered={fetchExpenses}
        user={user}
      />

      {/* Modal Rechazar Egreso */}
      {rejectExpenseId && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-peligro text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="titular text-lg">Rechazar Egreso</h3>
                <p className="text-peligro-suave text-xs font-medium">Por favor indica el motivo del rechazo.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Motivo del rechazo (Opcional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: El recibo no es válido, monto incorrecto..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-colors resize-none h-24 font-medium text-tinta-2 placeholder-slate-400"
                ></textarea>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectExpenseId(null)}
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  className="flex-1 px-4 py-3 rounded-lg bg-rose-500 text-white font-bold text-xs shadow-lg hover:bg-peligro transition-all"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialEgresosTab;
