import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import CustomSelect from '../components/CustomSelect';
import axios from 'axios';
import { Mail, KeyRound, Sparkles } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Correo, 2: Código, 3: Nueva Clave
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, ingrese su correo");
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await axios.post('/api/forgot-password', { email });
      setStep(2);
      toast.success(data.message || "Código de seguridad enviado");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al solicitar el código");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      toast.error("Complete el código de 6 dígitos");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post('/api/verify-reset-code', { email, code: fullCode });
      setStep(3);
      toast.success("Identidad verificada exitosamente");
    } catch (err) {
      toast.error(err.response?.data?.error || "Código inválido o expirado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post('/api/reset-password', { email, code: code.join(''), newPassword: password });
      toast.success("Contraseña actualizada correctamente");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al restablecer la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // solo 1 dígito
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus al siguiente
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-papel">

      <div className="w-full max-w-[440px] animate-fade-in relative z-10">
        <div className="bg-white p-10 md:p-12 rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-azul"></div>
          
          <button 
            onClick={() => navigate('/login')}
            className="absolute top-8 left-8 text-slate-500 hover:text-azul transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-50"
          >
            &larr;
          </button>

          <div className="text-center mb-10 mt-6">
            <div className="w-20 h-20 bg-azul/10 text-azul rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-azul/30">
               {step === 1 ? <Mail size={36} /> : step === 2 ? <KeyRound size={36} /> : <Sparkles size={36} />}
            </div>
            <h1 className="titular text-3xl text-tinta">
              {step === 1 ? 'Recuperación' : step === 2 ? 'Verificación' : 'Nueva Clave'}
            </h1>
            <p className="text-slate-500 font-bold text-xs mt-2">
              {step === 1 ? 'Envío de código de seguridad' : step === 2 ? 'Ingrese el código recibido' : 'Establezca sus credenciales'}
            </p>
          </div>

          {/* PASO 1: Ingreso de Correo */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-6 animate-scale-in origin-bottom">

              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold text-slate-600 ml-1">Correo Electrónico</label>
                <input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="ejemplo@stockpilot.com" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none transition-colors text-tinta" 
                />
              </div>

              <button type="submit" disabled={isLoading} className="w-full py-5 bg-azul hover:bg-azul-hondo text-white rounded-lg text-xs font-bold shadow-lg mt-4 active:scale-95 transition-colors transition-shadow transition-transform disabled:opacity-50">
                {isLoading ? 'Procesando...' : 'Recuperar mi Cuenta'}
              </button>
            </form>
          )}

          {/* PASO 2: Verificación de Código */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6 animate-scale-in origin-bottom">
              <div className="text-center mb-6">
                <p className="text-sm font-medium text-slate-500">
                  Hemos enviado un código de 6 dígitos a:
                  <br/>
                  <strong className="text-tinta block mt-1">{email}</strong>
                </p>
              </div>

              <div className="flex justify-between gap-2">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`code-${idx}`}
                    aria-label={`Dígito ${idx + 1}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-lg text-xl text-center font-bold text-azul focus:border-azul focus:bg-azul/10 outline-none transition-colors"
                  />
                ))}
              </div>

              <button type="submit" disabled={isLoading} className="w-full py-5 bg-azul text-white rounded-lg text-xs font-bold shadow-lg mt-8 active:scale-95 transition-colors transition-transform disabled:opacity-50">
                {isLoading ? 'Validando Token...' : 'Confirmar Identidad'}
              </button>
            </form>
          )}

          {/* PASO 3: Nueva Contraseña */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-scale-in origin-bottom">
              <div className="space-y-1">
                <label htmlFor="new-password" className="text-xs font-semibold text-slate-600 ml-1">Nueva Contraseña</label>
                <input 
                  id="new-password"
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  minLength={6}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none transition-colors text-tinta" 
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-600 ml-1">Confirmar Contraseña</label>
                <input 
                  id="confirm-password"
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  minLength={6}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-azul outline-none transition-colors text-tinta" 
                />
              </div>

              <button type="submit" disabled={isLoading} className="w-full py-5 bg-azul hover:bg-azul-hondo text-white rounded-lg text-xs font-bold shadow-lg mt-4 active:scale-95 transition-colors transition-transform disabled:opacity-50">
                {isLoading ? 'Asegurando credenciales...' : 'Restaurar mi Acceso'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
