import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CreditCard, Banknote, Landmark, CheckCircle2 } from 'lucide-react';
import CustomSelect from './CustomSelect';

const PaymentModal = ({ isOpen, onClose, total, onConfirm, loading, user }) => {
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [cambio, setCambio] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);

  
  useEffect(() => {
    if (isOpen) {
      setMetodoPago('Efectivo');
      setEfectivoRecibido('');
      setCambio(0);
      setSelectedClient('');
      if (user?.rol === 'Administrador') {
        fetchClientes();
      }
    }
  }, [isOpen, user]);

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);

      const res = await axios.get('/api/clientes');
      setClientes(res.data.clientes || []);
    } catch (error) {
      console.error('Error cargando clientes', error);
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    if (metodoPago === 'Efectivo') {
      const recibido = parseFloat(efectivoRecibido) || 0;
      setCambio(recibido >= total ? recibido - total : 0);
    } else {
      setEfectivoRecibido('');
      setCambio(0);
    }
  }, [efectivoRecibido, total, metodoPago]);

  if (!isOpen) return null;

  const isFormValid = () => {
    if (metodoPago === 'Efectivo') {
      const recibido = parseFloat(efectivoRecibido) || 0;
      return recibido >= total;
    }
    if (metodoPago === 'Fiado') {
      return selectedClient !== '';
    }
    return true; // Para tarjetas o transferencias no hay validación de efectivo
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid()) {
      onConfirm({
        metodo_pago: metodoPago,
        efectivo_recibido: metodoPago === 'Efectivo' ? parseFloat(efectivoRecibido) : total,
        id_cliente: metodoPago === 'Fiado' ? selectedClient : null,
      });
    }
  };

  const metodos = [
    { id: 'Efectivo', icon: <Banknote size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    { id: 'Tarjeta', icon: <CreditCard size={24} />, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { id: 'Transferencia', icon: <Landmark size={24} />, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' }
  ];

  if (user?.rol === 'Administrador') {
    metodos.push({ id: 'Fiado', icon: <Banknote size={24} />, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-2xl text-slate-800 italic uppercase tracking-tighter">Completar Pago</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total a Cobrar</p>
            <p className="text-5xl font-black text-indigo-600 tracking-tighter">
              ${Number(total).toLocaleString('es-CO')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {metodos.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodoPago(m.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    metodoPago === m.id
                      ? `${m.border} ${m.bg} shadow-md scale-105`
                      : 'border-slate-100 bg-white hover:bg-slate-50 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`${m.color} mb-2`}>{m.icon}</div>
                  <span className="font-black text-xs uppercase tracking-wider text-slate-700">{m.id}</span>
                </button>
              ))}
            </div>

            {metodoPago === 'Efectivo' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Efectivo Recibido</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-600">$</span>
                    <input
                      type="number"
                      value={efectivoRecibido}
                      onChange={(e) => setEfectivoRecibido(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 text-3xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </div>

                {parseFloat(efectivoRecibido) > 0 && (
                  <div className={`p-4 rounded-2xl border ${parseFloat(efectivoRecibido) >= total ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-black text-xs uppercase tracking-widest ${parseFloat(efectivoRecibido) >= total ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {parseFloat(efectivoRecibido) >= total ? 'Cambio a devolver' : 'Falta dinero'}
                      </span>
                      <span className={`text-2xl font-black ${parseFloat(efectivoRecibido) >= total ? 'text-emerald-700' : 'text-rose-700'}`}>
                        ${Math.abs(parseFloat(efectivoRecibido) - total).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {metodoPago === 'Fiado' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Seleccionar Cliente</label>
                  {loadingClientes ? (
                    <div className="text-sm text-slate-500 font-medium animate-pulse">Cargando clientes...</div>
                  ) : (
                    <div className="h-12 border-2 border-slate-200 rounded-xl bg-slate-50 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
                      <CustomSelect
                        value={selectedClient}
                        onChange={(val) => setSelectedClient(val)}
                        placeholder="-- Selecciona un cliente --"
                        options={clientes.map(c => ({
                          value: String(c.id_cliente),
                          label: `${c.nombre} (Cupo: $${Number(c.limite_credito || 0).toLocaleString('es-CO')})`
                        }))}
                        className="px-4 text-slate-700 font-bold h-full"
                      />
                    </div>
                  )}
                  {clientes.length === 0 && !loadingClientes && (
                    <p className="mt-2 text-xs font-bold text-rose-500">No hay clientes registrados en cartera.</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full h-16 flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-lg tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  Confirmar y Facturar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
