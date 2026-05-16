import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import CustomSelect from '../components/CustomSelect';
import Tooltip from '../components/Tooltip';
import CustomDatePicker from '../components/CustomDatePicker';
import { PackagePlus, PackageMinus, SlidersHorizontal } from 'lucide-react';

const MovimientosPage = () => {
  const toast = useToast();
  // Datos Generales
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState({ entradas: 0, salidas: 0, ajustes: 0 });
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Formulario Registro
  const [tipo, setTipo] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones de motivo estandarizadas según el tipo (RF-024)
  const opcionesMotivo = useMemo(() => {
    if (tipo === 'Entrada') {
      return [
        { value: 'Compra a Proveedor', label: 'Compra a Proveedor' },
        { value: 'Devolución de Cliente', label: 'Devolución de Cliente' },
        { value: 'Reingreso por Error', label: 'Reingreso por Error' },
        { value: 'Donación / Otro', label: 'Donación / Otro' }
      ];
    }
    if (tipo === 'Salida') {
      return [
        { value: 'Venta Manual', label: 'Venta Manual' },
        { value: 'Daño o Merma', label: 'Daño o Merma' },
        { value: 'Vencimiento', label: 'Vencimiento' },
        { value: 'Uso Interno', label: 'Uso Interno' },
        { value: 'Robo / Pérdida', label: 'Robo / Pérdida' }
      ];
    }
    if (tipo === 'Ajuste') {
      return [
        { value: 'Inventario Físico', label: 'Inventario Físico' },
        { value: 'Corrección de Error', label: 'Corrección de Error' },
        { value: 'Cambio de Lote', label: 'Cambio de Lote' }
      ];
    }
    return [];
  }, [tipo]);

  // Limpiar observación al cambiar tipo para evitar inconsistencias
  useEffect(() => {
    setObservacion('');
  }, [tipo]);

  // Filtros Historial
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  useEffect(() => {
    cargarProductos();
    cargarResumen();
    cargarMovimientos();
  }, []);

  // Cargar dependencia de filtro: cuando cambia el filtro, se recargan los movs
  useEffect(() => {
    cargarMovimientos();
  }, [filtroTipo, filtroDesde, filtroHasta]);

  const cargarProductos = async () => {
    try {
      const { data } = await axios.get('/api/inventario/productos');
      if (data.success) {
        setProductos(data.data);
      }
    } catch (err) {
      console.error('Error cargando productos', err);
    }
  };

  const cargarResumen = async () => {
    try {
      const { data } = await axios.get('/api/inventario/resumen');
      if (data.success) {
        let e = 0, s = 0, a = 0;
        data.data.forEach(r => {
          if (r.tipo_movimiento === 'Entrada') e = r.total_movimientos;
          else if (r.tipo_movimiento === 'Salida') s = r.total_movimientos;
          else if (r.tipo_movimiento === 'Ajuste') a = r.total_movimientos;
        });
        setResumen({ entradas: e, salidas: s, ajustes: a });
      }
    } catch (err) {
      console.error('Error cargando resumen', err);
    }
  };

  const cargarMovimientos = async () => {
    setLoadingMovimientos(true);
    try {
      let url = '/api/inventario/movimientos?';
      if (filtroTipo) url += `tipo=${filtroTipo}&`;
      if (filtroDesde) url += `fechaDesde=${filtroDesde}&`;
      if (filtroHasta) url += `fechaHasta=${filtroHasta}&`;

      const { data } = await axios.get(url);
      setMovimientos(data.success ? data.data : []);
    } catch (err) {
      console.error('Error cargando movimientos', err);
      setMovimientos([]);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '---';
    // Normalizar a ISO UTC para evitar desvíos de zona horaria en el navegador
    const isoStr = fechaStr.includes('T') ? fechaStr : fechaStr.replace(' ', 'T') + 'Z';
    return new Date(isoStr).toLocaleString('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroDesde('');
    setFiltroHasta('');
  };

  const registrarMovimiento = async (e) => {
    e.preventDefault();
    if (!tipo || !productoId || !cantidad) return;

    const cantNum = parseInt(cantidad, 10);
    if (isNaN(cantNum) || (tipo !== 'Ajuste' && cantNum <= 0)) {
      toast.warning('Ingrese una cantidad válida');
      return;
    }

    setIsSubmitting(true);
    let endpoint = '';
    if (tipo === 'Entrada') endpoint = '/api/inventario/entrada';
    else if (tipo === 'Salida') endpoint = '/api/inventario/salida';
    else endpoint = '/api/inventario/ajuste';

    try {
      const { data } = await axios.post(endpoint, {
        id_producto: parseInt(productoId, 10),
        cantidad: cantNum,
        observacion
      });
      if (data.success) {
        toast.success(`Movimiento registrado. Stock: ${data.data.stockAnterior} → ${data.data.stockNuevo}`);
        
        // Reset form variables
        setTipo('');
        setProductoId('');
        setCantidad('');
        setObservacion('');
        
        // Reload data
        await Promise.all([cargarProductos(), cargarResumen(), cargarMovimientos()]);
      } else {
        toast.error(data.error || 'No se pudo registrar el movimiento');
      }
    } catch (err) {
      toast.error(`Error de conexión: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const productoSeleccionado = useMemo(() => {
    if (!productoId) return null;
    return productos.find(p => p.id_producto === parseInt(productoId, 10));
  }, [productoId, productos]);

  return (
    <div className="animate-fade-in pb-12 space-y-8 font-outfit">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Movimientos de Inventario</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Registro completo de entradas, salidas y ajustes</p>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Entradas de Producto', value: resumen.entradas, icon: PackagePlus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Salidas de Producto', value: resumen.salidas, icon: PackageMinus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Ajustes Manuales', value: resumen.ajustes, icon: SlidersHorizontal, color: 'text-amber-500', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-slate-200">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              {(() => { const Icon = stat.icon; return <Icon size={26} />; })()}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <Tooltip text={stat.label} className="w-full min-w-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 truncate w-full">{stat.label}</p>
              </Tooltip>
              <Tooltip text={String(stat.value)} className="w-full min-w-0 flex-1">
                 <h3 className={`text-3xl font-black tracking-tighter italic ${stat.color} truncate w-full`}>{stat.value}</h3>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Registrar Movimiento */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 lg:sticky lg:top-6 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 lg:p-8 overflow-y-auto scrollbar-hide flex-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase mb-6 pb-4 border-b border-slate-100 shrink-0">Registrar Movimiento</h3>
              
              <form onSubmit={registrarMovimiento} className="space-y-5">
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Movimiento</label>
                <CustomSelect 
                  value={tipo} 
                  onChange={(val) => setTipo(val)}
                  placeholder="Elige una opción..."
                  options={[
                    { value: 'Entrada', label: 'Entrada de mercancía' },
                    { value: 'Salida', label: 'Salida manual' },
                    { value: 'Ajuste', label: 'Ajuste de inventario' }
                  ]}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Producto</label>
                <CustomSelect 
                  value={productoId} 
                  onChange={(val) => setProductoId(val)}
                  placeholder="Buscar producto..."
                  options={productos.map(p => ({
                    value: String(p.id_producto),
                    label: `${p.nombre_producto} (Stock: ${p.cantidad})`
                  }))}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
                />
                {productoSeleccionado && (
                  <div className="mt-2 text-xs font-bold text-slate-500 px-2 flex justify-between">
                    <span>Stock Actual:</span>
                    <span className="text-indigo-600">{productoSeleccionado.cantidad} unidades</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {tipo === 'Ajuste' ? 'Cantidad (+ o -)' : 'Cantidad'}
                </label>
                <input 
                  type="number" 
                  required 
                  min={tipo === 'Ajuste' ? '' : '1'} 
                  value={cantidad} 
                  onChange={(e) => setCantidad(e.target.value)} 
                  placeholder={tipo === 'Ajuste' ? 'Ej: -5 o +10' : 'Ej: 20'} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-800 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo o Justificación</label>
                <CustomSelect 
                  value={observacion} 
                  onChange={(val) => setObservacion(val)}
                  placeholder={tipo ? "Seleccione el motivo..." : "Primero elija tipo de mov."}
                  options={opcionesMotivo}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="pt-4 pb-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !tipo || !productoId || !cantidad || !observacion} 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSubmitting ? 'Procesando...' : 'Ejecutar Movimiento'}
                </button>
              </div>

            </form>
            </div>
          </div>
        </div>

        {/* Historial Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filtros Historial */}
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl flex flex-wrap gap-4 items-center">
            <CustomSelect 
              value={filtroTipo} 
              onChange={val => setFiltroTipo(val)}
              placeholder="Todos los tipos"
              options={[
                { value: '', label: 'Todos' },
                { value: 'Entrada', label: 'Entradas' },
                { value: 'Salida', label: 'Salidas' },
                { value: 'Ajuste', label: 'Ajustes' }
              ]}
              className="flex-1 min-w-[150px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-within:border-indigo-500 text-slate-800"
            />
            <div className="flex-1 min-w-[150px]">
              <CustomDatePicker 
                value={filtroDesde} 
                onChange={v => setFiltroDesde(v)} 
                placeholder="Fecha Desde" 
                align="left"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <CustomDatePicker 
                value={filtroHasta} 
                onChange={v => setFiltroHasta(v)} 
                placeholder="Fecha Hasta" 
                align="right"
              />
            </div>
            <button 
              type="button" 
              onClick={limpiarFiltros} 
              className="bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
            >
              Limpiar
            </button>
          </div>

          {/* Tabla Premium */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                    <th className="p-6 pl-8">Fecha</th>
                    <th className="p-6">Tipo</th>
                    <th className="p-6">Producto</th>
                    <th className="p-6">Categoría</th>
                    <th className="p-6 text-center">Cantidad</th>
                    <th className="p-6">Observación</th>
                    <th className="p-6 pr-8">Usuario</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {loadingMovimientos ? (
                    <tr><td colSpan="7" className="text-center p-12 text-slate-400 font-bold animate-pulse tracking-widest uppercase text-[10px]">Consultando registros...</td></tr>
                  ) : movimientos.length === 0 ? (
                    <tr><td colSpan="7" className="text-center p-12 text-slate-400 font-bold italic">No se encontraron movimientos registrados en este período.</td></tr>
                  ) : (
                    movimientos.map((m, idx) => {
                      const isSalida = m.tipo_movimiento === 'Salida';
                      const isAjuste = m.tipo_movimiento === 'Ajuste';
                      const isEntrada = m.tipo_movimiento === 'Entrada';
                      
                      let badgeClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                      if (isSalida) badgeClass = 'bg-indigo-50 text-indigo-600 border border-indigo-100';
                      if (isAjuste) badgeClass = 'bg-amber-50 text-amber-600 border border-amber-100';

                      const cantidadDisplay = isEntrada ? `+${m.cantidad}` : isSalida ? `-${m.cantidad}` : (m.cantidad >= 0 ? `+${m.cantidad}` : m.cantidad);
                      const textColor = isSalida ? 'text-indigo-600' : isAjuste ? 'text-amber-500' : 'text-emerald-500';

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6 pl-8 font-medium text-slate-500 whitespace-nowrap">{formatearFecha(m.fecha_movimiento)}</td>
                          <td className="p-6">
                            <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${badgeClass}`}>
                              {m.tipo_movimiento}
                            </span>
                          </td>
                          <td className="p-6 font-black text-slate-800">{m.nombre_producto}</td>
                          <td className="p-6 text-slate-500 font-medium">{m.categoria || '-'}</td>
                          <td className={`p-6 text-center font-black text-lg tracking-tighter ${textColor}`}>{cantidadDisplay}</td>
                          <td className="p-6 text-slate-500 text-xs italic max-w-[200px] truncate" title={m.observacion}>{m.observacion || '-'}</td>
                          <td className="p-6 pr-8 text-slate-500 font-bold flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-600 font-black">
                              {(m.nombre_usuario || '?')[0].toUpperCase()}
                            </div>
                            <span className="truncate max-w-[100px]" title={m.nombre_usuario}>{m.nombre_usuario || '-'}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimientosPage;
