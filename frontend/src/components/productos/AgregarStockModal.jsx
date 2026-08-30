import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

const AgregarStockModal = ({
  isOpen,
  onClose,
  onSubmit,
  producto,
  loading
}) => {
  const [cantidadStock, setCantidadStock] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCantidadStock('');
    }
  }, [isOpen]);

  if (!isOpen || !producto) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(cantidadStock);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-8 bg-emerald-500 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"><Package size={32} /></div>
          <h3 className="text-2xl font-black tracking-tighter uppercase italic">Agregar Inventario</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <p className="text-center font-bold text-slate-500 text-sm mb-6 uppercase tracking-widest">
            Producto: <span className="text-slate-800 font-black">{producto.nombre_producto}</span>
          </p>
          
          <div className="mb-6 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad en bodega</span>
             <span className="text-xl font-black text-slate-800">{producto.cantidad} <span className="text-xs opacity-50 uppercase tracking-widest">ud</span></span>
          </div>

          <div className="mb-8">
            <label htmlFor="input_cantidad_ingresar" className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 text-center">Cantidad a Ingresar</label>
            <input id="input_cantidad_ingresar" required type="number" min="1" value={cantidadStock} onChange={e => setCantidadStock(e.target.value)} className="w-full p-6 text-center text-4xl font-black text-emerald-600 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 outline-none transition-colors" placeholder="0" autoFocus />
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading || !cantidadStock} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors transition-transform active:scale-95 disabled:opacity-50">
              {loading ? 'Sincronizando...' : 'Confirmar Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarStockModal;
