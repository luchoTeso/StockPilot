import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';
import { Hand, Eye, EyeOff } from 'lucide-react';

const ForcePasswordPage = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || !user.cambioClaveForzoso) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Las contraseñas no coinciden, verifícalas por favor.');
    }
    if (formData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axios.put('/api/perfil/first-password', {
        newPassword: formData.newPassword
      });
      
      toast.success(data.message || 'Contraseña configurada exitosamente. Bienvenido.');
      
      // Forzar recarga de sesión desde el servidor (esto actualizará el context y nos llevará al dashboard)
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
      
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar las credenciales');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-outfit relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 md:p-12 rounded-[3.5rem] shadow-2xl w-full max-w-lg z-10 animate-fade-in relative text-center">
        
        <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto shadow-inner border border-white/10 backdrop-blur-md animate-bounce-slow">
            <Hand size={40} />
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase mb-2">¡Bienvenido!</h1>
        <p className="text-indigo-200 text-sm font-bold tracking-wide mb-8">Por seguridad de la tienda, ingresa una nueva contraseña secreta para acceder.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] ml-2 block">Nueva Contraseña Secreta</label>
            <div className="relative">
              <input
                id="new-password"
                required
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Escribe al menos 6 caracteres"
                className="w-full p-4 pr-12 bg-white/5 border border-white/20 rounded-2xl text-white font-bold placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 transition-colors outline-none"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] ml-2 block">Repite tu Contraseña</label>
            <input
              id="confirm-password"
              required
              type={showPassword ? 'text' : 'password'}
              minLength={6}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Vuelve a escribirla igual"
              className="w-full p-4 bg-white/5 border border-white/20 rounded-2xl text-white font-bold placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/10 transition-colors outline-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white p-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:opacity-50 transition-colors transition-transform hover:scale-[1.02] active:scale-[0.98] drop-shadow-lg"
            >
              {isSubmitting ? 'VERIFICANDO...' : 'EMPEZAR A TRABAJAR'}
            </button>
          </div>
          
        </form>

        <button onClick={logout} className="mt-8 text-white/40 hover:text-white/80 text-[10px] uppercase tracking-widest font-black transition-colors">
          Cerrar Sesión por ahora
        </button>
      </div>
    </div>
  );
};

export default ForcePasswordPage;
