import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import Tooltip from '../components/Tooltip';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import { SYNC_EVENTS, subscribeToSync } from '../utils/stockSync';
import { Trophy, Download, DollarSign, Package, Receipt, Rocket } from 'lucide-react';

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

  const cargarVentasIniciales = useCallback(async (signal = null) => {
    setIsLoading(true);
    try {
      const [resVentas, resStats] = await Promise.all([
        axios.get(`/api/ventas?limit=${PAGE_SIZE}&offset=0`, { ...(signal && { signal }) }),
        axios.get('/api/ventas/stats', { ...(signal && { signal }) })
      ]);
      if (signal && signal.aborted) return;

      const dataVentas = resVentas.data.data || resVentas.data;
      const total = resVentas.data.total || dataVentas.length;

      setVentasOriginales(dataVentas);
      setTotalVentasServer(total);
      setCurrentOffset(dataVentas.length);
      setStatsServidor(resStats.data);

      const cats = Array.from(new Set(dataVentas.map(v => v.categoria)));
      setCategorias(cats);
    } catch (error) {
      if (axios.isCancel(error) || (signal && signal.aborted)) return;
      console.error('Error al cargar ventas iniciales', error);
    } finally {
      if (!signal || !signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    cargarVentasIniciales(controller.signal);

    // Suscribirse a eventos de sincronización (Punto 2: Tiempo Real)
    const unsubscribe = subscribeToSync((event) => {
      // Si se completa una venta en cualquier parte del APP, refrescamos el historial
      if (event.type === SYNC_EVENTS.SALE_COMPLETED) {
        cargarVentasIniciales(); // Sin signal, no hay problema si se desmonta
      }
    });

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [cargarVentasIniciales]);

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
    return ventasOriginales.filter(v => {
      // fecha_salida viene como Date object desde PostgreSQL → convertir a ISO string
      const fechaStr = v.fecha_salida ? new Date(v.fecha_salida).toISOString().slice(0, 10) : '';
      return (
        (filtroFecha === '' || fechaStr.startsWith(filtroFecha)) &&
        (filtroProducto === '' || (v.nombre_producto || '').toLowerCase().includes(filtroProducto.toLowerCase())) &&
        (filtroCategoria === '' || v.categoria === filtroCategoria)
      );
    });
  }, [ventasOriginales, filtroFecha, filtroProducto, filtroCategoria]);

  const statsRender = useMemo(() => {
    if (filtroFecha || filtroProducto || filtroCategoria) {
      // Recalcular localmente si hay filtros; usar Number() porque PG devuelve strings
      const totalVts = ventasFiltradas.reduce((sum, v) => sum + Number(v.precio_total), 0);
      const totalProds = ventasFiltradas.reduce((sum, v) => sum + Number(v.cantidad), 0);
      const vPromedio = ventasFiltradas.length ? totalVts / ventasFiltradas.length : 0;
      const pUnicos = new Set(ventasFiltradas.map(v => v.nombre_producto)).size;
      return { totalVentas: totalVts, totalProductos: totalProds, ventaPromedio: vPromedio, productosUnicos: pUnicos };
    }
    // Usar stats del servidor si no hay filtros aplicados
    return statsServidor;
  }, [ventasFiltradas, statsServidor, filtroFecha, filtroProducto, filtroCategoria]);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '---';
    // Acepta tanto string como Date object (node-postgres devuelve TIMESTAMP como Date)
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return '---';
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const abrirTopVendidos = async () => {
    try {
      // Consultar el Snapshot analítico real (30 días de historia completa)
      const response = await axios.get('/api/ia/snapshot');
      const dataFull = response.data.data || [];

      if (dataFull.length === 0) {
        setTopProductos([]);
        setModalMasVendidos(true);
        return;
      }

      // Encontrar máximos para las insignias inteligentes
      const maxRev = Math.max(...dataFull.map(item => item.revenue));
      const maxVel = Math.max(...dataFull.map(item => item.velocity));

      const ordenados = dataFull
        .sort((a, b) => b.revenue - a.revenue) // Ordenar por DINERO real
        .slice(0, 10)
        .map(item => ({
          nombre: item.nombre,
          cantidad: Math.round(item.velocity * 30), // Proyección/Total de unidades
          total: item.revenue,
          categoria: item.category === 'A' ? 'Prioridad Alta' : (item.category === 'B' ? 'Prioridad Media' : 'Baja Rotación'),
          isTopRevenue: item.revenue === maxRev,
          isHighRotation: item.velocity === maxVel
        }));
      
      setTopProductos(ordenados);
      setModalMasVendidos(true);
    } catch (error) {
      console.error('Error al obtener ranking real:', error);
      toast.error('No se pudo sincronizar el ranking con el motor IA');
    }
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
      
      {/* Header Premium (Floating Style) */}
      <div className="bg-white/40 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/20 shadow-xl shadow-indigo-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 mt-2">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Ventas <span className="text-indigo-600">Historial</span></h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Registro maestro de transacciones
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={abrirTopVendidos} className="bg-white/10 backdrop-blur-md hover:bg-indigo-600 text-indigo-600 hover:text-white py-4 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100/20 border border-indigo-100 transition-colors transition-shadow transition-transform flex items-center gap-3 active:scale-95 group">
            <Trophy size={18} className="group-hover:rotate-12 transition-transform" /> Top Ventas
          </button>
          <button onClick={exportarCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-200/50 transition-colors transition-shadow transition-transform flex items-center gap-3 active:scale-95">
             <Download size={18} /> Generar Reporte
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Ingresos Totales', value: `$${statsRender.totalVentas.toLocaleString('es-CO')}`, icon: <DollarSign size={28} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Productos Vendidos', value: statsRender.totalProductos.toLocaleString('es-CO'), icon: <Package size={28} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Venta Promedio', value: `$${statsRender.ventaPromedio.toLocaleString('es-CO', {maximumFractionDigits:0})}`, icon: <Receipt size={28} />, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-100 flex items-center gap-6 transition-shadow transition-transform hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-100 group">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <h3 className={`text-2xl font-black tracking-tighter italic ${stat.color}`}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-3 sm:p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
        <div className="w-full sm:flex-1 sm:min-w-[180px]">
          <CustomDatePicker
            value={filtroFecha}
            onChange={v => setFiltroFecha(v)}
            placeholder="Filtrar por fecha..."
            align="left-flyout"
          />
        </div>
        <input
          type="text"
          aria-label="Buscar producto por nombre"
          placeholder="Buscar producto por nombre..."
          value={filtroProducto}
          onChange={e => setFiltroProducto(e.target.value)}
          className="w-full sm:flex-[2] sm:min-w-[180px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800"
        />
        <CustomSelect
          value={filtroCategoria}
          onChange={val => setFiltroCategoria(val)}
          placeholder="Todas las categorías"
          options={[
            { value: '', label: 'Todas las categorías' },
            ...categorias.map(c => ({ value: c, label: c }))
          ]}
          className="w-full sm:flex-1 sm:min-w-[180px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
        />
      </div>

      {/* Tabla Premium */}
      <div className="bg-white/70 backdrop-blur-sm rounded-[2.5rem] border border-white/20 shadow-xl overflow-hidden ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                <th className="p-4 md:p-8">Producto</th>
                <th className="hidden lg:table-cell p-4 md:p-8">Categoría</th>
                <th className="p-4 md:p-8 text-center">Unidades</th>
                <th className="hidden sm:table-cell p-4 md:p-8 text-right">Precio</th>
                <th className="p-4 md:p-8 text-right">Total</th>
                <th className="hidden md:table-cell p-4 md:p-8 text-center">Fecha</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {isLoading && ventasFiltradas.length === 0 ? (
                <tr><td colSpan="6" className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">Consultando Registros...</td></tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr><td colSpan="6" className="p-32 text-center text-slate-400 font-bold italic">No se encontraron transacciones en este período.</td></tr>
              ) : (
                ventasFiltradas.map((v, idx) => {
                  const precioUnitario = v.precio_unitario || (v.precio_total / v.cantidad);
                  return (
                    <tr key={v.id_venta ? `${v.id_venta}-${idx}` : idx} className="group transition-colors hover:bg-indigo-50/30">
                       <td className="p-8">
                         <p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{v.nombre_producto}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
                           {v.id_venta ? `VENTA #${String(v.id_venta).padStart(6, '0')}` : 'ID VENTA: ---'}
                         </p>
                       </td>
                      <td className="hidden lg:table-cell p-8">
                         <span className="inline-block whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">{v.categoria || 'Sin Info'}</span>
                      </td>
                      <td className="p-8 text-center">
                         <span className="text-xl font-black tracking-tighter text-slate-800">{v.cantidad}</span>
                         <span className="text-[9px] text-slate-400 font-bold uppercase ml-1 tracking-widest">ud</span>
                      </td>
                      <td className="hidden sm:table-cell p-8 text-right font-black text-slate-400">
                         ${precioUnitario.toLocaleString('es-CO')}
                      </td>
                      <td className="p-8 text-right text-emerald-600 font-black text-2xl italic tracking-tighter">
                         ${v.precio_total.toLocaleString('es-CO')}
                      </td>
                      <td className="hidden md:table-cell p-8 text-center font-bold text-slate-600 text-xs tracking-widest">
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
        <div className="flex flex-col items-center justify-center gap-4 py-12">
           <span className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
             Mostrando <strong className="text-slate-600 font-outfit">{ventasOriginales.length}</strong> de <strong className="text-slate-600 font-outfit">{totalVentasServer}</strong> registros
           </span>
          {currentOffset < totalVentasServer && (
            <button 
              onClick={cargarMasVentas} 
              disabled={isLoading}
              className="px-12 py-5 bg-white text-slate-600 hover:text-white border border-slate-100 hover:bg-slate-900 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:shadow-slate-200 transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Sincronizando...' : 'Cargar Más Ventas'}
            </button>
          )}
        </div>
      )}

      {/* Modal Top Vendidos (Premium Glass) */}
      {modalMasVendidos && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-[3rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden border border-white/20">
            <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white z-20 relative shrink-0">
              <div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3"><Rocket size={28} /> Top Productos</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Los productos más vendidos de tu negocio</p>
              </div>
              <button onClick={() => setModalMasVendidos(false)} className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-2xl transition-colors transition-shadow transition-transform shadow-sm active:scale-95 ease-in-out">&times;</button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-4">
              {topProductos.map((item, idx) => {
                 let positionColor = "bg-slate-100 text-slate-500 scale-100";
                 if(idx === 0) positionColor = "bg-amber-100 text-amber-500 scale-110 shadow-lg shadow-amber-100/50";
                 else if(idx === 1) positionColor = "bg-slate-200 text-slate-600 scale-105 shadow-md";
                 else if(idx === 2) positionColor = "bg-orange-100 text-orange-600 scale-105 shadow-md";

                 return (
                  <div key={item.nombre} className="flex flex-col sm:flex-row justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 gap-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic tracking-tighter shrink-0 transition-colors transition-transform transform ${positionColor}`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-black text-slate-800 text-lg uppercase tracking-tight truncate">{item.nombre}</p>
                            {item.isTopRevenue && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-lg border border-emerald-200 shadow-sm">Mayor Ingreso</span>
                            )}
                            {item.isHighRotation && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase rounded-lg border border-indigo-200 shadow-sm animate-pulse">Alta Rotación</span>
                            )}
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.categoria}</p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-slate-200 sm:border-0">
                      <div className="font-black text-slate-800 text-lg">{item.cantidad} <span className="text-[10px] uppercase text-slate-500 tracking-widest">Und</span></div>
                      <div className="font-black text-emerald-600 text-sm mt-1 italic">${item.total.toLocaleString('es-CO')}</div>
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
