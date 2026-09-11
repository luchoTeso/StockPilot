import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Settings, Package } from 'lucide-react';
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
  categorias = []
}) => {
  const defaultData = {
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
  };

  const [formData, setFormData] = useState(defaultData);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(null);
  const [updatedFields, setUpdatedFields] = useState([]);

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
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} role="presentation" aria-hidden="true"></div>
      <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl animate-scale-in relative z-10 transition-transform transition-opacity">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">{editMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
          <button onClick={onClose} type="button" className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-500 hover:border-rose-100 flex items-center justify-center text-xl transition-colors shadow-sm">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label htmlFor="input_codigo" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código (Referencia)</label>
              <input id="input_codigo" required type="text" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label htmlFor="input_nombre_producto" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre del Producto</label>
              <input id="input_nombre_producto" required type="text" value={formData.nombre_producto} onChange={e => setFormData({ ...formData, nombre_producto: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label htmlFor="input_categoria" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
              <input
                id="input_categoria"
                list="lista_categorias"
                value={formData.categoria}
                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Escribe o selecciona..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-colors"
              />
              <datalist id="lista_categorias">
                {categorias.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <label htmlFor="input_subcategoria" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subcategoría <span className="text-slate-400">(Opcional)</span></label>
              <input id="input_subcategoria" type="text" value={formData.subcategoria} onChange={e => setFormData({ ...formData, subcategoria: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label htmlFor="input_tipo_producto" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Empaque / Venta</label>
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
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus-within:border-indigo-500 transition-colors"
              />
            </div>
            {formData.tipo_producto === 'Perecedero' && (
              <div className="space-y-2 animate-bounce-in relative">
                <label htmlFor="input_fecha_vencimiento" className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Fecha de Vencimiento 📅</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label htmlFor="input_precio" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Precio de Venta</label>
              <input id="input_precio" required type="number" step="0.01" min="0" value={formData.precio_unitario} onChange={e => setFormData({ ...formData, precio_unitario: e.target.value })} className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-lg font-black text-indigo-700 focus:border-indigo-500 outline-none transition-colors" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label htmlFor="input_stock_inicial" className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Stock Inicial</label>
              <input id="input_stock_inicial" required type="number" min="0" disabled={editMode} value={formData.cantidad} onChange={e => setFormData({ ...formData, cantidad: e.target.value })} className={`w-full p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-lg font-black text-emerald-700 outline-none transition-colors ${editMode ? 'opacity-50 cursor-not-allowed' : 'focus:border-emerald-500'}`} placeholder="0" />
              {editMode && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase mt-1 inline-flex items-center gap-1"><Lock size={10} /> Protegido. Usar botón de agregar inventario.</span>}
            </div>
          </div>

          {isAdmin && (
            <div className="mb-8">
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer select-none py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-colors">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Settings size={12} /> Configuración de Alertas</span>
                  <span className="ml-auto text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4 p-5 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-5">
                  <p className="text-[9px] font-bold text-slate-500 leading-relaxed flex items-center justify-between">
                    <span>Estos valores determinan cómo la IA y el motor de alertas evalúan el estado de este producto.</span>
                    <button 
                      type="button" 
                      onClick={handleSuggestAlerts} 
                      disabled={isSuggesting}
                      className="ml-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {isSuggesting ? 'Calculando...' : '✨ Sugerir con IA'}
                    </button>
                  </p>
                  
                  {aiError && (
                    <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2">
                      <span className="text-red-500 mt-0.5 text-xs">⚠️</span>
                      <p className="text-[10px] text-red-600 font-bold">{aiError}</p>
                    </div>
                  )}
                  {aiSuccess && (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5 text-xs">✨</span>
                      <p className="text-[10px] text-emerald-600 font-bold">{aiSuccess}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="input_proveedor" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1"><Package size={12} /> Proveedor Principal (Opcional)</label>
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
                      className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="input_stock_minimo" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                        Stock Mínimo
                        <Tooltip text="Cantidad mínima antes de activar alerta amarilla (Pedir más)">
                          <span className="text-slate-400/80 hover:text-indigo-500 font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow hover:-translate-y-0.5" >i</span>
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
                        className={`w-full p-3 border rounded-xl text-sm font-black outline-none text-center transition-all duration-500 ${updatedFields.includes('stock_minimo') ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 text-indigo-700' : 'bg-white border-amber-200 text-amber-700 focus:border-amber-500'}`}
                      />
                      <p className="text-[8px] text-slate-400 font-bold text-center">Avisa cuándo comprar</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="input_stock_seguridad" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                        Stock Seguridad
                        <Tooltip text="Colchón de emergencia. Si baja de aquí, se activa alerta roja (Agotado)">
                          <span className="text-slate-400/80 hover:text-indigo-500 font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow hover:-translate-y-0.5" >i</span>
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
                        className={`w-full p-3 border rounded-xl text-sm font-black outline-none text-center transition-all duration-500 ${updatedFields.includes('stock_seguridad') ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 text-indigo-700' : 'bg-white border-rose-200 text-rose-600 focus:border-rose-500'}`}
                      />
                      <p className="text-[8px] text-slate-400 font-bold text-center">Avisa riesgo de quiebre</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="input_lead_time" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                        Días Recepción
                        <Tooltip text="Días que tarda el proveedor en entregarte este producto" align="right">
                          <span className="text-slate-400/80 hover:text-indigo-500 font-normal normal-case tracking-normal cursor-help transition-colors text-xs border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center bg-white shadow-sm hover:shadow hover:-translate-y-0.5" >i</span>
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
                        className={`w-full p-3 border rounded-xl text-sm font-black outline-none text-center transition-all duration-500 ${updatedFields.includes('lead_time') ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 text-indigo-700' : 'bg-white border-indigo-200 text-indigo-600 focus:border-indigo-500'}`}
                      />
                      <p className="text-[8px] text-slate-400 font-bold text-center">Días de entrega</p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}

          <div className="flex gap-4 pt-8 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Sincronizando...' : editMode ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProductFormModal;
