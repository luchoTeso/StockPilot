import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store } from 'lucide-react';

const LoginPage = () => {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionConflict, setSessionConflict] = useState(false);
  
  // Estado 2FA
  const [is2FA, setIs2FA] = useState(false);
  const [token2FA, setToken2FA] = useState('');
  
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isConcurrent = new URLSearchParams(location.search).get('reason') === 'concurrent';

  const handleSubmit = async (e, force = false) => {
    e.preventDefault();
    setError('');
    setSessionConflict(false);
    if (is2FA) {
      try {
        const res = await verify2FA(token2FA);
        if (res?.user?.cambioClaveForzoso) {
          navigate('/activacion-cuenta');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err.message || 'Código incorrecto');
      }
      return;
    }

    try {
      const result = await login(identificador, password, force);
      if (result?.require2FA) {
        setIs2FA(true);
      } else if (result?.user?.cambioClaveForzoso) {
        navigate('/activacion-cuenta');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.code === 'SESSION_ACTIVE') {
        setSessionConflict(true);
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    }
  };

  return (
    <div data-surface="dark" className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-tinta">
      <div className="w-full max-w-[440px] animate-fade-in relative z-10">
        <div className="bg-white p-10 md:p-12 rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-azul"></div>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-azul text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform cursor-default"><Store size={36} /></div>
            <h1 className="titular text-4xl text-tinta">StockPilot</h1>
            <p className="text-slate-400 font-bold text-xs mt-2">Gestión Inteligente de Inventario</p>
          </div>

          {isConcurrent && !error && !sessionConflict && (
            <div className="bg-aviso-suave border border-aviso/20 text-aviso p-4 rounded-2xl mb-8 text-xs font-bold text-center animate-pulse">
              Sesión cerrada: Se ha iniciado sesión en otro dispositivo.
            </div>
          )}

          {sessionConflict && (
            <div className="bg-aviso-suave border border-aviso/30 p-5 rounded-2xl mb-6 text-center space-y-3">
              <p className="text-aviso text-xs font-bold">Ya hay una sesión activa para este usuario</p>
              <p className="text-aviso text-xs font-bold">Alguien ya inició sesión en otro dispositivo. ¿Deseas cerrar esa sesión y entrar aquí?</p>
              <button
                onClick={(e) => handleSubmit(e, true)}
                className="w-full py-3 bg-aviso hover:bg-aviso/90 text-white rounded-lg text-xs font-bold transition-colors active:scale-95"
              >
                Cerrar otra sesión e ingresar aquí
              </button>
            </div>
          )}

          {error && (
            <div className="bg-peligro-suave border border-peligro/20 text-peligro p-4 rounded-2xl mb-8 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {is2FA ? (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-slate-600 mb-2">Autenticación de Dos Factores requerida</p>
                <p className="text-xs text-slate-400">Abre tu aplicación de autenticación (Google Authenticator, Authy) e ingresa el código de 6 dígitos.</p>
              </div>
              <div className="space-y-1">
                <label htmlFor="token2FA" className="text-xs font-semibold text-slate-600 ml-1">Código de 6 Dígitos</label>
                <input id="token2FA" type="text" maxLength="6" value={token2FA} onChange={e => setToken2FA(e.target.value.replace(/\D/g, ''))} required placeholder="000000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-2xl font-bold focus:border-azul outline-none transition-colors" />
              </div>
              <button type="submit" className="w-full py-5 bg-azul hover:bg-azul-hondo text-white rounded-lg text-xs font-bold mt-4 active:scale-95 transition-transform transition-colors">
                Verificar Código
              </button>
              <button type="button" onClick={() => {setIs2FA(false); setToken2FA(''); setError('');}} className="w-full mt-2 py-3 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors">
                Volver
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label htmlFor="identificador" className="text-xs font-semibold text-slate-600 ml-1">Usuario o Correo</label>
                <input id="identificador" type="text" value={identificador} onChange={e => setIdentificador(e.target.value)} required placeholder="tu@correo.com o usuario" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none transition-colors" />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-semibold text-slate-600 ml-1">Contraseña</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none transition-colors" />
              </div>

              <button type="submit" className="w-full py-5 bg-azul hover:bg-azul-hondo text-white rounded-lg text-xs font-bold mt-4 active:scale-95 transition-transform transition-colors">
                Ingresar a mi Negocio
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-100 pt-8 space-y-3">
             <button onClick={() => navigate('/forgot-password')} className="text-xs font-bold text-azul hover:underline decoration-2 underline-offset-4">¿Olvidó su clave?</button>
             <br />
             <button onClick={() => navigate('/')} className="text-xs font-bold text-slate-400 hover:text-azul transition-colors">← Volver al Inicio</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
