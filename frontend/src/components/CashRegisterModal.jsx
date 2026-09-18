import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { X, Lock, Unlock, Landmark, Calculator } from 'lucide-react';

const CashRegisterModal = ({ isOpen, onClose, onStatusChange }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const toast = useToast();

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/caja/sesion');
      if (res.data.active) {
        setSession(res.data.session);
        if (onStatusChange) onStatusChange(true);
      } else {
        setSession(null);
        if (onStatusChange) onStatusChange(false);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSession();
      setMontoApertura('');
      setMontoCierre('');
    }
  }, [isOpen]);

  const handleOpenRegister = async (e) => {
    e.preventDefault();
    if (montoApertura === '' || isNaN(parseFloat(montoApertura)) || parseFloat(montoApertura) < 0) {
      toast.error('Ingresa un monto válido de apertura (puede ser 0 o superior).');
      return;
    }
    try {
      setLoading(true);
      await axios.post('/api/caja/abrir', { monto_apertura: parseFloat(montoApertura) });
      toast.success('¡Caja abierta exitosamente! Listo para realizar ventas.');
      if (onStatusChange) onStatusChange(true);
      setMontoApertura('');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al abrir caja.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegister = async (e) => {
    e.preventDefault();
    if (montoCierre === '') {
      toast.error('Ingresa el monto contado (cierre) en tu cajón.');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('/api/caja/cerrar', { monto_cierre_declarado: parseFloat(montoCierre) });
      const arqueo = res.data.arqueo;
      if (arqueo.diferencia === 0) {
        toast.success('Caja cerrada cuadradamente.');
      } else if (arqueo.diferencia > 0) {
        toast.success(`Caja cerrada con un sobrante de $${arqueo.diferencia.toLocaleString('es-CO')}`);
      } else {
        toast.error(`Caja cerrada con un faltante de $${Math.abs(arqueo.diferencia).toLocaleString('es-CO')}`);
      }
      setSession(null);
      if (onStatusChange) onStatusChange(false);
      onClose(); // Cerrar modal después de arqueo exitoso
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cerrar caja.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 relative">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-2xl text-slate-800 italic uppercase tracking-tighter">
            {session ? 'Cerrar Caja (Arqueo)' : 'Abrir Caja'}
          </h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : session ? (
            <form onSubmit={handleCloseRegister} className="space-y-6">
              <div className="text-center mb-6">
                <Lock size={48} className="mx-auto text-rose-500 mb-4" />
                <p className="text-slate-500 font-bold">Sesión Abierta desde:</p>
                <p className="font-black text-slate-800">{new Date(session.fecha_apertura).toLocaleString('es-CO')}</p>
                <p className="text-slate-500 text-sm mt-2">Fondo inicial: <span className="font-bold text-slate-700">${Number(session.monto_apertura).toLocaleString('es-CO')}</span></p>
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mt-3 text-[11px] text-rose-600 font-bold">
                   <p>💡 Nota: Los egresos registrados durante el turno se restarán automáticamente del monto esperado.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Efectivo Total en Cajón</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">$</span>
                  <input
                    type="number"
                    value={montoCierre}
                    onChange={(e) => setMontoCierre(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-3xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Cuenta el dinero y escribe el total real.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg tracking-wider uppercase transition-all shadow-lg shadow-rose-500/30"
              >
                <Calculator size={20} /> Realizar Arqueo
              </button>
            </form>
          ) : (
            <form onSubmit={handleOpenRegister} className="space-y-6">
              <div className="text-center mb-6">
                <Unlock size={48} className="mx-auto text-emerald-500 mb-4" />
                <p className="text-slate-500 font-bold">No tienes ninguna caja abierta.</p>
                <p className="text-sm text-slate-400">Debes indicar con cuánto dinero base (sencillo/cambio) inicias tu turno.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Base de Caja Inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">$</span>
                  <input
                    type="number"
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-3xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/30"
              >
                <Landmark size={20} /> Abrir Turno
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashRegisterModal;
