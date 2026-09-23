import { DollarSign, Package, Barcode, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../common/ErrorState';

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
  loadError,
  onRetry,
  isAdmin,
  onEdit,
  onToggleStatus,
  onDelete,
  onPromote
}) => {
  const navigate = useNavigate();

  const calcNivelStock = (prod) => {
    if (prod.cantidad <= prod.stock_minimo) return 'critico';
    if (prod.cantidad <= prod.stock_minimo * 1.5) return 'bajo';
    return 'ok';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 bg-slate-50/50">
              <th className="p-6">Producto / Identificación</th>
              <th className="hidden lg:table-cell p-6">Categoría</th>
              <th className="p-6 text-center">Disponibilidad</th>
              <th className="hidden sm:table-cell p-6 text-center">Estado</th>
              <th className="hidden xl:table-cell p-6 text-center">Último Ingreso</th>
              {isAdmin && <th className="p-6 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="6" className="p-6">
                    <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
                  </td>
                </tr>
              ))
            ) : loadError ? (
              <tr>
                <td colSpan="6"><ErrorState title="No pudimos cargar los productos" onRetry={onRetry} /></td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-slate-500 font-bold text-sm">
                  No se encontraron productos registrados
                </td>
              </tr>
            ) : (
              productos.map(p => {
                const isActive = p.estado === 'Disponible';
                const nivelStock = calcNivelStock(p);
                const isCritico = nivelStock === 'critico';
                const isBajo = nivelStock === 'bajo';

                return (
                  <tr key={p.id_producto} className={`group transition-colors hover:bg-slate-50 ${!isActive ? 'opacity-50 grayscale' : ''}`}>
                    <td className="p-6">
                       <p className="font-bold text-tinta text-sm">{p.nombre_producto}</p>
                       <div className="flex flex-wrap items-center gap-2 mt-1">
                         {(p.codigo_barras || p.codigo) && (
                           <span className="text-xs font-bold text-azul font-mono bg-azul/10 px-2 py-0.5 rounded border border-azul/30 flex items-center gap-1">
                             <Barcode size={12} className="text-azul" /> {p.codigo_barras || p.codigo}
                           </span>
                         )}
                         {p.codigo && p.codigo_barras && p.codigo !== p.codigo_barras && (
                           <span className="text-xs font-bold text-slate-500">
                             SKU: {p.codigo}
                           </span>
                         )}
                       </div>
                    </td>
                    <td className="hidden lg:table-cell p-6">
                      <span className="inline-block whitespace-nowrap px-3 py-1 bg-slate-100 text-tinta-2 rounded-full text-xs font-bold">{p.categoria || 'Sin Info'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <span className="flex flex-col items-center leading-tight">
                           <span className={`text-xl font-bold ${isCritico ? 'text-peligro' : isBajo ? 'text-aviso' : 'text-tinta'}`}>{p.cantidad}</span>
                           <span className="text-xs text-slate-500 font-bold">ud</span>
                         </span>
                         {isCritico && (
                           <button onClick={() => navigate(`/analisis-detallado?producto=${p.id_producto}`)} title="Ver más información y qué se recomienda hacer" className="bg-peligro-suave text-peligro text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-rose-200 shadow-sm animate-pulse hover:bg-rose-200 transition-colors transition-transform cursor-pointer flex items-center gap-1">
                             {p.cantidad === 0 ? 'Agotado' : 'Por agotarse'} <ArrowRight size={10} />
                           </button>
                         )}
                         {isBajo && (
                           <button onClick={() => navigate(`/analisis-detallado?producto=${p.id_producto}`)} title="Ver más información y qué se recomienda hacer" className="bg-aviso-suave text-aviso text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-amber-200 hover:bg-amber-200 transition-colors transition-transform cursor-pointer flex items-center gap-1">
                             Pedir Más <ArrowRight size={10} />
                           </button>
                         )}
                         {!isCritico && !isBajo && isActive && <span className="bg-emerald-50 text-exito text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-exito-suave">Suficiente</span>}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell p-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${isActive ? 'bg-emerald-50 text-exito border border-exito-suave' : 'bg-rose-50 text-peligro border border-peligro-suave'}`}>
                        {isActive ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell p-6 text-center font-bold text-slate-600 text-xs">
                      {formatearFecha(p.fecha_entrada)}
                    </td>
                    {isAdmin && (
                      <td className="p-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isActive ? (
                            <>
                               <div className="w-px h-8 bg-slate-200 mx-1"></div>
                               <button onClick={() => onEdit(p)} className="text-xs px-3 py-2 font-bold text-slate-600 hover:text-azul hover:bg-azul/10 rounded-lg transition-colors">Editar</button>
                               <button onClick={() => onPromote(p)} className="text-xs px-3 py-2 font-bold text-aviso hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1"><Zap size={12}/> Promo</button>
                               <button onClick={() => onToggleStatus(p)} className="text-xs px-3 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Pausar</button>
                               <button onClick={() => onDelete(p)} className="text-xs px-3 py-2 font-bold text-peligro hover:bg-rose-50 rounded-lg transition-colors">Borrar</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => onToggleStatus(p)} className="text-xs px-4 py-2 font-bold bg-emerald-50 text-exito hover:bg-exito hover:text-white rounded-lg transition-colors shadow-sm">Reactivar</button>
                              <button onClick={() => onDelete(p)} className="text-xs px-4 py-2 font-bold text-peligro hover:bg-rose-50 rounded-lg transition-colors ml-2">Eliminar</button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
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
