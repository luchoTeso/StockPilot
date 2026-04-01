import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createPortal } from 'react-dom';
import CustomSelect from '../components/CustomSelect';
import CustomDatePicker from '../components/CustomDatePicker';
import Tooltip from '../components/Tooltip';
import { SYNC_EVENTS, emitSyncEvent, subscribeToSync } from '../utils/stockSync';

const ProductosPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = user?.rol === 'Administrador';

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [categorias, setCategorias] = useState([]);

  // Alerta Global de Stock
  const [alert, setAlert] = useState({ show: false, title: '', message: '', isCritical: false });

  // Modal Agregar / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    id_producto: '',
    codigo: '',
    nombre_producto: '',
    categoria: '',
    subcategoria: '',
    tipo_producto: '',
    precio_unitario: '',
    cantidad: '',
    stock_minimo: '5',
    stock_seguridad: '0',
    lead_time: '3',
    fecha_vencimiento: '',
    id_proveedor: ''
  });

  const [proveedores, setProveedores] = useState([]);

  // Modal Venta
  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [ventaLoading, setVentaLoading] = useState(false);
  const [ventaProducto, setVentaProducto] = useState({});
  const [cantidadVender, setCantidadVender] = useState('');

  // Cálculo a prueba de fallos para la venta total
  const ventaTotalCalculado = useMemo(() => {
    if (!ventaProducto) return 0;
    
    // Obtenemos cantidad 
    const qty = parseInt(cantidadVender, 10);
    const qtyValid = isNaN(qty) ? 0 : qty;
    
    // Obtenemos precio de forma estricta (puede venir de 'precio' o 'precio_unitario')
    let rawPrice = 0;
    if (ventaProducto.precio !== undefined && ventaProducto.precio !== null) {
      rawPrice = ventaProducto.precio;
    } else if (ventaProducto.precio_unitario !== undefined && ventaProducto.precio_unitario !== null) {
      rawPrice = ventaProducto.precio_unitario;
    }
    
    const prc = parseFloat(rawPrice);
    const prcValid = isNaN(prc) ? 0 : prc;
    
    return qtyValid * prcValid;
  }, [cantidadVender, ventaProducto]);

  // Modal Agregar Stock
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockProducto, setStockProducto] = useState(null);
  const [cantidadStock, setCantidadStock] = useState('');

  // Cálculo inteligente de nivel de stock (alineado con módulo IA)
  const calcNivelStock = (p) => {
    const velocity = p.velocity || 0; // ventas/día (últimos 30 días)
    const leadTime = p.lead_time || 3;
    const stockSeguridad = p.stock_seguridad || 0;
    const stockMinimo = p.stock_minimo || 5;
    const rop = (velocity * leadTime) + stockSeguridad; // Punto de reorden
    const umbralCritico = Math.max(stockSeguridad, Math.ceil(velocity * 2)); // < 2 días de venta
    const umbralBajo = Math.max(rop, stockMinimo); // Por debajo del ROP o stock_minimo

    if (p.cantidad <= umbralCritico) return 'critico';
    if (p.cantidad <= umbralBajo) return 'bajo';
    return 'ok';
  };

  // Modal Toggle Estado
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggleProducto, setToggleProducto] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Modal Eliminar
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [eliminarProductoSel, setEliminarProductoSel] = useState(null);
  const [eliminarLoading, setEliminarLoading] = useState(false);

  useEffect(() => {
    cargarProductos();
    fetchProveedores();

    // Suscribirse a eventos de sincronización (Punto 2: Tiempo Real)
    const unsubscribe = subscribeToSync((event) => {
      // Si recibimos un evento de stock o producto, refrescamos la lista
      if (
        event.type === SYNC_EVENTS.STOCK_UPDATED || 
        event.type === SYNC_EVENTS.SALE_COMPLETED || 
        event.type === SYNC_EVENTS.PRODUCT_MODIFIED
      ) {
        cargarProductos();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await axios.get('/api/proveedores');
      if (res.data.success) setProveedores(res.data.data);
    } catch (e) {
      console.error('Error cargando proveedores:', e);
    }
  };

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/productos');
      setProductos(data);

      // Extraer categorias
      const cats = Array.from(new Set(data.map(p => p.categoria).filter(Boolean)));
      setCategorias(cats);

      // Comprobar Alertas de Stock
      verificarStock(data);
    } catch (err) {
      console.error('Error cargando productos', err);
    } finally {
      setLoading(false);
    }
  };

  const verificarStock = (lista) => {
    const activos = lista.filter(p => p.estado === 'Disponible');
    const criticos = activos.filter(p => calcNivelStock(p) === 'critico');
    const bajos = activos.filter(p => calcNivelStock(p) === 'bajo');

    if (criticos.length > 0 || bajos.length > 0) {
      if (criticos.length > 0) {
        setAlert({
          show: true,
          isCritical: true,
          title: '🚨 ¡Atención! Productos agotándose',
          message: `${criticos.length} producto(s) a punto de agotarse y ${bajos.length} que deberías pedir ya.`
        });
      } else {
        setAlert({
          show: true,
          isCritical: false,
          title: '⚠️ REVISA TU INVENTARIO',
          message: `${bajos.length} producto(s) se están agotando, deberías ir pensando en comprar más.`
        });
      }
    } else {
      setAlert({ show: false });
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '---';
    const raw = fechaString.split('T')[0];
    const [year, month, day] = raw.split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return raw;
  };

  const handleOpenModal = (producto = null) => {
    if (producto) {
      setEditMode(true);
      setFormData({
        id_producto: producto.id_producto,
        codigo: producto.codigo || '',
        nombre_producto: producto.nombre_producto || '',
        categoria: producto.categoria || '',
        subcategoria: producto.subcategoria || '',
        tipo_producto: producto.tipo_producto || '',
        precio_unitario: producto.precio_unitario || '',
        cantidad: producto.cantidad || '',
        stock_minimo: producto.stock_minimo ?? '5',
        stock_seguridad: producto.stock_seguridad ?? '0',
        lead_time: producto.lead_time ?? '3',
        fecha_vencimiento: producto.fecha_vencimiento ? producto.fecha_vencimiento.split('T')[0] : '',
        id_proveedor: producto.id_proveedor || ''
      });
    } else {
      setEditMode(false);
      setFormData({
        id_producto: '', codigo: '', nombre_producto: '', categoria: '',
        subcategoria: '', tipo_producto: '', precio_unitario: '', cantidad: '',
        stock_minimo: '5', stock_seguridad: '0', lead_time: '3',
        fecha_vencimiento: '', id_proveedor: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const endpoint = editMode ? `/api/productos/${formData.id_producto}` : '/api/productos/admin';
      const method = editMode ? 'PUT' : 'POST';

      const payload = { ...formData };
      payload.precio = parseFloat(payload.precio_unitario);
      delete payload.precio_unitario;
      payload.cantidad = parseInt(payload.cantidad, 10);
      payload.stock_minimo = parseInt(payload.stock_minimo, 10) || 5;
      payload.stock_seguridad = parseInt(payload.stock_seguridad, 10) || 0;
      payload.lead_time = parseInt(payload.lead_time, 10) || 3;

      const response = await axios({ method, url: endpoint, data: payload });

      if (response.data.success || response.data.message) {
        toast.success(response.data.message || 'Operación exitosa');
        handleCloseModal();
        cargarProductos();
        // Emitir sincronización
        emitSyncEvent(SYNC_EVENTS.PRODUCT_MODIFIED, { id: formData.id_producto });
      }
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  // ----- Acciones por Fila -----
  const abrirModalStock = (producto) => {
    setStockProducto(producto);
    setCantidadStock('');
    setStockModalOpen(true);
  };

  const submitAgregarStock = async (e) => {
    e.preventDefault();
    const num = parseInt(cantidadStock, 10);
    if (isNaN(num) || num <= 0) return toast.warning('La cantidad ingresada no es válida');

    setStockLoading(true);
    try {
      const { data } = await axios.put(`/api/productos/agregar/${stockProducto.id_producto}`, { cantidad: num });
      if (data.message) {
        toast.success(data.message || 'Stock agregado correctamente');
        setStockModalOpen(false);
        cargarProductos();
        // Emitir sincronización
        emitSyncEvent(SYNC_EVENTS.STOCK_UPDATED, { id: stockProducto.id_producto });
      }
    } catch (err) {
      toast.error('No se pudo agregar stock. Intenta nuevamente.');
    } finally {
      setStockLoading(false);
    }
  };

  const abrirModalToggle = (producto) => {
    if (!isAdmin) return toast.warning('No tienes permisos para esta acción.');
    setToggleProducto(producto);
    setToggleModalOpen(true);
  };

  const submitToggleEstado = async () => {
    setToggleLoading(true);
    const actualIsActivo = toggleProducto.estado === 'Disponible';
    const verbo = actualIsActivo ? 'inhabilitar' : 'habilitar';

    try {
      const endpoint = `/api/productos/${verbo}/${toggleProducto.id_producto}`;
      const { data } = await axios.put(endpoint);
      toast.success(data.message || 'Estado del producto actualizado');
      setToggleModalOpen(false);
      cargarProductos();
      // Emitir sincronización
      emitSyncEvent(SYNC_EVENTS.PRODUCT_MODIFIED, { id: toggleProducto.id_producto });
    } catch (err) {
      toast.error(`Error al ${verbo} el producto`);
    } finally {
      setToggleLoading(false);
    }
  };

  const abrirModalEliminar = (producto) => {
    if (!isAdmin) return toast.warning('No tienes permisos para eliminar productos.');
    setEliminarProductoSel(producto);
    setEliminarModalOpen(true);
  };

  const submitEliminar = async () => {
    setEliminarLoading(true);
    try {
      const { data } = await axios.delete(`/api/productos/${eliminarProductoSel.id_producto}`);
      toast.success(data.message || 'Producto eliminado permanentemente');
      setEliminarModalOpen(false);
      cargarProductos();
      // Emitir sincronización
      emitSyncEvent(SYNC_EVENTS.PRODUCT_MODIFIED);
    } catch (err) {
      toast.error('Error al eliminar el producto');
    } finally {
      setEliminarLoading(false);
    }
  };

  const registrarVenta = (producto) => {
    setVentaProducto(producto);
    setCantidadVender('');
    setVentaModalOpen(true);
  };

  const submitVenta = async (e) => {
    e.preventDefault();
    const cant = parseInt(cantidadVender, 10);
    if (!cant || cant <= 0) return toast.warning('Ingresa una cantidad válida para la venta');
    if (cant > ventaProducto.cantidad) return toast.warning(`Stock insuficiente. Solo hay ${ventaProducto.cantidad} unidades.`);

    setVentaLoading(true);
    try {
      const { data } = await axios.post('/api/registrar-venta', {
        id_producto: ventaProducto.id_producto,
        cantidad: cant
      });
      toast.success(data.message || 'Venta registrada con éxito');
      setVentaModalOpen(false);
      cargarProductos();
      // Emitir sincronización
      emitSyncEvent(SYNC_EVENTS.SALE_COMPLETED, { id: ventaProducto.id_producto });
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setVentaLoading(false);
    }
  };

  // ----- Filtrado -----
  const listRender = useMemo(() => {
    return productos.filter(p => {
      const matchText = p.nombre_producto.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                        (p.codigo && p.codigo.toLowerCase().includes(filtroTexto.toLowerCase()));
      const matchCat = filtroCategoria === '' || p.categoria === filtroCategoria;
      const matchEst = filtroEstado === '' || p.estado === filtroEstado;
      return matchText && matchCat && matchEst;
    });
  }, [productos, filtroTexto, filtroCategoria, filtroEstado]);

  return (
    <div className="animate-fade-in pb-12 space-y-8 font-outfit">
      {/* Alerta Global Premium (Floating Glass) */}
      {alert.show && (
        <div 
          onClick={() => navigate('/alertas')}
          className={`group relative flex flex-col md:flex-row items-center gap-6 p-8 rounded-[2.5rem] mb-10 shadow-2xl border backdrop-blur-xl animate-fade-in cursor-pointer hover:shadow-indigo-500/10 transition-all transform hover:-translate-y-1 ${alert.isCritical ? 'bg-rose-50/80 border-rose-100 text-rose-800' : 'bg-amber-50/80 border-amber-100 text-amber-800'}`}
        >
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shadow-lg border-2 ${alert.isCritical ? 'bg-rose-100 border-white text-rose-600 animate-bounce' : 'bg-amber-100 border-white text-amber-600 rotate-12'}`}>
            {alert.isCritical ? '🚨' : '⚠️'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tighter italic mb-1">{alert.title}</h4>
            <p className="font-bold text-sm opacity-80 leading-relaxed max-w-2xl">{alert.message}</p>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden md:inline-block text-[10px] font-black uppercase tracking-[0.2em] bg-white/50 px-4 py-2 rounded-xl">Revisar Ahora →</span>
             <button 
                onClick={(e) => { e.stopPropagation(); setAlert({ show: false }); }} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-black/5 transition-all font-black text-2xl hover:scale-110 active:scale-90"
                title="Cerrar"
             >
                &times;
             </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Tus Productos</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Listado completo de lo que vendes</p>
        </div>
        <div>
          {isAdmin && (
            <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95">
              <span>➕</span> Registrar Producto
            </button>
          )}
        </div>
      </div>

      {/* Top Bar (Filtros) */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap gap-4">
          <input type="text" placeholder="Buscar código o nombre..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none w-full md:w-auto" />
          <CustomSelect 
            value={filtroCategoria} 
            onChange={val => setFiltroCategoria(val)}
            placeholder="Todas las categorías"
            options={[
              { value: '', label: 'Todas las categorías' },
              ...categorias.map(c => ({ value: c, label: c }))
            ]}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800 min-w-[200px]"
          />
          <CustomSelect 
            value={filtroEstado} 
            onChange={e => setFiltroEstado(e.target.value)}
            placeholder="Estado: Todos"
            options={[
              { value: '', label: 'Estado: Todos' },
              { value: 'Disponible', label: 'Operativo' },
              { value: 'Inactivo', label: 'Suspendido' }
            ]}
            className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800 min-w-[200px]"
          />
      </div>

      {/* Tabla Premium */}
      <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                <th className="p-8">Producto</th>
                <th className="p-8">Categoría</th>
                <th className="p-8 text-center whitespace-nowrap">En Bodega</th>
                <th className="p-8 text-center">Estado</th>
                <th className="p-8 text-center">Registro</th>
                <th className="p-8 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse whitespace-nowrap">Consultando Bóveda...</td></tr>
              ) : listRender.length === 0 ? (
                <tr><td colSpan="6" className="p-32 text-center text-slate-400 font-bold italic whitespace-nowrap">No hay productos en esta vista.</td></tr>
              ) : (
                listRender.map(p => {
                  const isActive = p.estado === 'Disponible';
                  const nivelStock = calcNivelStock(p);
                  const isCritico = nivelStock === 'critico';
                  const isBajo = nivelStock === 'bajo';

                  return (
                    <tr key={p.id_producto} className={`group transition-all hover:bg-slate-50 ${!isActive ? 'opacity-50 grayscale' : ''}`}>
                      <td className="p-6">
                         <p className="font-black text-slate-800 text-sm">{p.nombre_producto}</p>
                         <p className="text-[10px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Ref: {p.codigo || 'S/N'}</p>
                      </td>
                      <td className="p-6">
                        <span className="inline-block whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[9px] font-black uppercase tracking-widest">{p.categoria || 'Sin Info'}</span>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <span className={`text-xl font-black tracking-tighter ${isCritico ? 'text-rose-600' : isBajo ? 'text-amber-500' : 'text-slate-800'}`}>{p.cantidad}</span>
                           {isCritico && <button onClick={() => navigate('/analisis-detallado')} title="Riesgo de agotamiento inminente" className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-rose-200 shadow-sm animate-pulse hover:bg-rose-200 hover:scale-105 transition-all cursor-pointer">Agotado</button>}
                           {isBajo && <button onClick={() => navigate('/analisis-detallado')} title="El stock ha bajado del nivel seguro para operar" className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-200 hover:scale-105 transition-all cursor-pointer">Pedir Más</button>}
                           {!isCritico && !isBajo && isActive && <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">Suficiente</span>}
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">ud</p>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {isActive ? 'Activo' : 'Pausado'}
                        </span>
                      </td>
                      <td className="p-6 text-center font-bold text-slate-600 text-xs">
                        {formatearFecha(p.fecha_entrada)}
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isActive ? (
                            <>
                              <button onClick={() => registrarVenta(p)} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95" title="Registrar Venta Directa">💲</button>
                              <button onClick={() => abrirModalStock(p)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95" title="Ingresar Stock">📦</button>
                              
                              {isAdmin && (
                                <>
                                   <div className="w-px h-8 bg-slate-200 mx-1"></div>
                                   <button onClick={() => handleOpenModal(p)} className="text-[10px] px-3 py-2 font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">Editar</button>
                                   <button onClick={() => abrirModalToggle(p)} className="text-[10px] px-3 py-2 font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 rounded-xl transition-all">Pausar</button>
                                   <button onClick={() => abrirModalEliminar(p)} className="text-[10px] px-3 py-2 font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl transition-all">Borrar</button>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {isAdmin && <button onClick={() => abrirModalToggle(p)} className="text-[10px] px-4 py-2 font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm">Reactivar</button>}
                              {isAdmin && <button onClick={() => abrirModalEliminar(p)} className="text-[10px] px-4 py-2 font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all ml-2">Eliminar</button>}
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

      {/* Modal Agregar/Editar */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-premium shadow-2xl animate-scale-in relative z-10 transition-all">
            <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">{editMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
              <button onClick={handleCloseModal} className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-500 hover:border-rose-100 flex items-center justify-center text-xl transition-all shadow-sm">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código (Referencia)</label>
                  <input required type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Producto</label>
                  <input required type="text" value={formData.nombre_producto} onChange={e => setFormData({...formData, nombre_producto: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                  <CustomSelect 
                    value={formData.categoria} 
                    onChange={val => setFormData({...formData, categoria: val})}
                    placeholder="Seleccione..."
                    options={[
                      { value: '', label: 'Seleccione...' },
                      { value: 'Alimentos Secos', label: 'Alimentos Secos' },
                      { value: 'Lácteos', label: 'Lácteos' },
                      { value: 'Aseo', label: 'Aseo' },
                      { value: 'Bebidas', label: 'Bebidas' },
                      { value: 'Carnes', label: 'Carnes' },
                      { value: 'Frutas y Verduras', label: 'Frutas y Verduras' },
                      { value: 'Panadería', label: 'Panadería' },
                      { value: 'Otros', label: 'Otros' }
                    ]}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus-within:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subcategoría <span className="text-slate-400">(Opcional)</span></label>
                  <input type="text" value={formData.subcategoria} onChange={e => setFormData({...formData, subcategoria: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Empaque / Venta</label>
                  <CustomSelect 
                    value={formData.tipo_producto} 
                    onChange={val => setFormData({...formData, tipo_producto: val})}
                    placeholder="Seleccione tipo..."
                    options={[
                      { value: '', label: 'Seleccione tipo...' },
                      { value: 'Perecedero', label: '🍎 Perecedero' },
                      { value: 'No Perecedero', label: '📦 No Perecedero' },
                      { value: 'Digital', label: '💻 Digital' }
                    ]}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus-within:border-indigo-500 transition-all"
                  />
                </div>
                {formData.tipo_producto === 'Perecedero' && (
                  <div className="space-y-2 animate-bounce-in relative">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Fecha de Vencimiento 📅</label>
                    <CustomDatePicker 
                      value={formData.fecha_vencimiento} 
                      onChange={v => setFormData({...formData, fecha_vencimiento: v})} 
                      placeholder="Seleccionar vencimiento..." 
                      align="left-flyout"
                    />
                  </div>
                )}
                {formData.tipo_producto !== 'Perecedero' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detalles Adicionales <span className="text-slate-400">(Opcional)</span></label>
                    <input type="text" value={formData.subcategoria} onChange={e => setFormData({...formData, subcategoria: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all" placeholder="Ej: Pack x6, 500ml..." />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Precio de Venta</label>
                  <input required type="number" step="0.01" min="0" value={formData.precio_unitario} onChange={e => setFormData({...formData, precio_unitario: e.target.value})} className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-lg font-black text-indigo-700 focus:border-indigo-500 outline-none transition-all" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Stock Inicial</label>
                  <input required type="number" min="0" disabled={editMode} value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} className={`w-full p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-lg font-black text-emerald-700 outline-none transition-all ${editMode ? 'opacity-50 cursor-not-allowed' : 'focus:border-emerald-500'}`} placeholder="0" />
                  {editMode && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase mt-1 inline-block">🔒 Protegido. Usar botón de agregar inventario.</span>}
                </div>
              </div>

              {/* Sección Avanzada: Configuración de Reabastecimiento (solo Admin) */}
              {isAdmin && (
                <div className="mb-8">
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer select-none py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">⚙️ Configuración de Alertas</span>
                      <span className="ml-auto text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-4 p-5 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-5">
                      <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                        Estos valores determinan cómo la IA y el motor de alertas evalúan el estado de este producto. Si no los configuras, se usarán los valores por defecto.
                      </p>
                      
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">📦 Proveedor Principal (Opcional)</label>
                          <CustomSelect 
                            value={formData.id_proveedor} 
                            onChange={val => setFormData({...formData, id_proveedor: val})}
                            placeholder="Seleccione proveedor..."
                            options={[
                              { value: '', label: 'Ninguno / Sin asignar' },
                              ...proveedores.map(prov => ({ 
                                value: prov.id_proveedor, 
                                label: `${prov.nombre_empresa} (${prov.contacto_principal})` 
                              }))
                            ]}
                            className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
                          />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                            Cantidad Mínima
                            <Tooltip text="Cantidad mínima antes de activar alerta amarilla (Pedir más)">
                              <span className="text-slate-400/80 hover:text-indigo-500 font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow hover:-translate-y-0.5" >i</span>
                            </Tooltip>
                          </label>
                          <input type="number" min="0" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: e.target.value})} className="w-full p-3 bg-white border border-amber-200 rounded-xl text-sm font-black text-amber-700 focus:border-amber-500 outline-none text-center transition-all" />
                          <p className="text-[8px] text-slate-400 font-bold text-center">Avisa cuándo comprar</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                            Stock de Emergencia
                            <Tooltip text="Colchón de emergencia. Si baja de aquí, se activa alerta roja (Agotado)">
                              <span className="text-slate-400/80 hover:text-indigo-500 font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow hover:-translate-y-0.5" >i</span>
                            </Tooltip>
                          </label>
                          <input type="number" min="0" value={formData.stock_seguridad} onChange={e => setFormData({...formData, stock_seguridad: e.target.value})} className="w-full p-3 bg-white border border-rose-200 rounded-xl text-sm font-black text-rose-600 focus:border-rose-500 outline-none text-center transition-all" />
                          <p className="text-[8px] text-slate-400 font-bold text-center">Avisa riesgo de quiebre</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                            Días para recibir pedido
                            <Tooltip text="Días que tarda el proveedor en entregarte este producto" align="right">
                              <span className="text-slate-400/80 hover:text-indigo-500 font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow hover:-translate-y-0.5" >i</span>
                            </Tooltip>
                          </label>
                          <input type="number" min="1" value={formData.lead_time} onChange={e => setFormData({...formData, lead_time: e.target.value})} className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm font-black text-indigo-600 focus:border-indigo-500 outline-none text-center transition-all" />
                          <p className="text-[8px] text-slate-400 font-bold text-center">Días de entrega</p>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              <div className="flex gap-4 pt-8 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={formLoading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {formLoading ? 'Sincronizando...' : editMode ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Registrar Venta Directa */}
      {ventaModalOpen && ventaProducto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-6 bg-indigo-600 text-white">
              <h3 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">💲 Venta Exprés</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Caja Rápida</p>
            </div>
            <form onSubmit={submitVenta} className="p-6">
              <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Producto a vender</p>
                <p className="font-black text-slate-800 uppercase line-clamp-1">{ventaProducto.nombre_producto}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Cantidad disponible</p>
                  <p className="text-xl font-black text-emerald-800">{ventaProducto.cantidad} <span className="text-xs opacity-60">u</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Unitario</p>
                  <p className="text-xl font-black text-slate-800">${parseFloat(ventaProducto.precio ?? ventaProducto.precio_unitario ?? 0).toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 block mb-2">Cantidad a vender</label>
                <input required type="number" min="1" max={ventaProducto.cantidad} value={cantidadVender} onChange={e => setCantidadVender(e.target.value)} className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl text-2xl font-black text-center text-indigo-600 focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="1" autoFocus />
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

              <div className="flex gap-4">
                <button type="button" onClick={() => setVentaModalOpen(false)} className="py-4 px-6 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Anular</button>
                <button type="submit" disabled={ventaLoading || !cantidadVender} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                  {ventaLoading ? 'Procesando...' : 'Autorizar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inyección  Stock */}
      {stockModalOpen && stockProducto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-8 bg-emerald-500 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 backdrop-blur-sm">📦</div>
              <h3 className="text-2xl font-black tracking-tighter uppercase italic">Agregar Inventario</h3>
            </div>
            <form onSubmit={submitAgregarStock} className="p-8">
              <p className="text-center font-bold text-slate-500 text-sm mb-6 uppercase tracking-widest">
                Producto: <span className="text-slate-800 font-black">{stockProducto.nombre_producto}</span>
              </p>
              
              <div className="mb-6 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad en bodega</span>
                 <span className="text-xl font-black text-slate-800">{stockProducto.cantidad} <span className="text-xs opacity-50 uppercase tracking-widest">ud</span></span>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 block mb-2 text-center">Cantidad a agregar</label>
                <input required type="number" min="1" value={cantidadStock} onChange={e => setCantidadStock(e.target.value)} className="w-full p-6 text-center text-4xl font-black text-emerald-600 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl focus:border-emerald-500 outline-none transition-all" placeholder="0" autoFocus />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStockModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={stockLoading || !cantidadStock} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
                  {stockLoading ? 'Sincronizando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Toggle Estado */}
      {toggleModalOpen && toggleProducto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl animate-scale-in p-8 text-center">
             <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl ${toggleProducto.estado === 'Disponible' ? 'bg-amber-100 text-amber-500 shadow-amber-100/50' : 'bg-emerald-100 text-emerald-500 shadow-emerald-100/50'}`}>
                {toggleProducto.estado === 'Disponible' ? '⏸️' : '✅'}
             </div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-2">Estado del Producto</h3>
             <p className="text-xs font-bold text-slate-500 mb-8 border-b border-slate-100 pb-8">
                Vas a cambiar a estado <strong className={`uppercase ${toggleProducto.estado === 'Disponible' ? 'text-amber-500' : 'text-emerald-500'}`}>{toggleProducto.estado === 'Disponible' ? 'Pausado' : 'Activo'}</strong> el siguiente producto: <br/><strong className="text-slate-800 mt-2 block">{toggleProducto.nombre_producto}</strong>
             </p>

              <div className="flex gap-4">
                <button type="button" onClick={() => setToggleModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="button" onClick={submitToggleEstado} disabled={toggleLoading} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all ${toggleProducto.estado === 'Disponible' ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' : 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600'}`}>
                  {toggleLoading ? '...' : 'Confirmar'}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {eliminarModalOpen && eliminarProductoSel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl animate-scale-in p-8 text-center border-4 border-rose-100">
             <div className="w-20 h-20 rounded-3xl bg-rose-100 text-rose-600 shadow-xl shadow-rose-100/50 mx-auto flex items-center justify-center text-4xl mb-6">🗑️</div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-2">Eliminar Producto</h3>
             <p className="text-xs font-bold text-slate-500 mb-6">Vas a eliminar permanentemente este producto. Esta acción <span className="text-rose-600 font-black uppercase underline decoration-2 underline-offset-2">no se puede deshacer</span>.</p>
             <div className="bg-rose-50 text-rose-700 font-black p-4 rounded-2xl border border-rose-100 mb-8 uppercase line-clamp-2">
                {eliminarProductoSel.nombre_producto}
             </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setEliminarModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="button" onClick={submitEliminar} disabled={eliminarLoading} className="flex-[1.5] py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50">
                  {eliminarLoading ? 'Borrando...' : 'Eliminar'}
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosPage;
