import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { SYNC_EVENTS, subscribeToSync, emitSyncEvent } from '../utils/stockSync';
import { Trophy, Download, DollarSign, Package, Receipt, Rocket, ShoppingCart, History, ScanBarcode, Plus, Minus, X, CreditCard, Search, Lock, Unlock, AlertTriangle } from 'lucide-react';
import useBarcodeScanner from '../hooks/useBarcodeScanner';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import { useReactToPrint } from 'react-to-print';
import PaymentModal from '../components/PaymentModal';
import TicketPrinter from '../components/TicketPrinter';
import CashRegisterModal from '../components/CashRegisterModal';
import ExpenseModal from '../components/ExpenseModal';
import { useAuth } from '../context/AuthContext';

const PuntoVentaPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Administrador';
  const [activeTab, setActiveTab] = useState('caja'); // 'caja' | 'historial' | 'historial_caja'

  // Cash Register Session State (movido desde CajaRapidaTab)
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Cargar estado inicial de la sesión de caja
  useEffect(() => {
    const checkRegisterSession = async () => {
      try {
        const res = await axios.get('/api/caja/sesion');
        setIsSessionActive(Boolean(res.data?.active));
      } catch (error) {
        console.error("Error al verificar sesión de caja", error);
      }
    };
    checkRegisterSession();
  }, []);

  return (
    <div className="animate-fade-in pb-12 space-y-8 font-outfit">
      {/* Pestañas / Header */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
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
          {isAdmin && (
            <>
            <button
              onClick={() => setActiveTab('historial_caja')}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'historial_caja' ? 'bg-white text-rose-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
            >
              <DollarSign size={16} /> Historial Caja
            </button>
            <button
              onClick={() => setActiveTab('egresos')}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'egresos' ? 'bg-white text-orange-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
            >
              <History size={16} /> Egresos
            </button>
            </>
          )}
        </div>

        {/* Botón de Caja movido al lado de las pestañas */}
        <button
          onClick={() => setIsCashRegisterOpen(true)}
          className={`px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            isSessionActive 
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 shadow-sm' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
          }`}
        >
          {isSessionActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <Lock size={14} />
              Cerrar Turno (Caja Activa)
            </>
          ) : (
            <>
              <Unlock size={14} />
              Abrir Caja
            </>
          )}
        </button>
      </div>

      {activeTab === 'caja' && <CajaRapidaTab isSessionActive={isSessionActive} setIsCashRegisterOpen={setIsCashRegisterOpen} user={user} />}
      {activeTab === 'historial' && <HistorialVentasTab />}
      {activeTab === 'historial_caja' && isAdmin && <HistorialCajaTab />}
      {activeTab === 'egresos' && isAdmin && (
        <HistorialEgresosTab 
          isSessionActive={isSessionActive} 
          setIsCashRegisterOpen={setIsCashRegisterOpen} 
          user={user}
        />
      )}

      <CashRegisterModal
        isOpen={isCashRegisterOpen}
        onClose={() => setIsCashRegisterOpen(false)}
        onStatusChange={setIsSessionActive}
      />
    </div>
  );
};

/* =========================================
 * PESTAÑA: CAJA RÁPIDA (POS)
 * ========================================= */
const CajaRapidaTab = ({ isSessionActive, setIsCashRegisterOpen, user }) => {
  const toast = useToast();
  const [cart, setCart] = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const searchInputRef = useRef(null);
  
  // Payment and Ticket State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const ticketRef = useRef();

  // Expense State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: 'Ticket_Venta',
    onAfterPrint: () => {
       setTicketData(null);
       setCart([]);
    }
  });

  // Nuevo estado para búsqueda predictiva
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Cargar todos los productos al montar la pestaña para la búsqueda rápida
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('/api/productos');
        setAllProducts(data);
      } catch (error) {
        console.error("Error al cargar productos para búsqueda", error);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.nombre_producto?.toLowerCase().includes(term) || 
      (p.codigo && p.codigo.toLowerCase().includes(term))
    ).slice(0, 8); // Limitar a 8 resultados para no saturar la pantalla
  }, [searchTerm, allProducts]);

  const handleSelectProduct = (product) => {
    if (product.estado !== 'Disponible') {
      toast.error(`El producto ${product.nombre_producto} no está disponible.`);
      return;
    }
    addToCart(product);
    toast.success(`Añadido: ${product.nombre_producto}`);
    setSearchTerm('');
    setShowResults(false);
  };

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

  const cartTotal = cart.reduce((acc, item) => acc + ((item.precio || item.precio_unitario || 0) * item.cantidadCart), 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.cantidadCart, 0);
  const totalCart = cartTotal;

  const handleOpenPayment = () => {
    if (!isSessionActive) {
      toast.error('Debes abrir la caja antes de poder cobrar.');
      setIsCashRegisterOpen(true);
      return;
    }
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (paymentDetails) => {
    setLoadingPay(true);
    try {
      const items = cart.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidadCart }));
      const payload = { 
        items, 
        metodo_pago: paymentDetails.metodo_pago, 
        efectivo_recibido: paymentDetails.efectivo_recibido 
      };
      const response = await axios.post('/api/registrar-venta-carrito', payload);
      toast.success('Venta procesada exitosamente.');
      setIsPaymentModalOpen(false);
      
      // Emitir eventos
      items.forEach(i => emitSyncEvent(SYNC_EVENTS.SALE_COMPLETED, { id: i.id_producto }));
      
      // Preparar e imprimir ticket
      setTicketData({
        items: cart,
        total: totalCart,
        id_venta: response.data.id_venta,
        metodo_pago: paymentDetails.metodo_pago,
        efectivo_recibido: paymentDetails.efectivo_recibido,
        cambio_devuelto: paymentDetails.efectivo_recibido >= totalCart ? paymentDetails.efectivo_recibido - totalCart : 0,
        fecha: new Date()
      });
      setTimeout(() => {
        handlePrint();
      }, 500);

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
        {/* Acciones de escaneo y búsqueda */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between relative z-20">
           <div className="flex-1 w-full relative">
             <h3 className="font-black text-xl italic uppercase tracking-tighter text-slate-800 mb-2">Buscar o Escanear Producto</h3>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Search size={18} className="text-slate-400" />
               </div>
               <input
                 type="text"
                 placeholder="Escribe el nombre o código, o escanea..."
                 className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                 value={searchTerm}
                 onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowResults(true);
                 }}
                 onFocus={() => setShowResults(true)}
                 onBlur={() => setTimeout(() => setShowResults(false), 200)}
               />
               
               {/* Dropdown de resultados */}
               {showResults && searchTerm && (
                 <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-64 overflow-y-auto">
                   {filteredProducts.length > 0 ? (
                     filteredProducts.map(p => (
                       <button
                         key={p.id_producto}
                         onMouseDown={() => handleSelectProduct(p)}
                         className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex justify-between items-center transition-colors"
                       >
                         <div>
                           <p className="font-bold text-slate-700 text-sm">{p.nombre_producto}</p>
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest">{p.codigo || 'SIN CÓDIGO'} • Stock: {p.cantidad}</p>
                         </div>
                         <span className="font-black text-indigo-600">${Number(p.precio_venta || p.precio_unitario || p.precio || 0).toLocaleString('es-CO')}</span>
                       </button>
                     ))
                   ) : (
                     <div className="px-4 py-6 text-center text-slate-400 text-sm font-bold">
                       No se encontraron productos
                     </div>
                   )}
                 </div>
               )}
             </div>
           </div>
           <div className="flex w-full sm:w-auto gap-2 mt-auto">
             <button 
               type="button"
               onClick={() => {
                 if (!isSessionActive) {
                   toast.error('Debes abrir la caja antes de registrar un egreso.');
                   setIsCashRegisterOpen(true);
                   return;
                 }
                 setIsExpenseModalOpen(true);
               }} 
               className="w-full sm:w-auto h-12 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-100 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors transition-transform flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
             >
               <DollarSign size={16} /> Egreso
             </button>
           </div>
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
                       <p className="font-black text-indigo-600 text-lg">${Number(item.precio || item.precio_unitario || 0).toLocaleString('es-CO')}</p>
                       <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200">
                          <button onClick={() => updateQuantity(item.id_producto, -1)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors"><Minus size={16} /></button>
                          <span className="w-8 text-center font-black text-slate-700">{item.cantidadCart}</span>
                          <button onClick={() => updateQuantity(item.id_producto, 1)} className="p-2 text-slate-500 hover:text-emerald-500 transition-colors"><Plus size={16} /></button>
                       </div>
                       <p className="font-black text-emerald-600 text-lg min-w-[100px] text-right">${((item.precio || item.precio_unitario || 0) * item.cantidadCart).toLocaleString('es-CO')}</p>
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
         
         <div className="flex justify-between items-center mb-8 relative z-10">
           <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-800">Resumen</h2>
         </div>
         
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
             onClick={handleOpenPayment}
             disabled={cart.length === 0 || loadingPay}
             className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-xl shadow-emerald-500/20"
           >
             {loadingPay ? 'Procesando...' : <><CreditCard size={20} /> Cobrar</>}
           </button>
         </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={totalCart}
        onConfirm={handleConfirmPayment}
        loading={loadingPay}
      />

      <TicketPrinter 
        ref={ticketRef}
        ticketData={ticketData}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseRegistered={() => {
            // Se puede agregar lógica opcional aquí después de registrar el gasto
        }}
        user={user}
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
                <th className="p-4 md:p-8 text-center">Vendedor</th>
                <th className="hidden md:table-cell p-4 md:p-8 text-center">Fecha</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {isLoading && ventasFiltradas.length === 0 ? (
                <tr><td colSpan="7" className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">Consultando Registros...</td></tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr><td colSpan="7" className="p-32 text-center text-slate-400 font-bold italic">No hay transacciones.</td></tr>
              ) : (
                ventasFiltradas.map((v, idx) => {
                  const precioUnitario = v.precio_unitario || (v.precio_total / v.cantidad);
                  return (
                    <tr key={v.id_venta ? `${v.id_venta}-${idx}` : idx} className="hover:bg-indigo-50/30">
                       <td className="p-8">
                         <p className="font-black text-slate-800 text-sm uppercase">{v.nombre_producto}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-1 tracking-widest uppercase flex items-center gap-1.5 flex-wrap">
                           <span>{v.id_venta ? `VENTA #${String(v.id_venta).padStart(6, '0')}` : '---'}</span>
                           <span className="text-indigo-600 font-black sm:hidden">• {v.nombre_vendedor || 'Admin'}</span>
                         </p>
                       </td>
                      <td className="hidden lg:table-cell p-8">
                         <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">{v.categoria || 'S/N'}</span>
                      </td>
                      <td className="p-8 text-center font-black text-slate-800 text-xl">{v.cantidad}</td>
                      <td className="hidden sm:table-cell p-8 text-right font-black text-slate-400">${Number(precioUnitario).toLocaleString('es-CO')}</td>
                      <td className="p-8 text-right text-emerald-600 font-black text-xl italic">${Number(v.precio_total).toLocaleString('es-CO')}</td>
                      <td className="p-8 text-center font-bold text-slate-700 text-xs">
                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
                           {v.nombre_vendedor || 'Admin'}
                         </span>
                      </td>
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

/* =========================================
 * PESTAÑA: HISTORIAL DE CAJA (Solo Admin)
 * ========================================= */
const HistorialCajaTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('/api/caja/historial');
        if (data.success) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Error al cargar historial de caja:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleString('es-CO', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
      <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-800 mb-6">Historial de Sesiones de Caja</h2>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
      ) : history.length === 0 ? (
        <p className="text-center text-slate-400 font-bold py-8 uppercase tracking-widest text-sm">No hay registros de sesiones de caja.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">
                <th className="p-4">Estado</th>
                <th className="p-4">Apertura</th>
                <th className="p-4">Cierre</th>
                <th className="p-4">Vendedor</th>
                <th className="p-4 text-right">M. Apertura</th>
                <th className="p-4 text-right">M. Calculado</th>
                <th className="p-4 text-right">M. Declarado</th>
                <th className="p-4 text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {history.map((s) => {
                const diff = parseFloat(s.diferencia || 0);
                const isDescuadre = diff !== 0 && s.estado === 'Cerrada';
                return (
                  <tr key={s.id_sesion} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        s.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {s.estado}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{formatDate(s.fecha_apertura)}</td>
                    <td className="p-4 text-slate-600">{formatDate(s.fecha_cierre)}</td>
                    <td className="p-4 font-bold text-slate-800">{s.vendedor_nombre || `ID: ${s.id_vendedor}`}</td>
                    <td className="p-4 text-right text-indigo-700 font-bold">{formatCurrency(s.monto_apertura)}</td>
                    <td className="p-4 text-right text-slate-600">{s.estado === 'Cerrada' ? formatCurrency(s.monto_cierre_calculado) : '---'}</td>
                    <td className="p-4 text-right text-slate-800 font-bold">{s.estado === 'Cerrada' ? formatCurrency(s.monto_cierre_declarado) : '---'}</td>
                    <td className={`p-4 text-right font-black ${isDescuadre ? (diff < 0 ? 'text-rose-600' : 'text-amber-500') : 'text-emerald-500'}`}>
                      {s.estado === 'Cerrada' ? formatCurrency(diff) : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* =========================================
 * PESTAÑA: HISTORIAL DE EGRESOS (Solo Admin)
 * ========================================= */
const HistorialEgresosTab = ({ isSessionActive, setIsCashRegisterOpen, user: propUser }) => {
  const toast = useToast();
  const { user: authUser, checkSession } = useAuth();
  const user = propUser || authUser;
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [rejectExpenseId, setRejectExpenseId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Estado para el límite de egreso configurable
  const [limiteEgreso, setLimiteEgreso] = useState(user?.limiteEgresoTendero || 150000);
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/caja/egresos');
      if (res.data.success) {
        setExpenses(res.data.expenses);
      }
    } catch (error) {
      toast.error('Error al cargar egresos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/caja/egreso/${id}/aprobar`);
      toast.success('Egreso aprobado');
      fetchExpenses();
    } catch (error) {
      toast.error('Error al aprobar.');
    }
  };

  const handleRejectClick = (id) => {
    setRejectExpenseId(id);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectExpenseId) return;
    try {
      await axios.put(`/api/caja/egreso/${rejectExpenseId}/rechazar`, { notas_admin: rejectReason });
      toast.success('Egreso rechazado');
      setRejectExpenseId(null);
      fetchExpenses();
    } catch (error) {
      toast.error('Error al rechazar.');
    }
  };

  const handleSaveLimit = async () => {
    if (savingLimit) return;
    try {
      setSavingLimit(true);
      const res = await axios.put(`/api/tienda/update/${user.tiendaId}`, { limite_egreso_tendero: limiteEgreso });
      if (res.data.success) {
        toast.success('Límite actualizado correctamente');
        if (typeof checkSession === 'function') {
          await checkSession(); // Actualiza el contexto global
        }
      }
    } catch (error) {
      console.error('Error al actualizar límite:', error);
      toast.error(error.response?.data?.error || error.message || 'Error al actualizar límite');
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6 border-b border-slate-100 pb-6">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-800">Gestión de Egresos</h2>
          
          <div className="flex flex-wrap items-center gap-4">
             <button
               type="button"
               onClick={() => {
                 if (!isSessionActive) {
                   toast.error('Debes abrir la caja antes de registrar un egreso.');
                   if (setIsCashRegisterOpen) setIsCashRegisterOpen(true);
                   return;
                 }
                 setIsExpenseModalOpen(true);
               }}
               className="h-11 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 whitespace-nowrap active:scale-95"
             >
               <DollarSign size={16} /> Registrar Egreso
             </button>

             <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
               <div className="flex flex-col">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Límite para Tenderos</label>
                 <div className="relative mt-1">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                   <input 
                     type="number" 
                     value={limiteEgreso}
                     onChange={(e) => setLimiteEgreso(e.target.value)}
                     className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 w-32 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                   />
                 </div>
               </div>
               <button 
                 type="button"
                 onClick={handleSaveLimit} 
                 disabled={savingLimit || !limiteEgreso}
                 className="h-10 mt-1 sm:mt-5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
               >
                 {savingLimit ? 'Guardando...' : 'Guardar'}
               </button>
             </div>
          </div>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-center text-slate-400 font-bold py-8 uppercase tracking-widest text-sm">No hay egresos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">
                <th className="p-4">Fecha</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Motivo</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Evidencia</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {expenses.map((e) => (
                <tr key={e.id_egreso} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500 text-xs">
                     {new Date(e.fecha_registro).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}<br/>
                     <span className="text-[10px]">{new Date(e.fecha_registro).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="p-4">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        e.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-700' : e.estado === 'Rechazado' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                     }`}>
                        {e.estado}
                     </span>
                  </td>
                  <td className="p-4 text-slate-700">{e.usuario_nombre}</td>
                  <td className="p-4 text-slate-600 font-bold">{e.categoria}</td>
                  <td className="p-4 text-slate-500 max-w-[200px] truncate" title={e.motivo}>{e.motivo}</td>
                  <td className="p-4 text-right font-black text-rose-500">${Number(e.monto).toLocaleString('es-CO')}</td>
                  <td className="p-4 text-center">
                    {e.foto_soporte ? (
                      <button onClick={() => setPreviewImage(e.foto_soporte)} className="text-indigo-500 hover:text-indigo-700 underline text-xs font-bold uppercase tracking-widest">
                        Ver Foto
                      </button>
                    ) : (
                      <span className="text-slate-300 text-xs italic">Sin Foto</span>
                    )}
                  </td>
                  <td className="p-4 text-center flex justify-center items-center gap-2">
                    {e.estado === 'Registrado' ? (
                      <>
                        <button onClick={() => handleApprove(e.id_egreso)} className="bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">Aprobar</button>
                        <button onClick={() => handleRejectClick(e.id_egreso)} className="bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">Rechazar</button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                          Por: {e.admin_nombre || 'Desconocido'}
                        </span>
                        {e.notas_admin && (
                          <span className="text-[10px] text-rose-500 italic truncate max-w-[100px]" title={e.notas_admin}>
                            Nota: {e.notas_admin}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Preview Foto */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
           <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
             <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white hover:text-rose-400 bg-black/50 p-2 rounded-full transition-colors z-10"><X size={24}/></button>
             <img src={previewImage} alt="Evidencia" className="rounded-2xl max-w-full max-h-[85vh] object-contain shadow-2xl" />
           </div>
        </div>
      )}

      {/* Modal Registrar Egreso */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseRegistered={fetchExpenses}
        user={user}
      />

      {/* Modal Rechazar Egreso */}
      {rejectExpenseId && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg">Rechazar Egreso</h3>
                <p className="text-rose-100 text-xs font-medium">Por favor indica el motivo del rechazo.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Motivo del rechazo (Opcional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: El recibo no es válido, monto incorrecto..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 focus:bg-white transition-colors resize-none h-24 font-medium text-slate-700 placeholder-slate-400"
                ></textarea>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectExpenseId(null)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 hover:-translate-y-0.5 transition-all"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
