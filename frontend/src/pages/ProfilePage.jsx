import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CustomSelect from '../components/CustomSelect';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    nombres: '',
    correo: '',
    usuario: '',
    celular: '',
    genero: '',
    rol: '',
    foto_url: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showPassModal, setShowPassModal] = useState(false);
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/perfil');
      setProfileData(data.user);
      setEditForm(data.user);
    } catch (error) {
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await axios.put('/api/perfil', editForm);
      setProfileData(editForm);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error('Las contraseñas no coinciden');
    }
    try {
      await axios.put('/api/perfil/password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      setShowPassModal(false);
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña actualizada');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  // Lógica de Foto (Drag & Drop + Input)
  const handleFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      return toast.error('Solo se permiten imágenes');
    }

    // Simulación de subida (En una app real aquí se enviaría a un S3 o se guardaría en el server)
    // Para esta demo usaremos Base64 para persistir la visualización
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        await axios.put('/api/perfil', { ...profileData, foto_url: base64String });
        setProfileData(prev => ({ ...prev, foto_url: base64String }));
        toast.success('Foto de perfil actualizada');
      } catch (err) {
        toast.error('Error al guardar foto');
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-300">CARGANDO PERFIL...</div>;

  return (
    <div className="animate-fade-in p-4 md:p-8 max-w-5xl mx-auto font-outfit pb-20">
      <header className="mb-10 flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Mi Perfil</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Administración de Cuenta y Seguridad</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
          >
            Editar Información
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
            <button onClick={handleSaveProfile} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">Guardar Cambios</button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Izquierdo: Foto y Básico */}
        <div className="space-y-6">
          <div
            className={`bg-white p-8 rounded-[2.5rem] shadow-xl border-2 text-center transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50 border-dashed scale-105' : 'border-white'}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="relative group mx-auto w-32 h-32 mb-6 cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFile(e.target.files[0])} accept="image/*" />
              {profileData.foto_url ? (
                <img src={profileData.foto_url} alt="Perfil" className="w-full h-full object-cover rounded-[2rem] shadow-lg border-4 border-white" />
              ) : (
                <div className="w-full h-full bg-slate-100 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner group-hover:bg-slate-200 transition-colors">
                  {profileData.genero === 'Femenino' ? '👩‍💼' : '👨‍💼'}
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/40 rounded-[2rem] opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-tighter">Cambiar</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">{profileData.nombres}</h2>
            <p className="text-indigo-600 text-sm font-bold">@{profileData.usuario}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">ID de Colaborador: #{profileData.id_usuario || '...'}</p>

            <div className="mt-8 flex justify-center gap-2">
              <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-tighter">{profileData.rol}</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-tighter border border-indigo-100">Activo</span>
            </div>
          </div>

          <button
            onClick={() => setShowPassModal(true)}
            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">🔒</div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Seguridad</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Actualizar Clave</p>
              </div>
            </div>
            <span className="text-slate-300">→</span>
          </button>
        </div>

        {/* Lado Derecho: Formulario Detallado */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 border-b border-slate-50 pb-5">Datos Personales y de Contacto</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Nombres Completos</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.nombres}
                  onChange={e => setEditForm({ ...editForm, nombres: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                />
              ) : (
                <p className="text-base font-black text-slate-700 tracking-tight">{profileData.nombres || '---'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Nombre de Usuario</label>
              <p className="text-base font-black text-slate-700 tracking-tight bg-slate-50 p-4 rounded-2xl opacity-60">@{profileData.usuario}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Correo Corporativo</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.correo}
                  onChange={e => setEditForm({ ...editForm, correo: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                />
              ) : (
                <p className="text-base font-black text-slate-700 tracking-tight">{profileData.correo || '---'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Número Celular</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.celular}
                  onChange={e => setEditForm({ ...editForm, celular: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                />
              ) : (
                <p className="text-base font-black text-slate-700 tracking-tight">{profileData.celular || '---'}</p>
              )}
            </div>

            <div className="space-y-2 relative z-10">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Género</label>
              {isEditing ? (
                <div className="h-14">
                  <CustomSelect
                    value={editForm.genero}
                    onChange={v => setEditForm({ ...editForm, genero: v })}
                    className="h-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-700"
                    options={[
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Femenino', label: 'Femenino' },
                      { value: 'Otro', label: 'Otro' },
                      { value: 'Prefiero no decir', label: 'Prefiero no decir' }
                    ]}
                    placeholder="Selec..."
                  />
                </div>
              ) : (
                <p className="text-base font-black text-slate-700 tracking-tight">{profileData.genero || '---'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Nivel de Acceso</label>
              <p className="text-base font-black text-slate-700 tracking-tight bg-slate-50 p-4 rounded-2xl opacity-60 italic">{profileData.rol}</p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Estado del Sistema</p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1 flex items-center gap-1">✨ Asistente Inteligente: Conectado</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black italic uppercase text-indigo-50">Acceso {profileData.rol === 'Administrador' ? 'Total' : 'Autorizado'}</p>
              <p className="text-[8px] opacity-40 uppercase mt-1">Credencial Segura: {profileData.usuario?.slice(0, 4).toUpperCase()}-SP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambio de Contraseña */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleChangePassword} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-2">Seguridad</h2>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mb-8">Actualización de Credenciales</p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Contraseña Actual</label>
                <input
                  type="password"
                  value={passData.currentPassword}
                  required
                  onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={passData.newPassword}
                  required
                  onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Confirmar Nueva</label>
                <input
                  type="password"
                  value={passData.confirmPassword}
                  required
                  onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-10">
              <button
                type="button"
                onClick={() => setShowPassModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >Cerrar</button>
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
              >Actualizar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
