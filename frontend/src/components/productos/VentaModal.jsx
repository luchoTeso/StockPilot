import { useState, useEffect, useMemo } from 'react';
import { DollarSign } from 'lucide-react';

const VentaModal = ({
  isOpen,
  onClose,
  onSubmit,
  producto,
  loading
}) => {
  const [cantidadVender, setCantidadVender] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCantidadVender('');
    }
  }, [isOpen]);

  // Cálculo a prueba de fallos para la venta total
  const ventaTotalCalculado = useMemo(() => {
    if (!producto) return 0;
    
    const qty = parseInt(cantidadVender, 10);
    const qtyValid = isNaN(qty) ? 0 : qty;
    
    let rawPrice = 0;
    if (producto.precio !== undefined && producto.precio !== null) {
      rawPrice = producto.precio;
    } else if (producto.precio_unitario !== undefined && producto.precio_unitario !== null) {
      rawPrice = producto.precio_unitario;
    }
    
    const prc = parseFloat(rawPrice);
    const prcValid = isNaN(prc) ? 0 : prc;
    
    return qtyValid * prcValid;
  }, [cantidadVender, producto]);

  if (!isOpen || !producto) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(cantidadVender);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6 bg-indigo-600 text-white">
          <h3 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2"><DollarSign size={22} /> Venta Exprés</h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Caja Rápida</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Producto a vender</p>
            <p className="font-black text-slate-800 uppercase line-clamp-1">{producto.nombre_producto}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Cantidad disponible</p>
              <p className="text-xl font-black text-emerald-800">{producto.cantidad} <span className="text-xs opacity-60">u</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Unitario</p>
              <p className="text-xl font-black text-slate-800">${parseFloat(producto.precio ?? producto.precio_unitario ?? 0).toLocaleString('es-CO')}</p>
            </div>
          </div>

          <div className="mb-8">
            <label htmlFor="input_cantidad_vender" className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 text-center">Cantidad a Vender</label>
            <input id="input_cantidad_vender" required type="number" min="1" max={producto.cantidad} value={cantidadVender} onChange={e => setCantidadVender(e.target.value)} className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl text-2xl font-black text-center text-indigo-600 focus:border-indigo-500 outline-none transition-colors shadow-inner" placeholder="1" autoFocus />
          </div>

          <div className="mb-6 p-5 bg-slate-900 rounded-3xl flex justify-between items-center text-white shadow-xl">
            <div>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block">Total a cobrar</span>
               <span className="text-xs font-bold opacity-40 uppercase">(Impuestos incluidos)</span>
            </div>
            <span className="text-3xl font-black italic text-emerald-400">
               ${ventaTotalCalculado.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="flex gap-4 mt-8">
            <button type="button" onClick={onClose} className="py-4 px-6 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Anular</button>
            <button type="submit" disabled={loading || !cantidadVender} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors transition-transform active:scale-95 disabled:opacity-50">
              {loading ? 'Registrando...' : 'Completar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VentaModal;
