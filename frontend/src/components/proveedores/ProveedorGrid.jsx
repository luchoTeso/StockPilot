import { Pencil, Trash2, Package } from 'lucide-react';

const ProveedorGrid = ({
  proveedores,
  loading,
  onEdit,
  onDelete,
  onForecast
}) => {
  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
      {proveedores.map(p => (
        <div key={p.id_proveedor} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-shadow transition-transform hover:-translate-y-1">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{p.nombre_empresa}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm hover:shadow-indigo-100 transition-colors transition-shadow transition-transform active:scale-90"
                  title="Editar Proveedor"
                >
                    <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm hover:shadow-rose-100 transition-colors transition-shadow transition-transform active:scale-90"
                  title="Eliminar Proveedor"
                >
                    <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
              <Package size={14} /> {p.productos_vinculados} Productos Vinculados
            </p>
            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Deuda Pendiente</p>
              <p className="text-sm font-black text-rose-600">${(p.total_deuda || 0).toLocaleString()}</p>
            </div>
          </div>
          
          <button 
            onClick={() => onForecast(p)}
            className="mt-6 w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors transition-transform"
          >
            Calcular Pedido ⚡
          </button>
        </div>
      ))}
      {proveedores.length === 0 && (
        <div className="col-span-full py-10 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-slate-300">
          No hay proveedores registrados.
        </div>
      )}
    </div>
  );
};

export default ProveedorGrid;
