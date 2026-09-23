import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import { ShieldOff, Lock, Eye, EyeOff, Save, UserPlus, Users, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const RegistroTenderoPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.rol === 'Administrador';

  const [tenderos, setTenderos] = useState([]);
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

  const cargarTenderos = useCallback(async (signal) => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/tendero', { ...(signal && { signal }) });
      if (signal && signal.aborted) return;
      setTenderos(Array.isArray(data) ? data : []);
    } catch (err) {
      if (axios.isCancel(err) || (signal && signal.aborted)) return;
      console.error('Error cargando tenderos', err);
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (isAdmin) {
      cargarTenderos(controller.signal);
    }
    return () => controller.abort();
  }, [isAdmin, cargarTenderos]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center">
        <div className="mb-6 flex justify-center text-peligro"><ShieldOff size={80} /></div>
        <h2 className="titular text-4xl text-peligro mb-4">Acceso Denegado</h2>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-peligro-suave max-w-md">
          <p className="text-slate-500 font-medium mb-2">Sección Restringida</p>
          <p className="text-slate-500 font-medium text-sm">La creación de usuarios y accesos es exclusiva para el administrador de la tienda.</p>
        </div>
      </div>
    );
  }

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
        const { data } = await axios.put(`/api/tendero/${formData.id_usuario}`, payload);
        toast.success(data.message || 'Datos de acceso actualizados');
        cancelEdit();
      } else {
        await axios.post('/api/tendero', formData);
        toast.success('Nuevo colaborador registrado con éxito');
        setFormData({
          id_usuario: '', nombres: '', genero: '', correo: '', celular: '', usuario: '', contrasena: ''
        });
      }
      cargarTenderos();
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarTendero = (id) => {
    openModal(
      'Eliminar Acceso al Sistema',
      '¿Estás seguro de eliminar a esta persona de tu equipo de trabajo? No podrá volver a ingresar al sistema.',
      async () => {
        try {
          await axios.delete(`/api/tendero/${id}`);
          toast.success('Miembro del equipo eliminado');
          cargarTenderos();
        } catch {
          toast.error('Error al suspender operador');
        }
      },
      'danger'
    );
  };

  return (
    <div className="animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
        <div>
          <h2 className="titular text-4xl text-tinta">Miembros del Equipo</h2>
          <span className="inline-block bg-azul/10 text-azul px-3 py-1 rounded-full font-bold text-xs shadow-sm mt-2 border border-azul/30">
            Gestión de usuarios y permisos de la tienda
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 lg:sticky lg:top-6 flex flex-col overflow-hidden">
            <div className="p-6 lg:p-8 flex-1">
              <h3 className="titular text-2xl text-tinta mb-6 pb-4 border-b border-slate-100">
                {editMode ? 'Editar Información' : 'Registrar Colaborador'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="nombres" className="block text-xs font-semibold text-slate-600 pl-1 mb-2">Nombres Completos <span className="text-peligro">*</span></label>
                  <input id="nombres" required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Ej. Carlos Mendoza..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="celular" className="block text-xs font-semibold text-slate-600 pl-1 mb-2">Celular <span className="text-peligro">*</span></label>
                    <input id="celular" required type="tel" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="+57 320..." />
                  </div>
                  <div className="z-10 relative">
                    <span className="block text-xs font-semibold text-slate-600 pl-1 mb-2">Género <span className="text-peligro">*</span></span>
                    <div className="h-14">
                       <CustomSelect 
                         value={formData.genero} 
                         onChange={v => setFormData({...formData, genero: v})} 
                         className="h-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-azul text-tinta"
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
                  <label htmlFor="correo" className="block text-xs font-semibold text-slate-600 pl-1 mb-2">Correo Corporativo <span className="text-peligro">*</span></label>
                  <input id="correo" required type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="colaborador@stockpilot.com" />
                </div>

                <div className="bg-azul/5 p-4 border border-azul/30 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs text-azul pl-1 mb-2 text-center flex items-center justify-center gap-1"><Lock size={10} /> Datos para Ingresar al Sistema</h4>
                  
                  <div>
                    <label htmlFor="usuario" className="block text-xs font-semibold text-slate-600 pl-1 mb-2">Nombre de Usuario <span className="text-peligro">*</span></label>
                    <input id="usuario" required type="text" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} className="w-full p-4 bg-white border border-azul/30 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Ej. cx.mendoza" />
                  </div>

                  {!editMode && (
                    <div>
                      <label htmlFor="contrasena" className="block text-xs font-semibold text-slate-600 pl-1 mb-2">Contraseña de Acceso <span className="text-peligro">*</span></label>
                      <div className="relative">
                        <input id="contrasena" required minLength="8" type={showPassword ? 'text' : 'password'} value={formData.contrasena} onChange={e => setFormData({...formData, contrasena: e.target.value})} className="w-full p-4 pr-12 bg-white border border-azul/30 rounded-lg text-sm font-bold focus:border-azul outline-none text-tinta" placeholder="Mínimo 8 dígitos" />
                        <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-azul transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                  <button type="submit" disabled={isSubmitting} className={`w-full p-4 rounded-lg text-white text-xs font-bold shadow-lg transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${editMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-azul hover:bg-azul-hondo'}`}>
                    {editMode ? <Save size={14} /> : <UserPlus size={14} />}
                    {isSubmitting ? 'GUARDANDO...' : (editMode ? 'GUARDAR CAMBIOS' : 'CREAR ACCESO')}
                  </button>
                  {editMode && (
                    <button type="button" onClick={cancelEdit} className="w-full p-4 rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 text-xs font-bold transition-colors">
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
          
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <h3 className="titular text-xl text-tinta flex items-center gap-2">
               <Users size={18} className="text-azul" /> Equipo Registrado
             </h3>
             <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-2xl text-xs font-bold shadow-inner">
               {tenderos.length} PERSONAS
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-menu text-xs font-bold text-white whitespace-nowrap">
                    <th className="p-6 pl-8">Nombre del Colaborador</th>
                    <th className="p-6">Medios de Contacto</th>
                    <th className="p-6 text-center">Género</th>
                    <th className="p-6 text-center">Usuario Sistema</th>
                    <th className="p-6 pr-8 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-500 font-bold text-xs animate-pulse">Cargando perfiles del equipo...</td></tr>
                  ) : tenderos.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-slate-500 font-bold text-xs">Aún no has registrado a nadie en tu equipo</td></tr>
                  ) : (
                    tenderos.map(t => (
                      <tr key={t.id_usuario} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-6 pl-8 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg text-white font-bold shadow-lg shrink-0 ${t.genero === 'Femenino' ? 'bg-rose-400' : 'bg-azul'}`}>
                             {t.nombres.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="block text-lg font-bold text-tinta mb-1">{t.nombres}</strong>
                            <span className="text-slate-500 text-xs font-bold">ID #{t.id_usuario}</span>
                          </div>
                        </td>
                        <td className="p-6">
                           <div className="text-sm font-medium text-tinta-2">{t.celular}</div>
                           <div className="text-xs text-slate-500 font-bold">{t.correo}</div>
                        </td>
                        <td className="p-6 text-center">
                           <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-2xl text-xs font-bold border border-slate-200">
                             {t.genero}
                           </span>
                        </td>
                        <td className="p-6 text-center text-azul font-bold">
                           @{t.usuario}
                        </td>
                        <td className="p-6 pr-8">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditClick(t)} className="w-10 h-10 rounded-lg bg-amber-50 text-aviso hover:bg-amber-500 hover:text-white border border-aviso-suave flex items-center justify-center transition-colors transition-transform shadow-sm" title="Editar Información">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => eliminarTendero(t.id_usuario)} className="w-10 h-10 rounded-lg bg-rose-50 text-peligro hover:bg-peligro hover:text-white border border-peligro-suave flex items-center justify-center transition-colors transition-transform shadow-sm" title="Eliminar Acceso">
                              <Trash2 size={16} />
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
        <div className="fixed inset-0 bg-tinta/45 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden transform animate-scale-in border border-white">
            <div className={`p-8 text-center border-b ${modalConfig.type === 'danger' ? 'border-peligro-suave bg-rose-50' : 'border-aviso-suave bg-amber-50'}`}>
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg ${modalConfig.type === 'danger' ? 'bg-peligro-suave text-peligro' : 'bg-aviso-suave text-aviso'}`}>
                 {modalConfig.type === 'danger' ? <Trash2 size={32} /> : <AlertTriangle size={32} />}
              </div>
              <h3 className={`titular text-2xl ${modalConfig.type === 'danger' ? 'text-peligro' : 'text-aviso'}`}>
                {modalConfig.title}
              </h3>
            </div>
            <div className="p-8">
              <p className="text-slate-500 text-center font-medium leading-relaxed">{modalConfig.message}</p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4 rounded-b-2xl border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-4 rounded-lg text-xs text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
                className={`flex-1 px-4 py-4 rounded-lg text-white text-xs font-bold shadow-lg transition-transform transition-shadow active:scale-95 ${
                  modalConfig.type === 'danger' 
                    ? 'bg-rose-500 hover:bg-peligro' 
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroTenderoPage;
