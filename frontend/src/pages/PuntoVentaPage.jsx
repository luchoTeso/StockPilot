import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { SYNC_EVENTS, subscribeToSync, emitSyncEvent } from '../utils/stockSync';
import { Trophy, Download, DollarSign, Package, Receipt, Rocket, ShoppingCart, History, ScanBarcode, Plus, Minus, X, CreditCard } from 'lucide-react';
import useBarcodeScanner from '../hooks/useBarcodeScanner';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import CameraScannerModal from '../components/CameraScannerModal';

const PuntoVentaPage = () => {
  const [activeTab, setActiveTab] = useState('caja'); // 'caja' | 'historial'
  return (
    <div className="animate-fade-in pb-12 space-y-8 font-outfit">
      {/* Pestañas / Header */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('caja')}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'caja' ? 'bg-white text-indigo-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
          >
            <ShoppingCart size={16} /> Caja Rápida (POS)
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'historial' ? 'bg-white text-emerald-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
          >
            <History size={16} /> Historial
          </button>
        </div>
      </div>

      {activeTab === 'caja' && <CajaRapidaTab />}
      {activeTab === 'historial' && <HistorialVentasTab />}
    </div>
  );
};

/* =========================================
 * PESTAÑA: CAJA RÁPIDA (POS)
 * ========================================= */
const CajaRapidaTab = () => {
  const toast = useToast();
  const [cart, setCart] = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Escanear código de barras para añadir al carrito
  const handleBarcodeScan = useCallback(async (code) => {
    if (!code) return;
    try {
      // Buscar en el backend el producto por barcode o SKU
      const res = await axios.get(`/api/productos/barcode/${code}`);
      const product = res.data.data;
      if (product) {
        if (product.estado !== 'Disponible') {
          toast.error(`El producto ${product.nombre_producto} no está disponible.`);
          return;
        }
        addToCart(product);
        toast.success(`Añadido: ${product.nombre_producto}`);
      }
    } catch (error) {
      toast.error('Producto no encontrado en la base de datos.');
    }
  }, [toast]);

  useBarcodeScanner(handleBarcodeScan);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id_producto === product.id_producto);
      if (existing) {
        if (existing.cantidadCart + 1 > product.cantidad) {
          toast.error('Stock insuficiente en bodega.');
          return prev;
        }
        return prev.map(item => item.id_producto === product.id_producto ? { ...item, cantidadCart: item.cantidadCart + 1 } : item);
      }
      if (product.cantidad < 1) {
        toast.error('Producto agotado.');
        return prev;
      }
      return [{ ...product, cantidadCart: 1 }, ...prev];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id_producto === id) {
        const newQ = item.cantidadCart + delta;
        if (newQ > item.cantidad) {
          toast.error('Stock insuficiente.');
          return item;
        }
        if (newQ < 1) return item;
        return { ...item, cantidadCart: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id_producto !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.precio_unitario * item.cantidadCart), 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.cantidadCart, 0);

  const handleCobrar = async () => {
    if (cart.length === 0) return;
    setLoadingPay(true);
    try {
      const items = cart.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidadCart }));
      await axios.post('/api/registrar-venta-carrito', { cart: items });
      toast.success('Venta procesada exitosamente.');
      setCart([]);
      // Emitir eventos para que el historial y productos se actualicen
      items.forEach(i => emitSyncEvent(SYNC_EVENTS.SALE_COMPLETED, { id: i.id_producto }));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al procesar la venta.');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna Izquierda: Escaneo y Carrito */}
      <div className="lg:col-span-2 space-y-6">
        {/* Acciones de escaneo */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div>
             <h3 className="font-black text-xl italic uppercase tracking-tighter text-slate-800">Escanear Producto</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Usa tu pistola láser o cámara</p>
           </div>
           <button onClick={() => setCameraScannerOpen(true)} className="w-full sm:w-auto bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors transition-transform flex items-center justify-center gap-2 active:scale-95">
              <ScanBarcode size={16} /> Abrir Cámara
           </button>
        </div>

        {/* Tabla Carrito */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
           <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-black text-slate-700 tracking-tighter uppercase italic">Items Actuales</h3>
             <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{cart.length} Productos</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 mt-20">
                  <ShoppingCart size={48} className="opacity-20" />
                  <p className="font-black uppercase tracking-[0.2em] text-xs">El carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id_producto} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow gap-4">
                     <div className="flex-1 w-full">
                       <p className="font-black text-slate-800 text-sm uppercase">{item.nombre_producto}</p>
                       <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Stock disponible: {item.cantidad}</p>
                     </div>
                     <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                       <p className="font-black text-indigo-600 text-lg">${Number(item.precio_unitario).toLocaleString('es-CO')}</p>
                       <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200">
                          <button onClick={() => updateQuantity(item.id_producto, -1)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors"><Minus size={16} /></button>
                          <span className="w-8 text-center font-black text-slate-700">{item.cantidadCart}</span>
                          <button onClick={() => updateQuantity(item.id_producto, 1)} className="p-2 text-slate-500 hover:text-emerald-500 transition-colors"><Plus size={16} /></button>
                       </div>
                       <p className="font-black text-emerald-600 text-lg min-w-[100px] text-right">${(item.precio_unitario * item.cantidadCart).toLocaleString('es-CO')}</p>
                       <button onClick={() => removeFromCart(item.id_producto)} className="p-2 text-rose-300 hover:text-rose-600 bg-rose-50 rounded-xl transition-colors"><X size={16} /></button>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Columna Derecha: Resumen de Pago */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col text-slate-800 relative overflow-hidden">
         {/* Fondo decorativo */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
         
         <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-8 relative z-10 text-slate-800">Resumen</h2>
         
         <div className="flex-1 space-y-6 relative z-10">
           <div className="flex justify-between items-center pb-4 border-b border-slate-100">
             <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Subtotal</span>
             <span className="font-black text-xl text-slate-800">${cartTotal.toLocaleString('es-CO')}</span>
           </div>
           <div className="flex justify-between items-center pb-4 border-b border-slate-100">
             <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Items</span>
             <span className="font-black text-xl text-slate-800">{cartItemsCount}</span>
           </div>
           <div className="flex justify-between items-center pt-4">
             <span className="text-slate-600 font-black uppercase tracking-[0.2em] text-sm">Total a Pagar</span>
             <span className="font-black text-4xl text-emerald-500 tracking-tighter italic">${cartTotal.toLocaleString('es-CO')}</span>
           </div>
         </div>

         <div className="mt-8 relative z-10">
           <button 
             onClick={handleCobrar}
             disabled={cart.length === 0 || loadingPay}
             className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-xl shadow-emerald-500/20"
           >
             {loadingPay ? 'Procesando...' : <><CreditCard size={20} /> Cobrar</>}
           </button>
         </div>
      </div>

      <CameraScannerModal 
        isOpen={cameraScannerOpen} 
        onClose={() => setCameraScannerOpen(false)} 
        onScan={(code) => {
          setCameraScannerOpen(false);
          handleBarcodeScan(code);
        }} 
      />
    </div>
  );
};


/* =========================================
 * PESTAÑA: HISTORIAL DE VENTAS
 * ========================================= */
const HistorialVentasTab = () => {
  const toast = useToast();
  const [ventasOriginales, setVentasOriginales] = useState([]);
  const [statsServidor, setStatsServidor] = useState({ totalVentas: 0, totalProductos: 0, ventaPromedio: 0, productosUnicos: 0 });
  const [categorias, setCategorias] = useState([]);
  const [totalVentasServer, setTotalVentasServer] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

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
      if (!signal || !signal.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    cargarVentasIniciales(controller.signal);

    const unsubscribe = subscribeToSync((event) => {
      if (event.type === SYNC_EVENTS.SALE_COMPLETED) {
        cargarVentasIniciales();
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
      const totalVts = ventasFiltradas.reduce((sum, v) => sum + Number(v.precio_total), 0);
      const totalProds = ventasFiltradas.reduce((sum, v) => sum + Number(v.cantidad), 0);
      const vPromedio = ventasFiltradas.length ? totalVts / ventasFiltradas.length : 0;
      const pUnicos = new Set(ventasFiltradas.map(v => v.nombre_producto)).size;
      return { totalVentas: totalVts, totalProductos: totalProds, ventaPromedio: vPromedio, productosUnicos: pUnicos };
    }
    return statsServidor;
  }, [ventasFiltradas, statsServidor, filtroFecha, filtroProducto, filtroCategoria]);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '---';
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return '---';
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const abrirTopVendidos = async () => {
    try {
      const response = await axios.get('/api/ia/snapshot');
      const dataFull = response.data.data || [];

      if (dataFull.length === 0) {
        setTopProductos([]);
        setModalMasVendidos(true);
        return;
      }

      const maxRev = Math.max(...dataFull.map(item => item.revenue));
      const maxVel = Math.max(...dataFull.map(item => item.velocity));

      const ordenados = dataFull
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(item => ({
          nombre: item.nombre,
          cantidad: Math.round(item.velocity * 30),
          total: item.revenue,
          categoria: item.category === 'A' ? 'Prioridad Alta' : (item.category === 'B' ? 'Prioridad Media' : 'Baja Rotación'),
          isTopRevenue: item.revenue === maxRev,
          isHighRotation: item.velocity === maxVel
        }));
      
      setTopProductos(ordenados);
      setModalMasVendidos(true);
    } catch (error) {
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
    <div className="space-y-8">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Ingresos Totales', value: `$${statsRender.totalVentas.toLocaleString('es-CO')}`, icon: <DollarSign size={28} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Productos Vendidos', value: statsRender.totalProductos.toLocaleString('es-CO'), icon: <Package size={28} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Venta Promedio', value: `$${statsRender.ventaPromedio.toLocaleString('es-CO', {maximumFractionDigits:0})}`, icon: <Receipt size={28} />, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
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
      <div className="bg-white p-3 sm:p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row w-full sm:w-auto flex-1 gap-3 sm:gap-4">
          <div className="w-full sm:flex-1 sm:max-w-[200px]">
            <CustomDatePicker
              value={filtroFecha}
              onChange={v => setFiltroFecha(v)}
              placeholder="Filtrar fecha..."
              align="left-flyout"
            />
          </div>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filtroProducto}
            onChange={e => setFiltroProducto(e.target.value)}
            className="w-full sm:flex-[2] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
          />
          <CustomSelect
            value={filtroCategoria}
            onChange={val => setFiltroCategoria(val)}
            placeholder="Todas las categorías"
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categorias.map(c => ({ value: c, label: c }))
            ]}
            className="w-full sm:flex-1 sm:max-w-[220px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={abrirTopVendidos} className="flex-1 sm:flex-none bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2">
            <Trophy size={16} /> Top
          </button>
          <button onClick={exportarCSV} className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2">
             <Download size={16} /> Reporte
          </button>
        </div>
      </div>

      {/* Tabla Historial */}
      <div className="bg-white/70 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
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
                <tr><td colSpan="6" className="p-32 text-center text-slate-400 font-bold italic">No hay transacciones.</td></tr>
              ) : (
                ventasFiltradas.map((v, idx) => {
                  const precioUnitario = v.precio_unitario || (v.precio_total / v.cantidad);
                  return (
                    <tr key={v.id_venta ? `${v.id_venta}-${idx}` : idx} className="hover:bg-indigo-50/30">
                       <td className="p-8">
                         <p className="font-black text-slate-800 text-sm uppercase">{v.nombre_producto}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-1 tracking-widest uppercase">{v.id_venta ? `VENTA #${String(v.id_venta).padStart(6, '0')}` : '---'}</p>
                       </td>
                      <td className="hidden lg:table-cell p-8">
                         <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">{v.categoria || 'S/N'}</span>
                      </td>
                      <td className="p-8 text-center font-black text-slate-800 text-xl">{v.cantidad}</td>
                      <td className="hidden sm:table-cell p-8 text-right font-black text-slate-400">${Number(precioUnitario).toLocaleString('es-CO')}</td>
                      <td className="p-8 text-right text-emerald-600 font-black text-xl italic">${Number(v.precio_total).toLocaleString('es-CO')}</td>
                      <td className="hidden md:table-cell p-8 text-center font-bold text-slate-600 text-xs tracking-widest">{formatearFecha(v.fecha_salida)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Top Vendidos */}
      {modalMasVendidos && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-white">
              <div>
                 <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-2"><Rocket size={24} /> Top Productos</h3>
              </div>
              <button onClick={() => setModalMasVendidos(false)} className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-2xl transition-colors">&times;</button>
            </div>
            <div className="p-8 overflow-y-auto space-y-4">
              {topProductos.map((item, idx) => (
                  <div key={item.nombre} className="flex flex-col sm:flex-row justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 gap-4">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic ${idx === 0 ? 'bg-amber-100 text-amber-500 scale-110' : 'bg-slate-200 text-slate-600'}`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="font-black text-slate-800 text-lg uppercase tracking-tight truncate">{item.nombre}</p>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.categoria}</p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t border-slate-200 sm:border-0 pt-4 sm:pt-0">
                      <div className="font-black text-slate-800 text-lg">{item.cantidad} <span className="text-[10px] text-slate-500 uppercase tracking-widest">Und</span></div>
                      <div className="font-black text-emerald-600 text-sm mt-1 italic">${item.total.toLocaleString('es-CO')}</div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuntoVentaPage;
