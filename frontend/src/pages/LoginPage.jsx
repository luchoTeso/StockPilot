import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const LoginPage = () => {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(identificador, password, rol);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-outfit p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)' }}>
      {/* Orbes decorativos */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>

      <div className="w-full max-w-[440px] animate-fade-in relative z-10">
        <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-slate-200 hover:scale-105 transition-transform cursor-default">🏪</div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">StockPilot</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 font-outfit">Gestión Inteligente de Inventario</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-8 text-[10px] font-black uppercase tracking-widest text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usuario o Correo</label>
              <input type="text" value={identificador} onChange={e => setIdentificador(e.target.value)} required placeholder="tu@correo.com o usuario" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-600 outline-none transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-600 outline-none transition-all" />
            </div>

            <div className="space-y-1 relative z-50">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nivel de Acceso</label>
              <div className="h-14">
                <CustomSelect 
                  value={rol} 
                  onChange={v => setRol(v)} 
                  className="h-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus-within:border-indigo-600 text-slate-800"
                  options={[
                    { value: 'Administrador', label: 'Administrador (Dueño)' },
                    { value: 'Tendedero', label: 'Colaborador (Equipo)' }
                  ]}
                  placeholder="Seleccione..."
                />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 mt-4 active:scale-95 transition-all">
              Ingresar a mi Negocio
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-8 space-y-3">
             <button onClick={() => navigate('/forgot-password')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">¿Olvidó su clave?</button>
             <br />
             <button onClick={() => navigate('/')} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-400 transition-colors">← Volver al Inicio</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
