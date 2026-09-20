import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CustomSelect from '../components/CustomSelect';
import { User, Lock, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
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

  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false); // Modal confirmación desactivar
  const [disablePassword, setDisablePassword] = useState('');



  const handleGenerate2FA = async () => {
    try {
      const { data } = await axios.post('/api/2fa/generate');
      if (data.success) {
        setQrCodeUrl(data.qrCode);
        setShow2FAModal(true);
      }
    } catch {
      toast.error('Error generando configuración 2FA');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/2fa/verify', { token: totpToken });
      toast.success('2FA Habilitado con éxito');
      setShow2FAModal(false);
      setTotpToken('');
      window.location.reload(); // Recargar para actualizar el estado user de AuthContext
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código incorrecto');
    }
  };

  const handleDisable2FA = () => {
    setShowDisableConfirm(true);
  };

  const confirmDisable2FA = async (e) => {
    if (e) e.preventDefault();
    if (!disablePassword) {
      return toast.error('Debe ingresar su contraseña para desactivar el 2FA');
    }
    try {
      await axios.post('/api/2fa/disable', { password: disablePassword });
      toast.success('2FA Desactivado');
      setShowDisableConfirm(false);
      setDisablePassword('');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error desactivando 2FA');
    }
  };

  const fetchProfile = useCallback(async (signal = null) => {
    try {
      const { data } = await axios.get('/api/perfil', { ...(signal && { signal }) });
      if (signal && signal.aborted) return;
      setProfileData(data.user);
      setEditForm(data.user);
    } catch (error) {
      if (axios.isCancel(error) || (signal && signal.aborted)) return;
      toast.error('Error al cargar perfil');
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, [fetchProfile]);

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
    if (passData.newPassword.length < 8) {
      return toast.error('La nueva contraseña debe tener al menos 8 caracteres');
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
      } catch {
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

  if (loading) return <div className="p-20 text-center font-bold animate-pulse text-slate-300">CARGANDO PERFIL...</div>;

  return (
    <div className="animate-fade-in p-4 md:p-8 max-w-5xl mx-auto pb-20">
      <header className="mb-10 flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
          <h1 className="titular text-4xl text-tinta">Mi Perfil</h1>
          <p className="text-slate-400 font-bold text-xs mt-1">Administración de Cuenta y Seguridad</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-azul text-white px-6 py-3 rounded-lg text-xs font-bold shadow-lg active:scale-95 transition-transform"
          >
            Editar Información
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">Cancelar</button>
            <button onClick={handleSaveProfile} className="px-6 py-3 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg">Guardar Cambios</button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Izquierdo: Foto y Básico */}
        <div className="space-y-6">
          <div
            className={`bg-white p-8 rounded-2xl shadow-lg border-2 text-center transition-colors transition-transform ${isDragging ? 'border-azul bg-azul/10 border-dashed scale-105' : 'border-white'}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <button type="button" className="block relative group mx-auto w-32 h-32 mb-6 cursor-pointer" onClick={() => fileInputRef.current.click()} aria-label="Cambiar foto de perfil">
              <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFile(e.target.files[0])} accept="image/*" />
              {profileData.foto_url ? (
                <img src={profileData.foto_url} alt="Perfil" className="w-full h-full object-cover rounded-2xl shadow-lg border-4 border-white" />
              ) : (
                <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-slate-200 transition-colors">
                  <User size={56} className="text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-tinta/60 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <span className="text-xs font-bold">Cambiar</span>
              </div>
            </button>

            <h2 className="titular text-2xl text-tinta">{profileData.nombres}</h2>
            <p className="text-azul text-sm font-bold">@{profileData.usuario}</p>
            <p className="text-xs font-bold text-slate-400 mt-4">ID de Colaborador: #{profileData.id_usuario || '...'}</p>

            <div className="mt-8 flex justify-center gap-2">
              <span className="px-3 py-1 bg-tinta text-white text-xs font-bold rounded-full">{profileData.rol}</span>
              <span className="px-3 py-1 bg-azul/10 text-azul text-xs font-bold rounded-full uppercase tracking-wide border border-azul/30">Activo</span>
            </div>
          </div>

          <button
            onClick={() => setShowPassModal(true)}
            className="w-full p-6 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between group hover:bg-white hover:shadow-lg transition-colors transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm transition-transform"><Lock size={20} /></div>
              <div className="text-left">
                <p className="text-xs font-bold text-tinta">Contraseña</p>
                <p className="text-xs text-slate-400 font-bold">Actualizar Clave</p>
              </div>
            </div>
            <span className="text-slate-300">→</span>
          </button>

          {/* Botón 2FA */}
          {!user?.is2FAEnabled ? (
             <button
              onClick={handleGenerate2FA}
              className="w-full p-6 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between group hover:bg-white hover:shadow-lg transition-colors transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm transition-transform"><ShieldAlert size={20} className="text-rose-500" /></div>
                <div className="text-left">
                  <p className="text-xs font-bold text-rose-800">Seguridad 2FA</p>
                  <p className="text-xs text-rose-500 font-bold">No configurado - ¡Habilitar!</p>
                </div>
              </div>
              <span className="text-rose-300">→</span>
            </button>
          ) : (
            <button
              onClick={handleDisable2FA}
              className="w-full p-6 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between group hover:bg-white hover:shadow-lg transition-colors transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm transition-transform"><ShieldCheck size={20} className="text-emerald-500" /></div>
                <div className="text-left">
                  <p className="text-xs font-bold text-emerald-800">Seguridad 2FA</p>
                  <p className="text-xs text-exito font-bold">Protegido</p>
                </div>
              </div>
              {user?.rol !== 'Administrador' && <span className="text-emerald-300 text-xs font-bold hover:text-rose-500">Desactivar</span>}
            </button>
          )}
        </div>

        {/* Lado Derecho: Formulario Detallado */}
        <div className="lg:col-span-2 bg-white p-10 rounded-2xl shadow-lg border border-slate-50">
          <h3 className="font-bold text-xs text-slate-400 mb-10 border-b border-slate-50 pb-5">Datos Personales y de Contacto</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label htmlFor="edit-nombres" className="text-xs font-bold text-slate-300 block ml-1">Nombres Completos</label>
              {isEditing ? (
                <input
                  id="edit-nombres"
                  type="text"
                  value={editForm.nombres}
                  onChange={e => setEditForm({ ...editForm, nombres: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none"
                />
              ) : (
                <p className="text-base font-bold text-tinta-2 tracking-tight">{profileData.nombres || '---'}</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block ml-1">Nombre de Usuario</span>
              <p className="text-base font-bold text-tinta-2 tracking-tight bg-slate-50 p-4 rounded-2xl opacity-60">@{profileData.usuario}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-correo" className="text-xs font-bold text-slate-300 block ml-1">Correo Corporativo</label>
              {isEditing ? (
                <input
                  id="edit-correo"
                  type="email"
                  value={editForm.correo}
                  onChange={e => setEditForm({ ...editForm, correo: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none"
                />
              ) : (
                <p className="text-base font-bold text-tinta-2 tracking-tight">{profileData.correo || '---'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-celular" className="text-xs font-bold text-slate-300 block ml-1">Número Celular</label>
              {isEditing ? (
                <input
                  id="edit-celular"
                  type="text"
                  value={editForm.celular}
                  onChange={e => setEditForm({ ...editForm, celular: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none"
                />
              ) : (
                <p className="text-base font-bold text-tinta-2 tracking-tight">{profileData.celular || '---'}</p>
              )}
            </div>

            <div className="space-y-2 relative z-10">
              <span className="text-xs font-bold text-slate-300 block ml-1">Género</span>
              {isEditing ? (
                <div className="h-14">
                  <CustomSelect
                    value={editForm.genero}
                    onChange={v => setEditForm({ ...editForm, genero: v })}
                    className="h-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-azul text-tinta-2"
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
                <p className="text-base font-bold text-tinta-2 tracking-tight">{profileData.genero || '---'}</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block ml-1">Nivel de Acceso</span>
              <p className="text-base font-bold text-tinta-2 tracking-tight bg-slate-50 p-4 rounded-2xl opacity-60">{profileData.rol}</p>
            </div>
          </div>

          <div className="mt-12 p-8 bg-tinta rounded-2xl text-white flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-bold">Estado del Sistema</p>
              <p className="text-xs text-resaltador font-bold mt-1 flex items-center gap-1">✨ Asistente Inteligente: Conectado</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">Acceso {profileData.rol === 'Administrador' ? 'Total' : 'Autorizado'}</p>
              <p className="text-xs opacity-40 mt-1">Credencial Segura: {profileData.usuario?.slice(0, 4).toUpperCase()}-SP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambio de Contraseña */}
      {showPassModal && (
        <div className="fixed inset-0 bg-tinta/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleChangePassword} className="bg-white w-full max-w-md p-10 rounded-2xl shadow-lg animate-scale-in">
            <h2 className="titular text-2xl text-tinta mb-2">Seguridad</h2>
            <p className="text-xs text-azul font-bold mb-8">Actualización de Credenciales</p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="current-password" className="text-xs font-bold text-slate-600 ml-1">Contraseña Actual</label>
                <input
                  id="current-password"
                  type="password"
                  value={passData.currentPassword}
                  required
                  onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="new-password" className="text-xs font-bold text-slate-600 ml-1">Nueva Contraseña</label>
                <input
                  id="new-password"
                  type="password"
                  value={passData.newPassword}
                  required
                  onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="confirm-password" className="text-xs font-bold text-slate-600 ml-1">Confirmar Nueva</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passData.confirmPassword}
                  required
                  onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-10">
              <button
                type="button"
                onClick={() => setShowPassModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
              >Cerrar</button>
              <button
                type="submit"
                className="flex-1 py-4 bg-azul text-white rounded-lg text-xs font-bold shadow-lg"
              >Actualizar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Configuración 2FA */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-tinta/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleVerify2FA} className="bg-white w-full max-w-md p-10 rounded-2xl shadow-lg animate-scale-in text-center">
            <div className="w-16 h-16 bg-azul/10 text-azul rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} />
            </div>
            <h2 className="titular text-2xl text-tinta mb-2">Configurar 2FA</h2>
            <p className="text-xs text-slate-500 font-bold mb-6 leading-relaxed">
              1. Descarga Google Authenticator o Authy.<br/>
              2. Escanea este código QR con la aplicación.
            </p>

            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Código QR 2FA" className="mx-auto w-48 h-48 border-4 border-slate-100 rounded-2xl mb-6 shadow-sm" />
            ) : (
              <div className="w-48 h-48 bg-slate-100 animate-pulse mx-auto rounded-2xl mb-6"></div>
            )}

            <div className="space-y-1 mb-8 text-left">
              <label htmlFor="totp-token" className="text-xs font-bold text-slate-600 ml-1">3. Ingresa el código de 6 dígitos</label>
              <input
                id="totp-token"
                type="text"
                maxLength="6"
                value={totpToken}
                required
                placeholder="000000"
                onChange={e => setTotpToken(e.target.value.replace(/\D/g, ''))}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-2xl font-bold focus:border-azul outline-none"
              />
            </div>

            <div className="flex gap-2">
              {!user?.needs2FASetup && (
                <button
                  type="button"
                  onClick={() => { setShow2FAModal(false); setTotpToken(''); }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                >Cancelar</button>
              )}
              <button
                type="submit"
                className="flex-1 py-4 bg-azul hover:bg-azul-hondo text-white rounded-lg text-xs font-bold shadow-lg transition-colors"
              >Verificar y Activar</button>
            </div>
          </form>
        </div>
      )}
      {/* Modal Confirmación Desactivar 2FA */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-tinta/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={confirmDisable2FA} className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-lg animate-scale-in text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={32} />
            </div>
            <h2 className="titular text-xl text-tinta mb-2">¿Desactivar Seguridad?</h2>
            <p className="text-xs text-slate-500 font-bold mb-6">
              Al desactivar la autenticación de dos factores, tu cuenta será más vulnerable a accesos no autorizados. ¿Estás seguro?
            </p>
            <div className="space-y-1 mb-6 text-left">
              <label htmlFor="disable-password" className="text-xs font-bold text-slate-600 ml-1">Ingresa tu contraseña</label>
              <input
                id="disable-password"
                type="password"
                value={disablePassword}
                required
                onChange={e => setDisablePassword(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-rose-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowDisableConfirm(false); setDisablePassword(''); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-3 bg-rose-500 hover:bg-peligro text-white rounded-lg text-xs font-bold transition-colors shadow-lg">
                Sí, Desactivar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
