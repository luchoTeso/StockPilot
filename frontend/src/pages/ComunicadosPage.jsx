import { useState } from 'react';
import axios from 'axios';
import { Megaphone, Send, AlertTriangle, Info, BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ComunicadosPage = () => {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [prioridad, setPrioridad] = useState('normal'); // 'normal', 'urgente'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !mensaje) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data } = await axios.post('/api/notificaciones/broadcast', {
        titulo,
        mensaje,
        prioridad
      });

      if (data.success) {
        setSuccessMsg(`Comunicado enviado exitosamente a ${data.recipients} tenderos.`);
        setTitulo('');
        setMensaje('');
        setPrioridad('normal');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Error enviando el comunicado.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.rol !== 'Administrador') {
    return <div className="p-6 text-center text-rose-500">Acceso denegado. Solo administradores.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-azul/10 rounded-2xl text-azul shadow-inner">
          <Megaphone size={28} />
        </div>
        <div>
          <h1 className="titular text-3xl text-tinta">Comunicados Globales</h1>
          <p className="text-slate-500 font-medium">Envía notificaciones a todos los tenderos de tu tienda.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-lg shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-peligro flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 flex items-center gap-2 font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-tinta-2 mb-2">Título del Comunicado</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Horario de mañana modificado"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-tinta font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-azul/50 focus:border-azul transition-all shadow-inner"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-tinta-2 mb-2">Mensaje</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe el mensaje detallado aquí..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-tinta font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-azul/50 focus:border-azul transition-all min-h-[150px] resize-y shadow-inner"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-tinta-2 mb-3">Prioridad</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`
                flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${prioridad === 'normal' 
                  ? 'bg-azul/10 border-azul text-azul shadow-md' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}
              `}>
                <input
                  type="radio"
                  name="prioridad"
                  value="normal"
                  checked={prioridad === 'normal'}
                  onChange={(e) => setPrioridad(e.target.value)}
                  className="hidden"
                />
                <div className={`p-2 rounded-lg ${prioridad === 'normal' ? 'bg-azul/20 text-azul' : 'bg-slate-100 text-slate-500'}`}>
                  <Info size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Normal</span>
                  <span className="text-xs font-medium opacity-80">Notificación estándar</span>
                </div>
              </label>

              <label className={`
                flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all
                ${prioridad === 'urgente' 
                  ? 'bg-amber-50 border-ambar text-aviso shadow-md' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}
              `}>
                <input
                  type="radio"
                  name="prioridad"
                  value="urgente"
                  checked={prioridad === 'urgente'}
                  onChange={(e) => setPrioridad(e.target.value)}
                  className="hidden"
                />
                <div className={`p-2 rounded-lg ${prioridad === 'urgente' ? 'bg-amber-200 text-aviso' : 'bg-slate-100 text-slate-500'}`}>
                  <BellRing size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Urgente</span>
                  <span className="text-xs font-medium opacity-80">Animación y alerta sonora</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-6 flex justify-end border-t border-slate-100 mt-6">
            <button
              type="submit"
              disabled={loading || !titulo || !mensaje}
              className="flex items-center gap-2 px-8 py-3 bg-azul hover:bg-azul-hondo disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-lg font-bold transition-all shadow-lg active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enviar a Todos</span>
                  <Send size={18} />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ComunicadosPage;
