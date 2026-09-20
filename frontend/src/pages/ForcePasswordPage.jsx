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
    <div data-surface="dark" className="min-h-screen flex items-center justify-center font-outfit p-6 relative overflow-hidden bg-tinta">
      <div className="w-full max-w-[440px] animate-fade-in relative z-10">
        <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-200 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-azul"></div>
          
          <div className="w-20 h-20 bg-azul text-white rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl animate-bounce-slow cursor-default">
              <Hand size={36} />
          </div>

          <h1 className="text-4xl font-black text-tinta tracking-tighter italic uppercase mb-2">¡Bienvenido!</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-8">Por seguridad, ingresa una nueva contraseña secreta para acceder.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            <div className="space-y-1">
              <label htmlFor="new-password" className="text-xs font-semibold text-slate-600 ml-1 block">Nueva Contraseña Secreta</label>
              <div className="relative">
                <input
                  id="new-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Escribe al menos 6 caracteres"
                  className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-azul outline-none transition-colors"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-600 ml-1 block">Repite tu Contraseña</label>
              <input
                id="confirm-password"
                required
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Vuelve a escribirla igual"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-azul outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-azul hover:bg-azul-hondo text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg mt-4 active:scale-95 disabled:opacity-50 transition-transform transition-colors"
            >
              {isSubmitting ? 'VERIFICANDO...' : 'EMPEZAR A TRABAJAR'}
            </button>
            
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-8">
            <button onClick={logout} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-azul transition-colors">
              Cerrar Sesión por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordPage;
