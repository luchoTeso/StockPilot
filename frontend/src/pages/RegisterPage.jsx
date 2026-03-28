import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombres: '',
    usuario: '',
    correo: '',
    celular: '',
    contrasena: '',
    confirmarContrasena: '',
    store_name: '',
    store_address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth(); // Asumiendo que queremos loguearlo tras registro exitoso

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.contrasena !== formData.confirmarContrasena) {
      return toast.error('Las contraseñas no coinciden');
    }
    if (formData.contrasena.length < 6) {
      return toast.error('La contraseña debe tener al menos 6 caracteres');
    }

    setIsLoading(true);
    try {
      // Usando el endpoint real del backend con prefijo /api
      await axios.post('/api/registro', {
        name: formData.nombres,
        username: formData.usuario,
        email: formData.correo,
        phone: formData.celular,
        password: formData.contrasena,
        store_name: formData.store_name,
        store_address: formData.store_address,
        gender: 'No especificado', // Opcional en este flujo rápido
        id: formData.celular // Fallback para ID requerido en BD vieja
      });
      
      toast.success('¡Tienda y Cuenta creadas exitosamente! Bienvenido.');
      // Auto-login después de registro
      await login(formData.usuario, formData.contrasena, 'Administrador');
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al conectar con el servidor para registro';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black font-outfit p-6 relative overflow-hidden">
      
      {/* Fondo Decorativo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[500px] animate-fade-in relative z-10 my-10">
        <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-200 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500"></div>
          
          <button 
            onClick={() => navigate('/')}
            className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-50"
            title="Volver al Inicio"
          >
            &larr;
          </button>

          <div className="text-center mb-10 mt-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner border border-emerald-100">
               🏢
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">
              Crear Cuenta
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
              Configura la cuenta de tu Negocio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo <span className="text-rose-400">*</span></label>
              <input 
                type="text" 
                value={formData.nombres} 
                onChange={e => setFormData({...formData, nombres: e.target.value})} 
                required 
                placeholder="Ej. Juan Pérez" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usuario <span className="text-rose-400">*</span></label>
                <input 
                  type="text" 
                  value={formData.usuario} 
                  onChange={e => setFormData({...formData, usuario: e.target.value.toLowerCase()})} 
                  required 
                  placeholder="juanp" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Celular <span className="text-rose-400">*</span></label>
                <input 
                  type="text" 
                  value={formData.celular} 
                  onChange={e => setFormData({...formData, celular: e.target.value})} 
                  required 
                  placeholder="3001234567" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico <span className="text-rose-400">*</span></label>
              <input 
                type="email" 
                value={formData.correo} 
                onChange={e => setFormData({...formData, correo: e.target.value})} 
                required 
                placeholder="juan@empresa.com" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest ml-1 mt-4 block border-t border-slate-100 pt-4">Datos del Negocio</label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre de Tienda <span className="text-rose-400">*</span></label>
                <input 
                  type="text" 
                  value={formData.store_name} 
                  onChange={e => setFormData({...formData, store_name: e.target.value})} 
                  required 
                  placeholder="Ej. MiniMarket Central" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.store_address} 
                  onChange={e => setFormData({...formData, store_address: e.target.value})} 
                  placeholder="Calle 123..." 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña <span className="text-rose-400">*</span></label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.contrasena} 
                  onChange={e => setFormData({...formData, contrasena: e.target.value})} 
                  required 
                  minLength={6}
                  placeholder="••••••••" 
                  className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl opacity-50 hover:opacity-100 transition-opacity">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Contraseña <span className="text-rose-400">*</span></label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={formData.confirmarContrasena} 
                onChange={e => setFormData({...formData, confirmarContrasena: e.target.value})} 
                required 
                minLength={6}
                placeholder="••••••••" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-slate-800" 
              />
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200/50 mt-6 active:scale-95 transition-all disabled:opacity-50">
              {isLoading ? 'Registrando y encriptando...' : 'Crear mi Negocio'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-8">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               ¿Ya abriste tu negocio? <button onClick={() => navigate('/login')} className="text-indigo-600 font-black hover:underline decoration-2 underline-offset-4 ml-1">Inicia Sesión</button>
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
