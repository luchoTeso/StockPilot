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
    // Solo al abrir el modal: fetchSession se recrea en cada render y onStatusChange viene del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tinta/45 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden border border-slate-100 relative">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="titular text-2xl text-tinta">
            {session ? 'Cerrar Caja (Arqueo)' : 'Abrir Caja'}
          </h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azul"></div>
            </div>
          ) : session ? (
            <form onSubmit={handleCloseRegister} className="space-y-6">
              <div className="text-center mb-6">
                <Lock size={48} className="mx-auto text-rose-500 mb-4" />
                <p className="text-slate-500 font-bold">Sesión Abierta desde:</p>
                <p className="font-bold text-tinta">{new Date(session.fecha_apertura).toLocaleString('es-CO')}</p>
                <p className="text-slate-500 text-sm mt-2">Fondo inicial: <span className="font-bold text-tinta-2">${Number(session.monto_apertura).toLocaleString('es-CO')}</span></p>
                <div className="bg-rose-50 border border-peligro-suave p-3 rounded-2xl mt-3 text-xs text-peligro font-bold">
                   <p>💡 Nota: Los egresos registrados durante el turno se restarán automáticamente del monto esperado.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Efectivo Total en Cajón</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    value={montoCierre}
                    onChange={(e) => setMontoCierre(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-tinta bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-bold">Cuenta el dinero y escribe el total real.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 bg-peligro hover:bg-rose-500 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
              >
                <Calculator size={20} /> Realizar Arqueo
              </button>
            </form>
          ) : (
            <form onSubmit={handleOpenRegister} className="space-y-6">
              <div className="text-center mb-6">
                <Unlock size={48} className="mx-auto text-emerald-500 mb-4" />
                <p className="text-slate-500 font-bold">No tienes ninguna caja abierta.</p>
                <p className="text-sm text-slate-500">Debes indicar con cuánto dinero base (sencillo/cambio) inicias tu turno.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Base de Caja Inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-tinta bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 bg-exito hover:bg-emerald-500 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
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
