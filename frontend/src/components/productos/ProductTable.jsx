import { DollarSign, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatearFecha = (fechaString) => {
  if (!fechaString) return '---';
  const raw = fechaString.split('T')[0];
  const [year, month, day] = raw.split('-');
  if (year && month && day) return `${day}/${month}/${year}`;
  return raw;
};

const ProductTable = ({
  productos,
  loading,
  isAdmin,
  onEdit,
  onSell,
  onAddStock,
  onToggleStatus,
  onDelete
}) => {
  const navigate = useNavigate();

  const calcNivelStock = (prod) => {
    if (prod.cantidad <= prod.stock_minimo) return 'critico';
    if (prod.cantidad <= prod.stock_minimo * 1.5) return 'bajo';
    return 'ok';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden ring-1 ring-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
              <th className="p-4 md:p-8">Producto</th>
              <th className="hidden lg:table-cell p-4 md:p-8">Categoría</th>
              <th className="p-4 md:p-8 text-center">En Bodega</th>
              <th className="hidden sm:table-cell p-4 md:p-8 text-center">Estado</th>
              <th className="hidden xl:table-cell p-4 md:p-8 text-center">Registro</th>
              <th className="p-4 md:p-8 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse whitespace-nowrap">Consultando Bóveda...</td></tr>
            ) : productos.length === 0 ? (
              <tr><td colSpan="6" className="p-32 text-center text-slate-400 font-bold italic whitespace-nowrap">No hay productos en esta vista.</td></tr>
            ) : (
              productos.map(p => {
                const isActive = p.estado === 'Disponible';
                const nivelStock = calcNivelStock(p);
                const isCritico = nivelStock === 'critico';
                const isBajo = nivelStock === 'bajo';

                return (
                  <tr key={p.id_producto} className={`group transition-colors hover:bg-slate-50 ${!isActive ? 'opacity-50 grayscale' : ''}`}>
                    <td className="p-6">
                       <p className="font-black text-slate-800 text-sm">{p.nombre_producto}</p>
                       <p className="text-[10px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Ref: {p.codigo || 'S/N'}</p>
                    </td>
                    <td className="hidden lg:table-cell p-6">
                      <span className="inline-block whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[9px] font-black uppercase tracking-widest">{p.categoria || 'Sin Info'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <span className={`text-xl font-black tracking-tighter ${isCritico ? 'text-rose-600' : isBajo ? 'text-amber-500' : 'text-slate-800'}`}>{p.cantidad}</span>
                         {isCritico && <button onClick={() => navigate('/analisis-detallado')} title="Riesgo de agotamiento inminente" className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-rose-200 shadow-sm animate-pulse hover:bg-rose-200 hover:scale-105 transition-colors transition-transform cursor-pointer">Agotado</button>}
                         {isBajo && <button onClick={() => navigate('/analisis-detallado')} title="El stock ha bajado del nivel seguro para operar" className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-200 hover:scale-105 transition-colors transition-transform cursor-pointer">Pedir Más</button>}
                         {!isCritico && !isBajo && isActive && <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">Suficiente</span>}
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">ud</p>
                    </td>
                    <td className="hidden sm:table-cell p-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {isActive ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell p-6 text-center font-bold text-slate-600 text-xs">
                      {formatearFecha(p.fecha_entrada)}
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isActive ? (
                          <>
                            <button onClick={() => onSell(p)} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors transition-transform shadow-sm active:scale-95" title="Registrar Venta Directa"><DollarSign size={16} /></button>
                            <button onClick={() => onAddStock(p)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors transition-transform shadow-sm active:scale-95" title="Ingresar Stock"><Package size={16} /></button>
                            
                            {isAdmin && (
                              <>
                                 <div className="w-px h-8 bg-slate-200 mx-1"></div>
                                 <button onClick={() => onEdit(p)} className="text-[10px] px-3 py-2 font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">Editar</button>
                                 <button onClick={() => onToggleStatus(p)} className="text-[10px] px-3 py-2 font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">Pausar</button>
                                 <button onClick={() => onDelete(p)} className="text-[10px] px-3 py-2 font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">Borrar</button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {isAdmin && <button onClick={() => onToggleStatus(p)} className="text-[10px] px-4 py-2 font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors shadow-sm">Reactivar</button>}
                            {isAdmin && <button onClick={() => onDelete(p)} className="text-[10px] px-4 py-2 font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-colors ml-2">Eliminar</button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
