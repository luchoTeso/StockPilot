import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import { Store, Eye, EyeOff, ArrowLeft, User, Phone, Mail, Lock, Building2, MapPin } from 'lucide-react';

const InputField = ({ label, id, required, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
      {Icon && <Icon size={10} />}
      {label} {required && <span className="text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

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
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.contrasena !== formData.confirmarContrasena) {
      return toast.error('Las contraseñas no coinciden');
    }
    if (formData.contrasena.length < 8) {
      return toast.error('La contraseña debe tener al menos 8 caracteres');
    }

    setIsLoading(true);
    try {
      await axios.post('/api/registro', {
        name: formData.nombres,
        username: formData.usuario,
        email: formData.correo,
        phone: formData.celular,
        password: formData.contrasena,
        store_name: formData.store_name,
        store_address: formData.store_address,
        gender: 'No especificado',
        id: formData.celular
      });

      toast.success('¡Tienda y Cuenta creadas exitosamente! Bienvenido.');
      await login(formData.usuario, formData.contrasena, 'Administrador');
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al conectar con el servidor para registro';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // InputField moved to top level

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-colors transition-shadow text-slate-800 placeholder:text-slate-300 placeholder:font-normal";

  return (
    <div
      className="min-h-screen flex items-center justify-center font-outfit p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)' }}
    >
      {/* Orbes decorativos */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>

      <div className="w-full max-w-[500px] animate-fade-in relative z-10 my-10">
        <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-200 relative overflow-hidden">

          {/* Barra de acento superior */}
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

          {/* Botón volver */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-50"
            title="Volver al Inicio"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-10 mt-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-200 hover:scale-105 transition-transform cursor-default">
              <Store size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">
              Crear Cuenta
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
              Configura la cuenta de tu Negocio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <InputField label="Nombre Completo" id="nombres" required icon={User}>
              <input
                id="nombres"
                aria-label="Nombre Completo"
                type="text"
                value={formData.nombres}
                onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                required
                placeholder="Ej. Juan Pérez"
                className={inputClass}
              />
            </InputField>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Usuario" id="usuario" required>
                <input
                  id="usuario"
                  aria-label="Usuario"
                  type="text"
                  value={formData.usuario}
                  onChange={e => setFormData({ ...formData, usuario: e.target.value.toLowerCase() })}
                  required
                  placeholder="juanp"
                  className={inputClass}
                />
              </InputField>
              <InputField label="Celular" id="celular" required icon={Phone}>
                <input
                  id="celular"
                  aria-label="Celular"
                  type="text"
                  value={formData.celular}
                  onChange={e => setFormData({ ...formData, celular: e.target.value })}
                  required
                  placeholder="3001234567"
                  className={inputClass}
                />
              </InputField>
            </div>

            <InputField label="Correo Electrónico" id="correo" required icon={Mail}>
              <input
                id="correo"
                aria-label="Correo Electrónico"
                type="email"
                value={formData.correo}
                onChange={e => setFormData({ ...formData, correo: e.target.value })}
                required
                placeholder="juan@empresa.com"
                className={inputClass}
              />
            </InputField>

            {/* Sección negocio */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Building2 size={11} />
                Datos del Negocio
              </p>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Nombre de Tienda" id="store_name" required>
                    <input
                      id="store_name"
                      aria-label="Nombre de Tienda"
                      type="text"
                      value={formData.store_name}
                      onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                      required
                      placeholder="Ej. MiniMarket Central"
                      className={inputClass}
                    />
                  </InputField>
                  <InputField label="Dirección (Opcional)" id="store_address" icon={MapPin}>
                    <input
                      id="store_address"
                      aria-label="Dirección (Opcional)"
                      type="text"
                      value={formData.store_address}
                      onChange={e => setFormData({ ...formData, store_address: e.target.value })}
                      placeholder="Calle 123..."
                      className={inputClass}
                    />
                  </InputField>
                </div>
              </div>
            </div>

            <InputField label="Contraseña" id="contrasena" required icon={Lock}>
              <div className="relative">
                <input
                  id="contrasena"
                  aria-label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.contrasena}
                  onChange={e => setFormData({ ...formData, contrasena: e.target.value })}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </InputField>

            <InputField label="Confirmar Contraseña" id="confirmarContrasena" required icon={Lock}>
              <input
                id="confirmarContrasena"
                aria-label="Confirmar Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmarContrasena}
                onChange={e => setFormData({ ...formData, confirmarContrasena: e.target.value })}
                required
                minLength={8}
                placeholder="••••••••"
                className={inputClass}
              />
            </InputField>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 mt-6 active:scale-95 transition-colors transition-shadow transition-transform disabled:opacity-50"
            >
              {isLoading ? 'Registrando y encriptando...' : 'Crear mi Negocio'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ¿Ya abriste tu negocio?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 font-black hover:underline decoration-2 underline-offset-4 ml-1"
              >
                Inicia Sesión
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
