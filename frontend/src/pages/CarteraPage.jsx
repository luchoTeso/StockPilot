import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Users, DollarSign, Brain, Plus, Search, CheckCircle2, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CarteraPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  // Selected Client
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Form States
  const [abonoMonto, setAbonoMonto] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', celular: '', limite_credito: 0 });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [submittingAbono, setSubmittingAbono] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/clientes');
      setClientes(data.clientes || []);
    } catch (error) {
      toast.error('Error al cargar la cartera de clientes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/clientes', nuevoCliente);
      toast.success('Cliente registrado exitosamente.');
      setIsClientModalOpen(false);
      setNuevoCliente({ nombre: '', celular: '', limite_credito: 0 });
      fetchClientes();
    } catch (error) {
      toast.error('Error al crear el cliente.');
    }
  };

  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    setSubmittingAbono(true);
    try {
      await axios.post(`/api/clientes/${selectedClient.id_cliente}/abonos`, {
        monto: parseFloat(abonoMonto),
        metodo_pago: 'Efectivo'
      });
      toast.success('Abono registrado exitosamente.');
      setIsAbonoModalOpen(false);
      setAbonoMonto('');
      fetchClientes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar el abono.');
    } finally {
      setSubmittingAbono(false);
    }
  };

  const handleEvaluateRisk = async (cliente) => {
    setSelectedClient(cliente);
    setIsAiModalOpen(true);
    setLoadingAi(true);
    setAiAnalysis(null);
    try {
      const { data } = await axios.get(`/api/ia/assess-risk/${cliente.id_cliente}`);
      setAiAnalysis(data.analisis);
    } catch (error) {
      toast.error('Error al evaluar riesgo con IA.');
      setIsAiModalOpen(false);
    } finally {
      setLoadingAi(false);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-12 font-outfit">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="text-indigo-600" size={32} />
            Gestión de Cartera (Fiados)
          </h1>
          <p className="text-slate-500 font-medium mt-1">Controla las deudas de tus clientes y registra abonos.</p>
        </div>
        <button
          onClick={() => setIsClientModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total en la Calle</p>
            <p className="text-2xl font-black text-slate-800">
              ${clientes.reduce((acc, c) => acc + (c.saldo_pendiente > 0 ? c.saldo_pendiente : 0), 0).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      {/* Búsqueda y Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest">
                <th className="p-4 font-black">Cliente</th>
                <th className="p-4 font-black">Cupo Asignado</th>
                <th className="p-4 font-black">Saldo Pendiente</th>
                <th className="p-4 font-black text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">Cargando...</td></tr>
              ) : filteredClientes.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">No hay clientes registrados.</td></tr>
              ) : (
                filteredClientes.map(cliente => (
                  <tr key={cliente.id_cliente} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{cliente.nombre}</td>
                    <td className="p-4 font-bold text-slate-600">${Number(cliente.limite_credito).toLocaleString('es-CO')}</td>
                    <td className="p-4 font-black text-orange-600">${Number(cliente.saldo_pendiente).toLocaleString('es-CO')}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button 
                        onClick={() => { setSelectedClient(cliente); setIsAbonoModalOpen(true); }}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
                        title="Registrar Abono"
                      >
                        <DollarSign size={18} />
                      </button>
                      <button 
                        onClick={() => handleEvaluateRisk(cliente)}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
                        title="Evaluar Riesgo IA"
                      >
                        <Brain size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-4">Registrar Nuevo Cliente</h3>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre</label>
                <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Celular</label>
                <input type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500" value={nuevoCliente.celular} onChange={e => setNuevoCliente({...nuevoCliente, celular: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cupo Máximo</label>
                <input required type="number" min="0" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500" value={nuevoCliente.limite_credito} onChange={e => setNuevoCliente({...nuevoCliente, limite_credito: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Abono */}
      {isAbonoModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black mb-2">Registrar Abono</h3>
            <p className="text-slate-500 font-bold mb-4">Cliente: <span className="text-slate-800">{selectedClient.nombre}</span></p>
            <p className="text-sm font-bold text-slate-500 mb-6">Saldo Actual: <span className="text-orange-600">${Number(selectedClient.saldo_pendiente).toLocaleString('es-CO')}</span></p>
            
            <form onSubmit={handleRegistrarAbono} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Monto en Efectivo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input required type="number" min="1" max={selectedClient.saldo_pendiente > 0 ? selectedClient.saldo_pendiente : undefined} className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 text-xl font-black" value={abonoMonto} onChange={e => setAbonoMonto(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAbonoModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl" disabled={submittingAbono}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-2" disabled={submittingAbono}>
                  {submittingAbono ? 'Registrando...' : <><CheckCircle2 size={18} /> Confirmar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal IA Riesgo */}
      {isAiModalOpen && selectedClient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 flex items-center gap-2">
                  <Brain className="text-indigo-600" />
                  Perfil IA
                </h3>
                <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-800"><CheckCircle2 /></button>
             </div>
             
             {loadingAi ? (
               <div className="text-center py-8">
                 <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                 <p className="text-slate-500 font-bold animate-pulse">Analizando historial crediticio de {selectedClient.nombre}...</p>
               </div>
             ) : aiAnalysis ? (
               <div className="space-y-6">
                 <div className={`p-6 rounded-2xl border-2 ${
                   aiAnalysis.riesgo === 'Alto' ? 'border-rose-200 bg-rose-50' :
                   aiAnalysis.riesgo === 'Medio' ? 'border-orange-200 bg-orange-50' : 'border-emerald-200 bg-emerald-50'
                 }`}>
                   <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Riesgo Calculado</p>
                   <p className={`text-4xl font-black ${
                     aiAnalysis.riesgo === 'Alto' ? 'text-rose-600' :
                     aiAnalysis.riesgo === 'Medio' ? 'text-orange-600' : 'text-emerald-600'
                   }`}>{aiAnalysis.riesgo}</p>
                 </div>
                 
                 <div>
                   <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Perfil</p>
                   <p className="text-lg font-bold text-slate-800">{aiAnalysis.perfil}</p>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-xl">
                   <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Razón IA</p>
                   <p className="text-sm font-medium text-slate-700">{aiAnalysis.razon}</p>
                 </div>

                 <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                   <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Sugerencia</p>
                   <p className="text-sm font-bold text-indigo-900">{aiAnalysis.sugerencia}</p>
                 </div>
               </div>
             ) : (
               <div className="text-center py-8 text-rose-500 font-bold">
                 Hubo un error al generar el perfil.
               </div>
             )}
             
             {!loadingAi && (
                <button onClick={() => setIsAiModalOpen(false)} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800">Cerrar</button>
             )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CarteraPage;
