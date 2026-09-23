import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import { FlaskConical, Package } from 'lucide-react';

const SimuladorPage = () => {
  const [products, setProducts] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [budget, setBudget] = useState(5000000); // 5M default
  const [excludedIds, setExcludedIds] = useState(new Set());
  
  // Modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  // Proveedores: se traen una sola vez, no dependen del slider de días.
  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/proveedores', { signal: controller.signal })
      .then(res => { if (res.data.success) setProveedores(res.data.data); })
      .catch(e => { if (!axios.isCancel(e)) toast.error('Error cargando proveedores'); });
    return () => controller.abort();
  }, [toast]);

  // Productos: el motor único (utils/reposicion.js, plan 17/18) recalcula `cantidad_recomendada`
  // según el objetivo de cobertura del slider (`dias`), incluyendo el piso de stock_minimo/
  // stock_seguridad para productos sin ventas — por eso se vuelve a pedir al backend en vez de
  // recalcular en el navegador. Con debounce para no disparar una consulta por cada pixel arrastrado.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(prev => (products.length === 0 ? true : prev));
    const timer = setTimeout(() => {
      axios.get('/api/ia/snapshot', { params: { dias: days }, signal: controller.signal })
        .then(res => { if (res.data.success) setProducts(res.data.data); })
        .catch(e => { if (!axios.isCancel(e)) toast.error('Error cargando datos del simulador'); })
        .finally(() => setLoading(false));
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Lógica de Simulación Reactiva
  const simulatedData = useMemo(() => {
    // 1. Normalizar lo que ya calculó el backend con el motor único (cantidad y costo)
    let items = products.map(p => ({
      ...p,
      // Plan 17: el motor devuelve `null` (no `Infinity`) cuando no hay ventas para medir días de
      // agotamiento. Se normaliza aquí para no romper el orden ni los umbrales de abajo, que ya
      // asumían Infinity para "nunca se agota". `days_to_exhaust` es informativo (cuánto dura el
      // stock actual); no es el objetivo del slider, que ya viene aplicado en `cantidad_recomendada`.
      days_to_exhaust: p.days_to_exhaust === null || p.days_to_exhaust === undefined ? Infinity : p.days_to_exhaust,
      needed: p.cantidad_recomendada || 0,
      simulatedCost: Math.round((p.cantidad_recomendada || 0) * (Number(p.costo_unitario) || 0)),
      isExcludedManual: excludedIds.has(p.id_producto)
    }));

    // 2. Ordenar por Prioridad para la ASIGNACIÓN de presupuesto (A > B > C)
    items.sort((a, b) => {
      const priority = { 'A': 1, 'B': 2, 'C': 3 };
      if (priority[a.category] !== priority[b.category]) return priority[a.category] - priority[b.category];
      return a.days_to_exhaust - b.days_to_exhaust;
    });

    // 3. Asignación de Presupuesto (Greedy)
    let currentTotal = 0;
    let itemsWithBudget = items.map(item => {
      const isWithinBudget = !item.isExcludedManual && (currentTotal + item.simulatedCost <= budget);
      if (isWithinBudget && item.needed > 0) {
        currentTotal += item.simulatedCost;
        return { ...item, activeInSim: true, isExcludedBudget: false };
      }
      return { ...item, activeInSim: false, isExcludedBudget: item.needed > 0 && !item.isExcludedManual };
    });

    // 4. Segundo Orden: ACTIVOS PRIMERO para la UI
    itemsWithBudget.sort((a, b) => {
      if (a.activeInSim !== b.activeInSim) return a.activeInSim ? -1 : 1;
      const priority = { 'A': 1, 'B': 2, 'C': 3 };
      return priority[a.category] - priority[b.category];
    });

    const activeCount = itemsWithBudget.filter(i => i.activeInSim).length;
    const excludedCount = itemsWithBudget.filter(i => !i.activeInSim && i.needed > 0).length;

    return {
      items: itemsWithBudget,
      totalCost: currentTotal,
      activeCount,
      excludedCount
    };
  }, [products, budget, excludedIds]);

  const toggleManualExclusion = (id) => {
    const newExcluded = new Set(excludedIds);
    if (newExcluded.has(id)) newExcluded.delete(id);
    else newExcluded.add(id);
    setExcludedIds(newExcluded);
  };

  const handleConvertToOrder = async () => {
    if (!selectedSupplierId) return toast.info('Seleccione un proveedor para continuar');
    
    // Filtrar items de la simulación que pertenecen a este proveedor
    const supplierItems = simulatedData.items.filter(i => 
      i.activeInSim && 
      i.id_proveedor === parseInt(selectedSupplierId)
    );

    if (supplierItems.length === 0) {
      return toast.warning('No hay productos en esta simulación vinculados a este proveedor.');
    }

    setIsSubmitting(true);
    try {
      // Formatear para el endpoint de órdenes existente
      const res = await axios.post(`/api/proveedores/${selectedSupplierId}/ordenes`, {
        carrito_final: supplierItems.map(i => ({
          id_producto: i.id_producto,
          nombre: i.nombre,
          calculo_base: i.needed,
          sugerencia_final: i.needed,
          presupuesto_estimado_final: i.simulatedCost,
          ajuste_ia: '0% (Simulado)'
        })),
        evaluacion_riesgo: {
          nivel: 'Bajo',
          justificacion: 'Orden generada desde el Simulador con presupuesto controlado.',
          costo_total_estimado: supplierItems.reduce((acc, curr) => acc + curr.simulatedCost, 0)
        },
        estado_deseado: 'Borrador',
        notas_humanas: `Conversión desde simulación: ${days} días de cobertura.`
      });

      if (res.data.success) {
        toast.success('Simulación convertida en Orden con éxito');
        setShowConvertModal(false);
        navigate('/proveedores');
      }
    } catch {
      toast.error('Error al convertir simulación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-azul border-t-transparent rounded-full shadow-lg"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      
      {/* HEADER ESTRATÉGICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-azul text-white rounded-2xl flex items-center justify-center shadow-lg">
              <FlaskConical size={22} />
            </div>
            <div>
              <h1 className="titular text-3xl text-tinta">Simulador de Escenarios</h1>
              <p className="text-xs font-bold text-azul bg-azul/10 px-2 py-0.5 rounded-full inline-block">Proyecta tus futuras compras</p>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-500 max-w-xl">
            Ajusta cuántos días quieres cubrir y tu presupuesto para ver exactamente qué deberías comprar antes de gastar dinero en la vida real.
          </p>
        </div>
        
        <button 
          onClick={() => setShowConvertModal(true)}
          disabled={simulatedData.activeCount === 0}
          className="bg-exito hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-bold text-xs shadow-lg transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
          <Package size={16} /> Convertir en Orden Real
        </button>
      </div>

      {/* PANEL DE CONTROL (SLIDERS) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Controles */}
        <div className="xl:col-span-2 bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Slider Cobertura */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label htmlFor="days" className="text-xs font-semibold text-slate-600">Días de Cobertura Deseada</label>
              <span className="text-3xl font-bold text-azul">{days} <span className="text-sm text-slate-500">días</span></span>
            </div>
            <input 
              id="days"
              type="range" 
              min="7" 
              max="90" 
              step="1"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-azul"
            />
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>7 días (Mín)</span>
              <span>45 días (Med)</span>
              <span>90 días (Máx)</span>
            </div>
          </div>

          {/* Input Presupuesto */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label htmlFor="budget" className="text-xs font-semibold text-slate-600">Presupuesto Máximo de Compra</label>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
              <input 
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-lg font-bold text-2xl text-tinta focus:border-azul outline-none transition-colors transition-shadow"
              />
            </div>
            <p className="text-xs text-slate-500 font-bold">
              ⚠️ Si el presupuesto no te alcanza, el sistema priorizará la compra de los productos que te dejan más ganancia (Tipo A).
            </p>
          </div>
        </div>

        {/* Resumen KPIs */}
        <div className="bg-azul p-8 rounded-2xl shadow-lg flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
          <div>
            <p className="text-xs font-bold opacity-80 mb-1">Costo Total Simulado</p>
            <h2 className="titular text-4xl">${simulatedData.totalCost.toLocaleString()}</h2>
            
            <div className="mt-6 flex gap-4">
              <div className="bg-white/10 rounded-2xl p-3 flex-grow border border-white/5">
                <p className="text-xs font-bold opacity-80">Items Incluidos</p>
                <p className="text-xl font-bold">{simulatedData.activeCount}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 flex-grow border border-white/5">
                <p className="text-xs font-bold opacity-80">Excluidos</p>
                <p className="text-xl font-bold text-rose-300">{simulatedData.excludedCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Uso del Presupuesto</span>
              <span>{Math.round((simulatedData.totalCost / (budget || 1)) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-colors duration-1000 ${simulatedData.totalCost > budget ? 'bg-rose-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, (simulatedData.totalCost / (budget || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="titular text-xl text-tinta">¿Qué y cuánto comprar?</h3>
          <p className="text-xs font-bold text-slate-500">Calculado a partir de tu ritmo de ventas mensual</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-bold text-slate-500">
                <th className="p-6 border-b border-slate-100 w-16">Inc.</th>
                <th className="p-6 border-b border-slate-100">Producto</th>
                <th className="p-6 border-b border-slate-100 text-center">Tipo</th>
                <th className="p-6 border-b border-slate-100 text-center">Reserva</th>
                <th className="p-6 border-b border-slate-100 text-center">Ventas / Día</th>
                <th className="p-6 border-b border-slate-100 text-center">Alcanza Para</th>
                <th className="p-6 border-b border-slate-100 text-center text-exito">Comprar ({days}d)</th>
                <th className="p-6 border-b border-slate-100 text-right">Inversión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {simulatedData.items.map(p => (
                <tr 
                  key={p.id_producto} 
                  className={`group transition-colors duration-300 ${
                    !p.activeInSim 
                      ? 'opacity-90 bg-slate-50/40 grayscale-[0.5]' 
                      : 'bg-white border-l-4 border-l-emerald-500 shadow-[2px_0_15px_rgba(0,0,0,0.05)] relative z-10 scale-[1.01]'
                  } hover:bg-slate-50/80`}
                >
                  <td className="p-6 text-center">
                    <input 
                      type="checkbox" 
                      aria-label={`Incluir ${p.nombre}`}
                      checked={p.activeInSim && !p.isExcludedManual}
                      onChange={() => toggleManualExclusion(p.id_producto)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-azul focus:ring-azul/30 cursor-pointer"
                    />
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-tinta leading-none">{p.nombre}</span>
                      <span className="text-xs font-bold text-slate-500 mt-1">{p.categoria}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                      p.category === 'A' ? 'bg-azul/10 text-azul' : 
                      p.category === 'B' ? 'bg-slate-100 text-slate-600' : 
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {p.category === 'A' ? 'A (Alta)' : p.category === 'B' ? 'B (Media)' : 'C (Baja)'}
                    </span>
                  </td>
                  <td className="p-6 text-center text-sm font-bold text-slate-600">{(Number(p.stock_actual) || 0)} ud</td>
                  <td className="p-6 text-center text-sm font-bold text-slate-600">{(Number(p.velocity) || 0).toFixed(1)} /día</td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-bold ${
                        p.days_to_exhaust < 7 ? 'text-peligro' : 
                        p.days_to_exhaust < 15 ? 'text-aviso' : 'text-exito'
                      }`}>
                        {p.days_to_exhaust === Infinity ? '∞' : p.days_to_exhaust} días
                      </span>
                      <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${p.days_to_exhaust < 15 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, (p.days_to_exhaust / 30) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className={`inline-block px-4 py-2 rounded-2xl border-2 font-bold text-lg transition-colors ${
                      p.needed > 0 ? 'border-exito-suave bg-emerald-50 text-exito' : 'border-slate-100 bg-slate-50 text-slate-500'
                    }`}>
                      {p.needed} <span className="text-xs">ud</span>
                    </div>
                    {p.isExcludedBudget && (
                      <p className="text-xs font-bold text-peligro mt-1">Fuera de Presupuesto</p>
                    )}
                  </td>
                  <td className="p-6 text-right font-bold text-tinta-2">
                    ${p.simulatedCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SELECCIONAR PROVEEDOR Y CONVERTIR */}
      {showConvertModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-tinta/45 backdrop-blur-sm" onClick={() => setShowConvertModal(false)}></div>
          
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg relative z-10 p-8 animate-scale-in border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="titular text-2xl text-tinta">Confirmar Ejecución</h2>
                <p className="text-xs font-bold text-slate-500">Selecciona el proveedor para procesar la orden.</p>
              </div>
              <button onClick={() => setShowConvertModal(false)} aria-label="Cerrar modal" className="text-2xl text-slate-500 hover:text-rose-500 transition-colors">×</button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-4">
                  <span>Resumen de Simulación</span>
                  <span>{days} días</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-600">Total a Invertir</span>
                  <span className="text-3xl font-bold text-azul">${simulatedData.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500 ml-1">Seleccionar Proveedor</span>
                <div className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:border-azul transition-colors">
                  <CustomSelect 
                    value={selectedSupplierId}
                    onChange={(val) => setSelectedSupplierId(val)}
                    options={proveedores.map(p => ({
                      value: String(p.id_proveedor),
                      label: `${p.nombre_empresa} (${p.productos_vinculados} ítems)`
                    }))}
                    placeholder="-- Elige un proveedor --"
                  />
                </div>
                <p className="text-xs text-slate-500 font-bold ml-1">
                  * Solo se incluirán los productos de la simulación vinculados al proveedor elegido.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleConvertToOrder}
                  disabled={isSubmitting || !selectedSupplierId}
                  className="w-full py-4 bg-azul hover:bg-azul-hondo text-white rounded-lg font-bold text-xs shadow-lg transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '✓'} 
                  Confirmar y Crear Orden
                </button>
                <button 
                  onClick={() => setShowConvertModal(false)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default SimuladorPage;
