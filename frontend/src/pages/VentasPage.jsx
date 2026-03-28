import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import Tooltip from '../components/Tooltip';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';

const VentasPage = () => {
  const toast = useToast();
  const [ventasOriginales, setVentasOriginales] = useState([]);
  const [statsServidor, setStatsServidor] = useState({ totalVentas: 0, totalProductos: 0, ventaPromedio: 0, productosUnicos: 0 });
  const [categorias, setCategorias] = useState([]);
  const [totalVentasServer, setTotalVentasServer] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Top Vendidos
  const [modalMasVendidos, setModalMasVendidos] = useState(false);
  const [topProductos, setTopProductos] = useState([]);

  const PAGE_SIZE = 100;

  useEffect(() => {
    cargarVentasIniciales();
  }, []);

  const cargarVentasIniciales = async () => {
    setIsLoading(true);
    try {
      const [resVentas, resStats] = await Promise.all([
        axios.get(`/api/ventas?limit=${PAGE_SIZE}&offset=0`),
        axios.get('/api/ventas/stats')
      ]);

      const dataVentas = resVentas.data.data || resVentas.data;
      const total = resVentas.data.total || dataVentas.length;

      setVentasOriginales(dataVentas);
      setTotalVentasServer(total);
      setCurrentOffset(dataVentas.length);
      setStatsServidor(resStats.data);

      const cats = Array.from(new Set(dataVentas.map(v => v.categoria)));
      setCategorias(cats);
    } catch (error) {
      console.error('Error al cargar ventas iniciales', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarMasVentas = async () => {
    if (isLoading || currentOffset >= totalVentasServer) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/ventas?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      const nuevasVentas = res.data.data || res.data;

      const combinadas = [...ventasOriginales, ...nuevasVentas];
      setVentasOriginales(combinadas);
      setCurrentOffset(prev => prev + nuevasVentas.length);

      const cats = Array.from(new Set(combinadas.map(v => v.categoria)));
      setCategorias(cats);
    } catch (error) {
      console.error('Error al cargar más ventas', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ventasFiltradas = useMemo(() => {
    return ventasOriginales.filter(v => 
      (filtroFecha === '' || v.fecha_salida.startsWith(filtroFecha)) &&
      (filtroProducto === '' || v.nombre_producto.toLowerCase().includes(filtroProducto.toLowerCase())) &&
      (filtroCategoria === '' || v.categoria === filtroCategoria)
    );
  }, [ventasOriginales, filtroFecha, filtroProducto, filtroCategoria]);

  const statsRender = useMemo(() => {
    if (filtroFecha || filtroProducto || filtroCategoria) {
      // Recalcular localmente si hay filtros
      const totalVts = ventasFiltradas.reduce((sum, v) => sum + v.precio_total, 0);
      const totalProds = ventasFiltradas.reduce((sum, v) => sum + v.cantidad, 0);
      const vPromedio = ventasFiltradas.length ? totalVts / ventasFiltradas.length : 0;
      const pUnicos = new Set(ventasFiltradas.map(v => v.nombre_producto)).size;
      return { totalVentas: totalVts, totalProductos: totalProds, ventaPromedio: vPromedio, productosUnicos: pUnicos };
    }
    // Usar stats del servidor si no hay filtros aplicados
    return statsServidor;
  }, [ventasFiltradas, statsServidor, filtroFecha, filtroProducto, filtroCategoria]);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '---';
    // Normalizar a ISO UTC para evitar desvíos de zona horaria en el navegador
    const isoStr = fechaString.includes('T') ? fechaString : fechaString.replace(' ', 'T') + 'Z';
    const fecha = new Date(isoStr);
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const abrirTopVendidos = () => {
    let resumen = {};
    ventasOriginales.forEach(v => {
      if (!resumen[v.nombre_producto]) {
        resumen[v.nombre_producto] = { cantidad: 0, total: 0, categoria: v.categoria };
      }
      resumen[v.nombre_producto].cantidad += v.cantidad;
      resumen[v.nombre_producto].total += v.precio_total;
    });

    const ordenados = Object.entries(resumen)
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .slice(0, 10);
    
    setTopProductos(ordenados);
    setModalMasVendidos(true);
  };

  const exportarCSV = async () => {
    try {
      const response = await axios.post('/api/exportar/ventas');
      if (response.data.success) {
        window.location.href = `/api/exportar/descargar/${response.data.filename}`;
      }
    } catch (error) {
      toast.error('Error al exportar ventas: Valida tu sesión.');
    }
  };

  return (
    <div className="animate-fade-in pb-12 space-y-8 font-outfit">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Historial de Ventas</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Todas las ventas de tu negocio</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={abrirTopVendidos} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95">
            <span>🏆</span> Top Ventas
          </button>
          <button onClick={exportarCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95">
            <span>📗</span> Exportar Excel
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Totales', value: `$${statsRender.totalVentas.toLocaleString('es-CO')}`, icon: '💰', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Productos Vendidos', value: statsRender.totalProductos.toLocaleString('es-CO'), icon: '📦', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Venta Promedio', value: `$${statsRender.ventaPromedio.toLocaleString('es-CO', {maximumFractionDigits:0})}`, icon: '🧾', color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Variedad Vendida', value: statsRender.productosUnicos, icon: '🔄', color: 'text-rose-500', bg: 'bg-rose-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-slate-200">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <Tooltip text={stat.label} className="w-full min-w-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 truncate w-full">{stat.label}</p>
              </Tooltip>
              <Tooltip text={String(stat.value)} className="w-full min-w-0 flex-1">
                 <h3 className={`text-xl lg:text-2xl font-black tracking-tighter italic ${stat.color} truncate w-full`}>{stat.value}</h3>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <CustomDatePicker 
            value={filtroFecha} 
            onChange={v => setFiltroFecha(v)} 
            placeholder="Filtrar por fecha..." 
            align="left-flyout"
          />
        </div>
        <input 
          type="text" 
          placeholder="Buscar producto por nombre..." 
          value={filtroProducto} 
          onChange={e => setFiltroProducto(e.target.value)} 
          className="flex-[2] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800 min-w-[200px]" 
        />
        <CustomSelect 
          value={filtroCategoria} 
          onChange={val => setFiltroCategoria(val)}
          placeholder="Todas las categorías"
          options={[
            { value: '', label: 'Todas las categorías' },
            ...categorias.map(c => ({ value: c, label: c }))
          ]}
          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800 min-w-[200px] flex-1"
        />
      </div>

      {/* Tabla Premium */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                <th className="p-6">Producto</th>
                <th className="p-6">Categoría</th>
                <th className="p-6 text-center">Unidades</th>
                <th className="p-6 text-right">Precio</th>
                <th className="p-6 text-right">Total</th>
                <th className="p-6 text-center">Fecha</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {isLoading && ventasFiltradas.length === 0 ? (
                <tr><td colSpan="6" className="p-24 text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">Consultando Registros...</td></tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr><td colSpan="6" className="p-24 text-center text-slate-400 font-bold italic">No se encontraron transacciones en este período.</td></tr>
              ) : (
                ventasFiltradas.map((v, idx) => {
                  const precioUnitario = v.precio_unitario || (v.precio_total / v.cantidad);
                  return (
                    <tr key={v.id_venta ? `${v.id_venta}-${idx}` : idx} className="group transition-all hover:bg-slate-50">
                       <td className="p-6">
                         <p className="font-black text-slate-800 text-sm">{v.nombre_producto}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
                           {v.id_venta ? `VENTA #${String(v.id_venta).padStart(6, '0')}` : 'ID VENTA: ---'}
                         </p>
                       </td>
                      <td className="p-6">
                         <span className="inline-block whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[9px] font-black uppercase tracking-widest">{v.categoria || 'Sin Info'}</span>
                      </td>
                      <td className="p-6 text-center">
                         <span className="text-lg font-black tracking-tighter text-slate-800">{v.cantidad}</span>
                         <span className="text-[9px] text-slate-400 font-bold uppercase ml-1 tracking-widest">ud</span>
                      </td>
                      <td className="p-6 text-right font-black text-slate-500">
                         ${precioUnitario.toLocaleString('es-CO')}
                      </td>
                      <td className="p-6 text-right text-emerald-600 font-black text-lg italic tracking-tighter">
                         ${v.precio_total.toLocaleString('es-CO')}
                      </td>
                      <td className="p-6 text-center font-bold text-slate-600 text-xs tracking-widest">
                        {formatearFecha(v.fecha_salida)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación Cargar Más */}
      {!filtroFecha && !filtroProducto && !filtroCategoria && totalVentasServer > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
           <span className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
             Mostrando <strong className="text-slate-600">{ventasOriginales.length}</strong> de <strong className="text-slate-600">{totalVentasServer}</strong> registros
           </span>
          {currentOffset < totalVentasServer && (
            <button 
              onClick={cargarMasVentas} 
              disabled={isLoading}
              className="px-8 py-4 bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Cargando ventas...' : 'Cargar Más Ventas'}
            </button>
          )}
        </div>
      )}

      {/* Modal Top Vendidos */}
      {modalMasVendidos && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden">
            <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white z-20 relative shrink-0">
              <div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">🚀 Top Productos</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Los productos más vendidos de tu negocio</p>
              </div>
              <button onClick={() => setModalMasVendidos(false)} className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-2xl transition-all shadow-sm active:scale-95 ease-in-out">&times;</button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-4">
              {topProductos.map(([nombre, data], idx) => {
                 let positionColor = "bg-slate-100 text-slate-500 scale-100";
                 if(idx === 0) positionColor = "bg-amber-100 text-amber-500 scale-110 shadow-lg shadow-amber-100/50";
                 else if(idx === 1) positionColor = "bg-slate-200 text-slate-600 scale-105 shadow-md";
                 else if(idx === 2) positionColor = "bg-orange-100 text-orange-600 scale-105 shadow-md";

                 return (
                  <div key={nombre} className="flex flex-col sm:flex-row justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 gap-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic tracking-tighter shrink-0 transition-all transform ${positionColor}`}>
                        #{idx + 1}
                      </div>
                      <div>
                         <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{nombre}</p>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{data.categoria}</p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-slate-200 sm:border-0">
                      <div className="font-black text-slate-800 text-lg">{data.cantidad} <span className="text-[10px] uppercase text-slate-500 tracking-widest">Und</span></div>
                      <div className="font-black text-emerald-500 text-sm mt-1 italic">${data.total.toLocaleString('es-CO')}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VentasPage;
