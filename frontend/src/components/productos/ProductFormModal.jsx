import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Settings, Package, Search, CheckCircle2, RotateCcw, PackagePlus, AlertCircle } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import CustomDatePicker from '../CustomDatePicker';
import Tooltip from '../Tooltip';

const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  editMode,
  isAdmin,
  proveedores,
  loading,
  categorias = [],
  productos = []
}) => {
  const defaultData = {
    id_producto: '',
    codigo: '',
    codigo_barras: '',
    nombre_producto: '',
    categoria: '',
    subcategoria: '',
    tipo_producto: '',
    precio_unitario: '',
    cantidad: '',
    stock_minimo: '5',
    stock_seguridad: '0',
    lead_time: '3',
    frecuencia_compra_dias: '7',
    fecha_vencimiento: '',
    id_proveedor: ''
  };

  const [formData, setFormData] = useState(defaultData);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(null);
  const [updatedFields, setUpdatedFields] = useState([]);

  // Estados para Búsqueda Instantánea e Ingreso Unificado de Stock
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cantidadIngreso, setCantidadIngreso] = useState('');

  // Productos coincidentes para la búsqueda rápida al registrar
  const matchingProducts = useMemo(() => {
    if (!searchTerm.trim() || editMode) return [];
    const term = searchTerm.toLowerCase();
    return productos.filter(p =>
      p.nombre_producto?.toLowerCase().includes(term) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term)) ||
      (p.codigo && p.codigo.toLowerCase().includes(term))
    ).slice(0, 6);
  }, [searchTerm, productos, editMode]);

  // Detectar si el código de barras escrito manualmente ya existe en inventario
  const barcodeMatch = useMemo(() => {
    if (editMode || selectedProduct) return null;
    const barcode = formData.codigo_barras?.trim();
    if (!barcode || barcode.length < 3) return null;
    return productos.find(p => p.codigo_barras === barcode || p.codigo === barcode);
  }, [formData.codigo_barras, productos, editMode, selectedProduct]);

  const handleSelectExisting = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(prod.nombre_producto);
    setShowDropdown(false);
    setCantidadIngreso('');

    let formattedDate = prod.fecha_vencimiento || '';
    if (formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }

    setFormData({
      ...defaultData,
      ...prod,
      id_producto: prod.id_producto,
      codigo: prod.codigo || '',
      codigo_barras: prod.codigo_barras || '',
      nombre_producto: prod.nombre_producto || '',
      categoria: prod.categoria || '',
      subcategoria: prod.subcategoria || '',
      tipo_producto: prod.tipo_producto || '',
      precio_unitario: prod.precio ?? prod.precio_unitario ?? '',
      cantidad: prod.cantidad ?? '',
      stock_minimo: prod.stock_minimo?.toString() || '5',
      stock_seguridad: prod.stock_seguridad?.toString() || '0',
      lead_time: prod.lead_time?.toString() || '3',
      frecuencia_compra_dias: prod.frecuencia_compra_dias?.toString() || '7',
      fecha_vencimiento: formattedDate,
      id_proveedor: prod.id_proveedor || ''
    });
  };

  const handleResetToNewProduct = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setShowDropdown(false);
    setCantidadIngreso('');
    setFormData(defaultData);
  };

  const handleSuggestAlerts = async () => {
    setIsSuggesting(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (formData.id_producto) params.append('id_producto', formData.id_producto);
      if (formData.categoria) params.append('categoria', formData.categoria);
      if (formData.id_proveedor) params.append('id_proveedor', formData.id_proveedor);

      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ia/suggest-alerts?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.suggestions) {
        setFormData(prev => ({
          ...prev,
          stock_minimo: data.suggestions.stock_minimo.toString(),
          stock_seguridad: data.suggestions.stock_seguridad.toString(),
          lead_time: data.suggestions.lead_time.toString()
        }));
        setUpdatedFields(['stock_minimo', 'stock_seguridad', 'lead_time']);
        if (data.suggestions.nota) {
          setAiSuccess(data.suggestions.nota);
        }
      } else {
        setAiError(data.error || 'Ocurrió un problema obteniendo las sugerencias.');
      }
    } catch (e) {
      console.error(e);
      setAiError('Error de conexión al solicitar sugerencias de la IA.');
    } finally {
      setIsSuggesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAiError(null);
      setAiSuccess(null);
      setUpdatedFields([]);
      setSearchTerm('');
      setShowDropdown(false);
      setSelectedProduct(null);
      setCantidadIngreso('');

      if (initialData) {
        let formattedDate = initialData.fecha_vencimiento || '';
        if (formattedDate.includes('T')) {
          formattedDate = formattedDate.split('T')[0];
        }

        setFormData({
          ...defaultData,
          ...initialData,
          precio_unitario: initialData.precio ?? initialData.precio_unitario ?? '',
          cantidad: initialData.cantidad ?? '',
          fecha_vencimiento: formattedDate
        });
      } else {
        setFormData(defaultData);
      }
    }
    // Solo al abrir o cambiar el producto: defaultData es un objeto nuevo en cada render y reiniciaría el formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const barcode = formData.codigo_barras?.trim() || '';
    const sku = formData.codigo?.trim() || '';

    // Si se seleccionó un producto existente para sumar stock
    if (selectedProduct && !editMode) {
      const q = parseInt(cantidadIngreso, 10);
      if (isNaN(q) || q <= 0) {
        alert('Por favor ingresa cuántas unidades deseas añadir al inventario.');
        return;
      }
      onSubmit({
        isStockAddition: true,
        id_producto: selectedProduct.id_producto,
        cantidadAAgregar: q,
        precioAnterior: selectedProduct.precio ?? selectedProduct.precio_unitario ?? 0,
        ...formData,
        precio: formData.precio_unitario,
        codigo_barras: barcode,
        codigo: sku || barcode
      });
      return;
    }

    // Modo normal (Creación de producto nuevo o edición)
    onSubmit({
      isStockAddition: false,
      ...formData,
      precio: formData.precio_unitario,
      codigo_barras: barcode,
      codigo: sku || barcode
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tinta/45 backdrop-blur-sm" onClick={onClose} role="presentation" aria-hidden="true"></div>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide shadow-lg animate-scale-in relative z-10 transition-transform transition-opacity">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="titular text-2xl text-tinta">
              {editMode
                ? 'Editar Producto'
                : selectedProduct
                  ? 'Recepción de Mercancía (+Stock)'
                  : 'Registrar o Ingresar Producto'}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {selectedProduct
                ? 'Sumar existencias a un artículo ya registrado'
                : 'Escanea, busca o crea un artículo nuevo'}
            </p>
          </div>
          <button onClick={onClose} type="button" className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-lg hover:text-rose-500 hover:border-peligro-suave flex items-center justify-center text-xl transition-colors shadow-sm">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* =========================================================
           * BÚSQUEDA INSTANTÁNEA PREDICTIVA (SOLO EN MODO REGISTRO)
           * ========================================================= */}
          {!editMode && (
            <div className="mb-8 p-6 bg-azul/5 border border-azul/30 rounded-2xl relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Search size={14} className="text-azul" />
                  <span>¿Ya existe en inventario? Busca o escanea para sumar stock:</span>
                </label>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={handleResetToNewProduct}
                    className="text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-peligro bg-white px-2.5 py-1 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <RotateCcw size={10} /> Crear Nuevo Producto
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Escribe el nombre, código o escanea con pistola/cámara..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-azul/30 rounded-lg text-xs font-bold text-tinta placeholder:text-slate-500 focus:outline-none focus:border-azul focus:ring-2 focus:ring-azul/30 shadow-sm transition-all"
                />
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-azul">
                  <Search size={16} />
                </div>

                {/* Menú flotante de resultados predictivos */}
                {showDropdown && searchTerm.trim() && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden max-h-56 overflow-y-auto">
                    {matchingProducts.length > 0 ? (
                      matchingProducts.map(p => (
                        <button
                          key={p.id_producto}
                          type="button"
                          onMouseDown={() => handleSelectExisting(p)}
                          className="w-full text-left px-5 py-3.5 hover:bg-azul/5 border-b border-slate-50 flex justify-between items-center transition-colors group"
                        >
                          <div>
                            <p className="font-bold text-tinta text-xs group-hover:text-azul transition-colors">{p.nombre_producto}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {p.codigo_barras || p.codigo || 'SIN CÓDIGO'} • Stock actual: <strong className="text-exito font-sans">{p.cantidad} ud</strong>
                            </p>
                          </div>
                          <span className="font-bold text-azul text-xs">${Number(p.precio || p.precio_unitario || 0).toLocaleString('es-CO')}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs font-bold text-slate-500 mb-1">No se encontró ningún producto con ese nombre o código.</p>
                        <p className="text-xs font-bold text-azul">
                          Completa el formulario abajo para registrarlo como nuevo.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Banner de producto existente seleccionado */}
              {selectedProduct ? (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-exito text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-tinta">{selectedProduct.nombre_producto}</p>
                      <p className="text-xs font-bold text-emerald-800">
                        Stock actual en bodega: <strong className="text-sm font-bold text-exito">{selectedProduct.cantidad}</strong> unidades
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-xs font-bold bg-emerald-200 text-emerald-800 px-3 py-1 rounded-2xl">
                    Modo: Entrada de Mercancía
                  </span>
                </div>
              ) : (
                <p className="text-xs font-bold text-azul/80 mt-2 flex items-center gap-1">
                  <span>💡 Si el producto es nuevo, puedes saltarte este buscador y llenar los campos directamente abajo.</span>
                </p>
              )}
            </div>
          )}

          {/* =========================================================
           * CAMPOS PRINCIPALES (CÓDIGOS Y NOMBRE)
           * ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label htmlFor="input_codigo_barras" className="text-xs font-semibold text-slate-600 ml-1 flex justify-between items-center">
                <span>Código de Barras (EAN/UPC)</span>
                <span className="text-azul font-bold lowercase tracking-normal text-xs bg-azul/10 px-2 py-0.5 rounded border border-azul/30">obligatorio</span>
              </label>
              <input
                id="input_codigo_barras"
                required
                type="text"
                value={formData.codigo_barras || ''}
                onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-tinta focus:border-azul outline-none transition-colors"
                placeholder="Ej: 7702007031002"
              />

              {/* Alerta si el código ingresado ya pertenece a otro producto */}
              {barcodeMatch && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fade-in mt-1">
                  <span className="text-amber-900 font-bold text-xs leading-tight">
                    ⚠️ Este código ya pertenece a: <strong>{barcodeMatch.nombre_producto}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectExisting(barcodeMatch)}
                    className="text-xs font-bold uppercase tracking-wide text-azul hover:text-tinta bg-white px-2.5 py-1 rounded-lg border border-azul/30 transition-colors shadow-sm shrink-0"
                  >
                    Sumar Stock Aquí →
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="input_codigo" className="text-xs font-semibold text-slate-600 ml-1 flex justify-between items-center">
                <span>SKU / Referencia Interna</span>
                <span className="text-slate-500 font-bold lowercase tracking-normal text-xs">(opcional)</span>
              </label>
              <input
                id="input_codigo"
                type="text"
                value={formData.codigo || ''}
                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-tinta focus:border-azul outline-none transition-colors"
                placeholder="Opcional (Ej: REF-001)"
              />
            </div>
          </div>

          <div className="mb-6 space-y-2">
            <label htmlFor="input_nombre_producto" className="text-xs font-semibold text-slate-600 ml-1">Nombre del Producto</label>
            <input
              id="input_nombre_producto"
              required
              type="text"
              value={formData.nombre_producto}
              onChange={e => setFormData({ ...formData, nombre_producto: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-tinta focus:border-azul outline-none transition-colors"
              placeholder="Ej: Arroz roa 500g"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label htmlFor="input_categoria" className="text-xs font-semibold text-slate-600 ml-1">Categoría</label>
              <input
                id="input_categoria"
                list="lista_categorias"
                value={formData.categoria}
                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Escribe o selecciona..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-tinta focus:border-azul outline-none transition-colors"
              />
              <datalist id="lista_categorias">
                {categorias.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <label htmlFor="input_subcategoria" className="text-xs font-semibold text-slate-600 ml-1">Subcategoría <span className="text-slate-500">(Opcional)</span></label>
              <input id="input_subcategoria" type="text" value={formData.subcategoria} onChange={e => setFormData({ ...formData, subcategoria: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-tinta focus:border-azul outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 sm:mb-10">
            <div className="space-y-2">
              <label htmlFor="input_tipo_producto" className="text-xs font-semibold text-slate-600 ml-1">Tipo de Empaque / Venta</label>
              <CustomSelect
                id="input_tipo_producto"
                value={formData.tipo_producto}
                onChange={val => setFormData({ ...formData, tipo_producto: val })}
                placeholder="Seleccione tipo..."
                options={[
                  { value: '', label: 'Seleccione tipo...' },
                  { value: 'Perecedero', label: 'Perecedero' },
                  { value: 'No Perecedero', label: 'No Perecedero' },
                  { value: 'Digital', label: 'Digital' }
                ]}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-tinta focus-within:border-azul transition-colors"
              />
            </div>
            {formData.tipo_producto === 'Perecedero' && (
              <div className="space-y-2 animate-bounce-in relative">
                <label htmlFor="input_fecha_vencimiento" className="text-xs font-bold text-peligro ml-1">Fecha de Vencimiento 📅</label>
                <CustomDatePicker
                  id="input_fecha_vencimiento"
                  value={formData.fecha_vencimiento}
                  onChange={v => setFormData({ ...formData, fecha_vencimiento: v })}
                  placeholder="Seleccionar vencimiento..."
                  align="left-flyout"
                />
              </div>
            )}
          </div>

          {/* =========================================================
           * SECCIÓN DINÁMICA: PRECIO Y STOCK
           * ========================================================= */}
          {selectedProduct ? (
            /* MODO ENTRADA DE STOCK PARA PRODUCTO EXISTENTE */
            <div className="mt-8 sm:mt-10 mb-8 p-7 sm:p-8 bg-emerald-50/40 border-2 border-emerald-300 rounded-2xl shadow-sm animate-scale-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-200/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-exito text-white flex items-center justify-center shadow-sm shrink-0">
                    <PackagePlus size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-emerald-900">
                      Recepción de Inventario
                    </h4>
                    <p className="text-xs font-bold text-emerald-700">
                      Indica las unidades que llegaron y ajusta el precio si cambió
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 bg-white text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 shadow-sm">
                  Bodega: {selectedProduct.cantidad} ud
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                <div className="space-y-3">
                  <label htmlFor="input_precio" className="text-xs font-semibold text-slate-600 ml-1 flex justify-between items-center">
                    <span>Precio de Venta</span>
                    <span className="text-slate-500 font-bold lowercase tracking-normal text-xs bg-white px-2 py-0.5 rounded border border-slate-200">(editable si cambió)</span>
                  </label>
                  <input
                    id="input_precio"
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_unitario}
                    onChange={e => setFormData({ ...formData, precio_unitario: e.target.value })}
                    className="w-full p-4 bg-white border border-azul/30 rounded-lg text-lg font-bold text-azul focus:border-azul outline-none transition-colors shadow-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="input_cantidad_ingreso" className="text-xs font-bold text-emerald-800 ml-1 flex justify-between items-center">
                    <span>📦 Unidades a Ingresar (+)</span>
                    <span className="text-emerald-800 font-bold text-xs bg-emerald-200/80 px-2 py-0.5 rounded">
                      Nuevo Total: {Number(selectedProduct.cantidad || 0) + Number(cantidadIngreso || 0)} ud
                    </span>
                  </label>
                  <input
                    id="input_cantidad_ingreso"
                    required
                    type="number"
                    min="1"
                    value={cantidadIngreso}
                    onChange={e => setCantidadIngreso(e.target.value)}
                    className="w-full p-4 bg-white border-2 border-emerald-500 rounded-lg text-2xl font-bold text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-200 shadow-sm transition-all"
                    placeholder="Ej: 10, 50, 100"
                    autoFocus
                  />
                  <p className="text-xs text-emerald-700 font-bold ml-1">
                    Se sumarán a las {selectedProduct.cantidad} unidades actuales en bodega y quedará registrado en Movimientos.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* MODO CREACIÓN NORMAL O EDICIÓN */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label htmlFor="input_precio" className="text-xs font-semibold text-slate-600 ml-1">Precio de Venta</label>
                <input
                  id="input_precio"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_unitario}
                  onChange={e => setFormData({ ...formData, precio_unitario: e.target.value })}
                  className="w-full p-4 bg-azul/5 border border-azul/30 rounded-lg text-lg font-bold text-azul focus:border-azul outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="input_stock_inicial" className="text-xs font-bold text-emerald-400 ml-1">
                  {editMode ? 'Stock Actual' : 'Stock Inicial'}
                </label>
                <input
                  id="input_stock_inicial"
                  required
                  type="number"
                  min="0"
                  disabled={editMode}
                  value={formData.cantidad}
                  onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
                  className={`w-full p-4 bg-emerald-50/50 border border-exito-suave rounded-lg text-lg font-bold text-emerald-700 outline-none transition-colors ${editMode ? 'opacity-50 cursor-not-allowed' : 'focus:border-emerald-500'}`}
                  placeholder="0"
                />
                {editMode && <span className="text-xs font-bold text-exito bg-exito-suave px-2 py-0.5 rounded uppercase mt-1 inline-flex items-center gap-1"><Lock size={10} /> Protegido. Para sumar stock abre la ventana de registrar producto.</span>}
              </div>
            </div>
          )}

          {/* =========================================================
           * CONFIGURACIÓN DE ALERTAS (ADMIN)
           * ========================================================= */}
          {isAdmin && (
            <div className="mb-8">
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer select-none py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-azul/30 transition-colors">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Settings size={12} /> Configuración de Alertas y Stock Mínimo</span>
                  <span className="ml-auto text-xs text-slate-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
                </summary>
                <div className="mt-4 p-5 bg-azul/10 border border-azul/30 rounded-2xl space-y-5">
                  <p className="text-xs font-bold text-slate-500 leading-relaxed flex items-center justify-between">
                    <span>Estos valores determinan cuándo se activan las alertas de reposición de este producto.</span>
                    <button
                      type="button"
                      onClick={handleSuggestAlerts}
                      disabled={isSuggesting}
                      className="ml-4 px-3 py-1.5 bg-azul hover:bg-azul-hondo disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {isSuggesting ? 'Calculando...' : '✨ Sugerir con IA'}
                    </button>
                  </p>

                  {aiError && (
                    <div className="p-3 bg-rose-50/50 border border-peligro-suave rounded-2xl flex items-start gap-2">
                      <span className="text-peligro mt-0.5 text-xs">⚠️</span>
                      <p className="text-xs text-peligro font-bold">{aiError}</p>
                    </div>
                  )}
                  {aiSuccess && (
                    <div className="p-3 bg-emerald-50/50 border border-exito-suave rounded-2xl flex items-start gap-2">
                      <span className="text-exito mt-0.5 text-xs">✨</span>
                      <p className="text-xs text-exito font-bold">{aiSuccess}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="input_proveedor" className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1"><Package size={12} /> Proveedor Principal (Opcional)</label>
                    <CustomSelect
                      id="input_proveedor"
                      value={formData.id_proveedor}
                      onChange={val => setFormData({ ...formData, id_proveedor: val })}
                      placeholder="Seleccione proveedor..."
                      options={[
                        { value: '', label: 'Ninguno / Sin asignar' },
                        ...proveedores.map(prov => ({
                          value: prov.id_proveedor,
                          label: prov.contacto_principal && prov.contacto_principal !== 'null' ? `${prov.nombre_empresa} (${prov.contacto_principal})` : prov.nombre_empresa
                        }))
                      ]}
                      className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-azul text-tinta"
                    />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="input_stock_minimo" className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1">
                        Stock Mínimo
                        <Tooltip text="Piso para sugerir 'Pedir Más', además del punto de reorden que ya calcula el sistema. No decide la alerta roja de crítico/agotado.">
                          <span className="text-slate-400/80 hover:text-azul font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow" >i</span>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        id="input_stock_minimo"
                        min="0"
                        value={formData.stock_minimo}
                        onChange={e => {
                          setFormData({ ...formData, stock_minimo: e.target.value });
                          setUpdatedFields(prev => prev.filter(f => f !== 'stock_minimo'));
                        }}
                        className={`w-full p-3 border rounded-lg text-sm font-bold outline-none text-center transition-all duration-500 ${updatedFields.includes('stock_minimo') ? 'bg-azul/10 border-azul/30 ring-2 ring-azul/30 text-azul' : 'bg-white border-amber-200 text-aviso focus:border-ambar'}`}
                      />
                      <p className="text-xs text-slate-500 font-bold text-center">Avisa cuándo comprar</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="input_stock_seguridad" className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1">
                        Stock Seguridad
                        <Tooltip text="Colchón de emergencia: si el stock baja de aquí (o llega a 0), se marca crítico/agotado y aparece en el Consejero.">
                          <span className="text-slate-400/80 hover:text-azul font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow" >i</span>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        id="input_stock_seguridad"
                        min="0"
                        value={formData.stock_seguridad}
                        onChange={e => {
                          setFormData({ ...formData, stock_seguridad: e.target.value });
                          setUpdatedFields(prev => prev.filter(f => f !== 'stock_seguridad'));
                        }}
                        className={`w-full p-3 border rounded-lg text-sm font-bold outline-none text-center transition-all duration-500 ${updatedFields.includes('stock_seguridad') ? 'bg-azul/10 border-azul/30 ring-2 ring-azul/30 text-azul' : 'bg-white border-rose-200 text-peligro focus:border-rose-500'}`}
                      />
                      <p className="text-xs text-slate-500 font-bold text-center">Avisa riesgo de quiebre</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="input_lead_time" className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1">
                        Días Recepción
                        <Tooltip text="Días que tarda el proveedor en entregarte este producto" align="right">
                          <span className="text-slate-400/80 hover:text-azul font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow" >i</span>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        id="input_lead_time"
                        min="1"
                        value={formData.lead_time}
                        onChange={e => {
                          setFormData({ ...formData, lead_time: e.target.value });
                          setUpdatedFields(prev => prev.filter(f => f !== 'lead_time'));
                        }}
                        className={`w-full p-3 border rounded-lg text-sm font-bold outline-none text-center transition-all duration-500 ${updatedFields.includes('lead_time') ? 'bg-azul/10 border-azul/30 ring-2 ring-azul/30 text-azul' : 'bg-white border-azul/30 text-azul focus:border-azul'}`}
                      />
                      <p className="text-xs text-slate-500 font-bold text-center">Días de entrega</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="input_frecuencia_compra_dias" className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1">
                        Frecuencia de Compra
                        <Tooltip text="Cada cuántos días sueles pedir este producto. Define hasta cuándo se avisa 'Pedir en esta compra' antes de que se agote." align="right">
                          <span className="text-slate-400/80 hover:text-azul font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow" >i</span>
                        </Tooltip>
                      </label>
                      <input
                        type="number"
                        id="input_frecuencia_compra_dias"
                        min="1"
                        value={formData.frecuencia_compra_dias}
                        onChange={e => setFormData({ ...formData, frecuencia_compra_dias: e.target.value })}
                        className="w-full p-3 border rounded-lg text-sm font-bold outline-none text-center transition-colors bg-white border-slate-200 text-tinta focus:border-azul"
                      />
                      <p className="text-xs text-slate-500 font-bold text-center">Días entre compras</p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* =========================================================
           * BOTONES DE ACCIÓN
           * ========================================================= */}
          <div className="flex gap-4 pt-8 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] py-4 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${selectedProduct
                  ? 'bg-exito hover:bg-emerald-700'
                  : 'bg-azul hover:bg-azul-hondo'
                }`}
            >
              {loading ? (
                'Sincronizando...'
              ) : selectedProduct ? (
                <>
                  <PackagePlus size={16} />
                  <span>Ingresar +{cantidadIngreso || 0} Unidades al Inventario</span>
                </>
              ) : editMode ? (
                'Actualizar Producto'
              ) : (
                'Guardar Producto Nuevo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProductFormModal;
