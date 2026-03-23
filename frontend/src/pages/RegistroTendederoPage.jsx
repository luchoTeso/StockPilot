import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';

const RegistroTendederoPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.rol === 'Administrador';

  const [tendederos, setTendederos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id_usuario: '',
    nombres: '',
    genero: '',
    correo: '',
    celular: '',
    usuario: '',
    contrasena: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: null, type: 'warning' });

  const openModal = (title, message, onConfirm, type = 'warning') => {
    setModalConfig({ title, message, onConfirm, type });
    setModalOpen(true);
  };

  useEffect(() => {
    if (isAdmin) {
      cargarTendederos();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center font-outfit">
        <div className="text-[100px] mb-6 drop-shadow-xl animate-bounce-slow">🚫</div>
        <h2 className="text-4xl font-black text-rose-600 tracking-tighter uppercase italic mb-4">Acceso Denegado</h2>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-rose-100 max-w-md">
          <p className="text-slate-500 font-medium mb-2">Protocolo de seguridad activado.</p>
          <p className="text-slate-500 font-medium text-sm">El registro de operadores está restringido exclusivamente al nivel <span className="text-rose-600 font-bold">Administrador</span>.</p>
        </div>
      </div>
    );
  }

  const cargarTendederos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/tendedero');
      setTendederos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando tendederos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (t) => {
    setEditMode(true);
    setFormData({
      id_usuario: t.id_usuario,
      nombres: t.nombres,
      genero: t.genero,
      correo: t.correo,
      celular: t.celular,
      usuario: t.usuario,
      contrasena: '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setFormData({
      id_usuario: '', nombres: '', genero: '', correo: '', celular: '', usuario: '', contrasena: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editMode) {
        const payload = { ...formData };
        delete payload.contrasena; 
        const { data } = await axios.put(`/api/tendedero/${formData.id_usuario}`, payload);
        toast.success(data.message || 'Operador actualizado con éxito');
        cancelEdit();
      } else {
        const { data } = await axios.post('/api/tendedero', formData);
        toast.success('Operador acreditado con éxito');
        setFormData({
          id_usuario: '', nombres: '', genero: '', correo: '', celular: '', usuario: '', contrasena: ''
        });
      }
      cargarTendederos();
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarTendedero = (id) => {
    openModal(
      'Suspensión de Operador',
      '¿Autorizas la destitución inmediata de este perfil operativo? Al confirmar, se le revocará el acceso permanentemente del ecosistema.',
      async () => {
        try {
          await axios.delete(`/api/tendedero/${id}`);
          toast.success('Perfil operativo removido');
          cargarTendederos();
        } catch (err) {
          toast.error('Error al suspender operador');
        }
      },
      'danger'
    );
  };

  return (
    <div className="animate-fade-in pb-12 font-outfit">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Personal Operativo</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Gestión Central de Credenciales Tendedero</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 lg:sticky lg:top-6 flex flex-col overflow-hidden">
            <div className="p-6 lg:p-8 flex-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase mb-6 pb-4 border-b border-slate-100">
                {editMode ? 'Editar Perfil' : 'Acreditar Perfil'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Nombres Completos <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="Ej. Carlos Mendoza..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Celular <span className="text-rose-500">*</span></label>
                    <input required type="tel" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="+57 320..." />
                  </div>
                  <div className="z-10 relative">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Género <span className="text-rose-500">*</span></label>
                    <div className="h-14">
                       <CustomSelect 
                         value={formData.genero} 
                         onChange={v => setFormData({...formData, genero: v})} 
                         className="h-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
                         options={[
                           { value: 'Masculino', label: 'Masculino' },
                           { value: 'Femenino', label: 'Femenino' },
                           { value: 'Otro', label: 'Otro' },
                           { value: 'Prefiero no decir', label: 'Prefiero no decir' }
                         ]} 
                         placeholder="Selec..." 
                       />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Correo Corporativo <span className="text-rose-500">*</span></label>
                  <input required type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800" placeholder="tendedero@stockpilot.com" />
                </div>

                <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-[2rem] space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pl-1 mb-2 text-center">🔐 Credenciales de Sistema</h4>
                  
                  <div>
                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1 mb-2">Identificador Usuario <span className="text-rose-500">*</span></label>
                    <input required type="text" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} className="w-full p-4 bg-white border border-indigo-100 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none text-indigo-900" placeholder="Ej. cx.mendoza" />
                  </div>

                  {!editMode && (
                    <div>
                      <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1 mb-2">Contraseña de Acceso <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input required minLength="6" type={showPassword ? 'text' : 'password'} value={formData.contrasena} onChange={e => setFormData({...formData, contrasena: e.target.value})} className="w-full p-4 pr-12 bg-white border border-indigo-100 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none text-indigo-900" placeholder="Mínimo 6 dígitos" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl drop-shadow-sm hover:scale-110 transition-transform">
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                  <button type="submit" disabled={isSubmitting} className={`w-full p-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${editMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                    <span>{editMode ? '💾' : '🚀'}</span> {isSubmitting ? 'SINCRONIZANDO...' : (editMode ? 'ACTUALIZAR FICHA' : 'EMITIR CREDENCIALES')}
                  </button>
                  {editMode && (
                    <button type="button" onClick={cancelEdit} className="w-full p-4 rounded-2xl text-slate-500 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
                      CANCELAR
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Tabla Analítica */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               👥 Equipo Autorizado
             </h3>
             <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-inner">
               {tendederos.length} ACTIVOS
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                    <th className="p-6 pl-8">Operador</th>
                    <th className="p-6">Contacto</th>
                    <th className="p-6 text-center">Identidad</th>
                    <th className="p-6 text-center">Acceso</th>
                    <th className="p-6 pr-8 text-right">Controles</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Desencriptando base de datos...</td></tr>
                  ) : tendederos.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No existen operadores en la red</td></tr>
                  ) : (
                    tendederos.map(t => (
                      <tr key={t.id_usuario} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-6 pl-8 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg text-white font-black shadow-lg shrink-0 ${t.genero === 'Femenino' ? 'bg-rose-400 shadow-rose-200' : 'bg-indigo-400 shadow-indigo-200'}`}>
                             {t.nombres.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="block text-lg font-black text-slate-800 tracking-tighter mb-1">{t.nombres}</strong>
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">ID #{t.id_usuario}</span>
                          </div>
                        </td>
                        <td className="p-6">
                           <div className="text-sm font-medium text-slate-700">{t.celular}</div>
                           <div className="text-xs text-slate-500 font-bold italic">{t.correo}</div>
                        </td>
                        <td className="p-6 text-center">
                           <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                             {t.genero}
                           </span>
                        </td>
                        <td className="p-6 text-center text-indigo-600 font-black">
                           @{t.usuario}
                        </td>
                        <td className="p-6 pr-8">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditClick(t)} className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-100 flex items-center justify-center text-lg transition-all hover:scale-105 hover:-translate-y-1 shadow-sm" title="Actualizar Credenciales">
                              ✏️
                            </button>
                            <button onClick={() => eliminarTendedero(t.id_usuario)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 flex items-center justify-center text-lg transition-all hover:scale-105 hover:-translate-y-1 shadow-sm" title="Revocar Acceso">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4 font-outfit">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform animate-scale-in border border-white">
            <div className={`p-8 text-center border-b ${modalConfig.type === 'danger' ? 'border-rose-100 bg-rose-50' : 'border-amber-100 bg-amber-50'}`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg ${modalConfig.type === 'danger' ? 'bg-rose-100 text-rose-600 shadow-rose-200' : 'bg-amber-100 text-amber-600 shadow-amber-200'}`}>
                 {modalConfig.type === 'danger' ? '🗑️' : '⚠️'}
              </div>
              <h3 className={`text-2xl font-black tracking-tighter italic uppercase ${modalConfig.type === 'danger' ? 'text-rose-600' : 'text-amber-600'}`}>
                {modalConfig.title}
              </h3>
            </div>
            <div className="p-8">
              <p className="text-slate-500 text-center font-medium leading-relaxed">{modalConfig.message}</p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4 rounded-b-[2.5rem] border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-4 rounded-2xl text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar Operación
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
                className={`flex-1 px-4 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all hover:-translate-y-1 active:scale-95 ${
                  modalConfig.type === 'danger' 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                }`}
              >
                Proceder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroTendederoPage;
