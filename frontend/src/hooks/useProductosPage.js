import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SYNC_EVENTS, emitSyncEvent, subscribeToSync } from '../utils/stockSync';
import { fetchProductFromOpenFoodFacts } from '../utils/openFoodFacts';
import useBarcodeScanner from './useBarcodeScanner';

export const useProductosPage = () => {
  const { user } = useAuth();
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

  // Escáner de Cámara
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  // Modal Agregar / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [proveedores, setProveedores] = useState([]);

  // Modal Venta
  const [ventaModalOpen, setVentaModalOpen] = useState(false);
  const [ventaLoading, setVentaLoading] = useState(false);
  const [ventaProducto, setVentaProducto] = useState(null);

  // Modal Agregar Stock
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockProducto, setStockProducto] = useState(null);

  // Modal Confirmar Toggle Estado
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggleProducto, setToggleProducto] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Modal Eliminar
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [eliminarProductoSel, setEliminarProductoSel] = useState(null);
  const [eliminarLoading, setEliminarLoading] = useState(false);

  // Upload
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchProveedores = useCallback(async (signal = null) => {
    try {
      const res = await axios.get('/api/proveedores', { ...(signal && { signal }) });
      if (signal && signal.aborted) return;
      if (res.data.success) setProveedores(res.data.data);
    } catch (e) {
      if (axios.isCancel(e) || (signal && signal.aborted)) return;
      console.error('Error cargando proveedores:', e);
    }
  }, []);

  const verificarStock = useCallback((prodList) => {
    let itemsAgotados = [];
    let itemsPorPedir = [];

    prodList.forEach(p => {
      const isActivo = p.estado === 'Disponible';
      if (!isActivo) return;

      const velocity = p.velocity || 0;
      const leadTime = p.lead_time || 3;
      const stockSeguridad = p.stock_seguridad || 0;
      const stockMinimo = p.stock_minimo || 5;

      const rop = (velocity * leadTime) + stockSeguridad;
      const umbralCritico = Math.max(stockSeguridad, Math.ceil(velocity * 2));
      const umbralBajo = Math.max(rop, stockMinimo);

      if (p.cantidad <= umbralCritico) itemsAgotados.push(p.nombre_producto);
      else if (p.cantidad <= umbralBajo) itemsPorPedir.push(p.nombre_producto);
    });

    if (itemsAgotados.length > 0) {
      setAlert({
        show: true,
        title: '¡Riesgo de Quiebre Inminente!',
        message: `${itemsAgotados.length} producto(s) en nivel crítico (${itemsAgotados.slice(0,3).join(', ')}${itemsAgotados.length > 3 ? '...' : ''}).`,
        isCritical: true
      });
    } else if (itemsPorPedir.length > 0) {
      setAlert({
        show: true,
        title: 'Atención Sugerida',
        message: `Es recomendable solicitar stock para ${itemsPorPedir.length} producto(s).`,
        isCritical: false
      });
    } else {
      setAlert({ show: false, title: '', message: '', isCritical: false });
    }
  }, []);

  const cargarProductos = useCallback(async (signal = null) => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/productos', { ...(signal && { signal }) });
      if (signal && signal.aborted) return;
      setProductos(data);

      const cats = Array.from(new Set(data.flatMap(p => p.categoria ? [p.categoria] : [])));
      setCategorias(cats);
      verificarStock(data);
    } catch (error) {
      if (axios.isCancel(error) || (signal && signal.aborted)) return;
      toast.error('No se pudieron cargar los productos');
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, [toast, verificarStock]);

  useEffect(() => {
    const controller = new AbortController();
    cargarProductos(controller.signal);
    fetchProveedores(controller.signal);

    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === SYNC_EVENTS.STOCK_UPDATED || 
        event.type === SYNC_EVENTS.SALE_COMPLETED || 
        event.type === SYNC_EVENTS.PRODUCT_MODIFIED
      ) {
        cargarProductos();
      }
    });

    return () => {
      unsubscribe();
      controller.abort();
    };
  }, [cargarProductos, fetchProveedores]);

  const calcNivelStock = useCallback((p) => {
    const velocity = p.velocity || 0;
    const leadTime = p.lead_time || 3;
    const stockSeguridad = p.stock_seguridad || 0;
    const stockMinimo = p.stock_minimo || 5;
    const rop = (velocity * leadTime) + stockSeguridad;
    const umbralCritico = Math.max(stockSeguridad, Math.ceil(velocity * 2));
    const umbralBajo = Math.max(rop, stockMinimo);

    if (p.cantidad <= umbralCritico) return 'critico';
    if (p.cantidad <= umbralBajo) return 'bajo';
    return 'ok';
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    setUploadLoading(true);
    try {
      const res = await axios.post('/api/productos/bulk', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(`Se importaron ${res.data.processed} productos`);
        if (res.data.warnings && res.data.warnings.length > 0) {
          console.warn("Advertencias de carga masiva:", res.data.warnings);
          toast.error(`Se omitieron ${res.data.warnings.length} filas incompletas.`);
        }
        cargarProductos();
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error subiendo archivo');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleOpenModal = (producto = null) => {
    if (producto) {
      setEditMode(true);
      setFormData(producto);
    } else {
      setEditMode(false);
      setFormData(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData(null);
  };

  const handleSubmitProducto = async (data) => {
    if (formLoading) return;
    setFormLoading(true);
    try {
      if (editMode) {
        await axios.put(`/api/productos/${data.id_producto}`, data);
        toast.success('Producto actualizado');
      } else {
        await axios.post('/api/productos/admin', data);
        toast.success('Producto creado');
      }
      handleCloseModal();
      cargarProductos();
      emitSyncEvent(SYNC_EVENTS.PRODUCT_MODIFIED, { id: data.id_producto });
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const submitEliminar = async () => {
    if (eliminarLoading) return;
    setEliminarLoading(true);
    try {
      await axios.delete(`/api/productos/${eliminarProductoSel.id_producto}`);
      toast.success('Producto eliminado permanentemente');
      setEliminarModalOpen(false);
      cargarProductos();
      emitSyncEvent(SYNC_EVENTS.PRODUCT_MODIFIED, { id: eliminarProductoSel.id_producto });
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setEliminarLoading(false);
    }
  };

  const submitToggleEstado = async () => {
    if (toggleLoading) return;
    setToggleLoading(true);
    try {
      const nuevoEstado = toggleProducto.estado === 'Disponible' ? 'Inactivo' : 'Disponible';
      const action = nuevoEstado === 'Inactivo' ? 'inhabilitar' : 'habilitar';
      await axios.put(`/api/productos/${action}/${toggleProducto.id_producto}`);
      toast.success(`Producto marcado como ${nuevoEstado}`);
      setToggleModalOpen(false);
      cargarProductos();
      emitSyncEvent(SYNC_EVENTS.PRODUCT_MODIFIED, { id: toggleProducto.id_producto });
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setToggleLoading(false);
    }
  };

  const submitVenta = async (cantidadVender) => {
    if (ventaLoading) return;
    setVentaLoading(true);
    try {
      await axios.post('/api/registrar-venta', {
        id_producto: ventaProducto.id_producto,
        cantidad: parseInt(cantidadVender, 10)
      });
      toast.success('Venta registrada con éxito');
      setVentaModalOpen(false);
      cargarProductos();
      emitSyncEvent(SYNC_EVENTS.SALE_COMPLETED, { id: ventaProducto.id_producto });
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setVentaLoading(false);
    }
  };

  const submitAgregarStock = async (cantidadStock) => {
    if (stockLoading) return;
    setStockLoading(true);
    try {
      await axios.put(`/api/productos/agregar/${stockProducto.id_producto}`, { cantidad: cantidadStock });
      toast.success('Stock actualizado');
      setStockModalOpen(false);
      cargarProductos();
      emitSyncEvent(SYNC_EVENTS.STOCK_UPDATED, { id: stockProducto.id_producto });
    } catch (err) {
      toast.error(`${err.response?.data?.error || err.message}`);
    } finally {
      setStockLoading(false);
    }
  };

  const handleBarcodeScan = async (code) => {
    if (!code) return;
    if (modalOpen && !editMode) return;
    
    const existingProduct = productos.find(p => p.codigo === code);
    
    if (existingProduct) {
      setVentaProducto(existingProduct);
      setVentaModalOpen(true);
      toast.success(`Producto encontrado: ${existingProduct.nombre_producto}`);
    } else {
      toast.info('Buscando detalles del producto...');
      const apiData = await fetchProductFromOpenFoodFacts(code);
      
      setFormData({
        id_producto: '',
        codigo: code,
        nombre_producto: apiData ? apiData.nombre_producto : '',
        categoria: apiData ? apiData.categoria : '',
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
      
      setEditMode(false);
      setModalOpen(true);
      
      if (apiData) {
        toast.success('¡Datos autocompletados mágicamente!');
      } else {
        toast.info('Producto nuevo. Por favor ingresa los detalles.');
      }
    }
  };

  // El scanner local de teclado llama a handleBarcodeScan
  useBarcodeScanner(handleBarcodeScan);

  const listRender = useMemo(() => {
    const filtered = productos.filter(p => {
      const matchText = p.nombre_producto.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                        (p.codigo && p.codigo.toLowerCase().includes(filtroTexto.toLowerCase()));
      const matchCat = filtroCategoria === '' || p.categoria === filtroCategoria;
      const matchEst = filtroEstado === '' || p.estado === filtroEstado;
      return matchText && matchCat && matchEst;
    });

    return filtered.sort((a, b) => {
      if (a.estado !== b.estado) {
        return a.estado === 'Disponible' ? -1 : 1;
      }
      const nivelA = calcNivelStock(a);
      const nivelB = calcNivelStock(b);
      const pesos = { 'critico': 1, 'bajo': 2, 'ok': 3 };
      
      if (pesos[nivelA] !== pesos[nivelB]) {
        return pesos[nivelA] - pesos[nivelB];
      }
      return a.nombre_producto.localeCompare(b.nombre_producto);
    });
  }, [productos, filtroTexto, filtroCategoria, filtroEstado, calcNivelStock]);

  return {
    isAdmin,
    loading,
    productos: listRender,
    categorias,
    alert,
    setAlert,
    
    // Filtros
    filtroTexto, setFiltroTexto,
    filtroCategoria, setFiltroCategoria,
    filtroEstado, setFiltroEstado,

    // Carga Masiva
    uploadLoading,
    handleFileUpload,

    // Modales de UI
    cameraScannerOpen, setCameraScannerOpen,
    handleBarcodeScan,

    // Product Modal
    modalOpen, editMode, formLoading, formData, proveedores,
    handleOpenModal, handleCloseModal, handleSubmitProducto,

    // Venta Modal
    ventaModalOpen, setVentaModalOpen, ventaProducto, setVentaProducto, ventaLoading, submitVenta,

    // Stock Modal
    stockModalOpen, setStockModalOpen, stockProducto, setStockProducto, stockLoading, submitAgregarStock,

    // Toggle Modal
    toggleModalOpen, setToggleModalOpen, toggleProducto, setToggleProducto, toggleLoading, submitToggleEstado,

    // Eliminar Modal
    eliminarModalOpen, setEliminarModalOpen, eliminarProductoSel, setEliminarProductoSel, eliminarLoading, submitEliminar
  };
};
