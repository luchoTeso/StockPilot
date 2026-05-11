import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import CustomSelect from '../components/CustomSelect';

const SimuladorPage = () => {
  const [products, setProducts] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [budget, setBudget] = useState(5000000); // 5M default
  const [excludedIds, setExcludedIds] = useState(new Set());
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  
  // Modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, provRes] = await Promise.all([
        axios.get('/api/ia/snapshot'),
        axios.get('/api/proveedores')
      ]);
      
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (provRes.data.success) setProveedores(provRes.data.data);
    } catch (e) {
      toast.error('Error cargando datos del simulador');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Simulación Reactiva
  const simulatedData = useMemo(() => {
    // 1. Calcular cantidades necesarias base
    let items = products.map(p => {
      const unitPrice = Number(p.precio) || 1000; // Fallback si no hay precio
      const needed = Math.max(0, Math.ceil((p.velocity * days) - p.stock_actual));
      const cost = needed * (unitPrice / 1.3); // Estimamos costo como 70% del precio
      return {
        ...p,
        needed,
        simulatedCost: Math.round(cost),
        isExcludedManual: excludedIds.has(p.id_producto)
      };
    });

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
  }, [products, days, budget, excludedIds]);

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
    } catch (e) {
      toast.error('Error al convertir simulación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full shadow-lg"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 max-w-[1600px] mx-auto space-y-8 animate-fade-in font-outfit">
      
      {/* HEADER ESTRATÉGICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-200">
              🧪
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Simulador de Escenarios</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-2 py-0.5 rounded-full inline-block">Proyecta tus futuras compras</p>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-400 max-w-xl">
            Ajusta cuántos días quieres cubrir y tu presupuesto para ver exactamente qué deberías comprar antes de gastar dinero en la vida real.
          </p>
        </div>
        
        <button 
          onClick={() => setShowConvertModal(true)}
          disabled={simulatedData.activeCount === 0}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
          <span>📦</span> Convertir en Orden Real
        </button>
      </div>

      {/* PANEL DE CONTROL (SLIDERS) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Controles */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Slider Cobertura */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Días de Cobertura Deseada</label>
              <span className="text-3xl font-black text-indigo-600">{days} <span className="text-sm text-slate-400">días</span></span>
            </div>
            <input 
              type="range" 
              min="7" 
              max="90" 
              step="1"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase italic">
              <span>7 días (Mín)</span>
              <span>45 días (Med)</span>
              <span>90 días (Máx)</span>
            </div>
          </div>

          {/* Input Presupuesto */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Presupuesto Máximo de Compra</label>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input 
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-800 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              ⚠️ Si el presupuesto no te alcanza, el sistema priorizará la compra de los productos que te dejan más ganancia (Tipo A).
            </p>
          </div>
        </div>

        {/* Resumen KPIs */}
        <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl shadow-indigo-200 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Costo Total Simulado</p>
            <h2 className="text-4xl font-black tracking-tighter">${simulatedData.totalCost.toLocaleString()}</h2>
            
            <div className="mt-6 flex gap-4">
              <div className="bg-white/10 rounded-xl p-3 flex-grow border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Items Incluidos</p>
                <p className="text-xl font-black">{simulatedData.activeCount}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 flex-grow border border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Excluidos</p>
                <p className="text-xl font-black text-rose-300">{simulatedData.excludedCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase">
              <span>Uso del Presupuesto</span>
              <span>{Math.round((simulatedData.totalCost / (budget || 1)) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${simulatedData.totalCost > budget ? 'bg-rose-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min(100, (simulatedData.totalCost / (budget || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="text-xl font-black text-slate-800 leading-none uppercase tracking-tighter italic">¿Qué y cuánto comprar?</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculado a partir de tu ritmo de ventas mensual</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="p-6 border-b border-slate-100 w-16">Inc.</th>
                <th className="p-6 border-b border-slate-100">Producto</th>
                <th className="p-6 border-b border-slate-100 text-center">Tipo</th>
                <th className="p-6 border-b border-slate-100 text-center">Reserva</th>
                <th className="p-6 border-b border-slate-100 text-center">Ventas / Día</th>
                <th className="p-6 border-b border-slate-100 text-center">Alcanza Para</th>
                <th className="p-6 border-b border-slate-100 text-center text-emerald-600">Comprar ({days}d)</th>
                <th className="p-6 border-b border-slate-100 text-right">Inversión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {simulatedData.items.map(p => (
                <tr 
                  key={p.id_producto} 
                  className={`group transition-all duration-300 ${
                    !p.activeInSim 
                      ? 'opacity-75 bg-slate-50/40 grayscale-[0.5]' 
                      : 'bg-white border-l-4 border-l-emerald-500 shadow-[2px_0_15px_rgba(0,0,0,0.05)] relative z-10 scale-[1.01]'
                  } hover:bg-slate-50/80`}
                >
                  <td className="p-6 text-center">
                    <input 
                      type="checkbox" 
                      checked={p.activeInSim && !p.isExcludedManual}
                      onChange={() => toggleManualExclusion(p.id_producto)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 uppercase leading-none">{p.nombre}</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1">{p.categoria}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black whitespace-nowrap ${
                      p.category === 'A' ? 'bg-indigo-100 text-indigo-700' : 
                      p.category === 'B' ? 'bg-slate-100 text-slate-600' : 
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {p.category === 'A' ? 'A (Alta)' : p.category === 'B' ? 'B (Media)' : 'C (Baja)'}
                    </span>
                  </td>
                  <td className="p-6 text-center text-sm font-bold text-slate-600">{(Number(p.stock_actual) || 0)} ud</td>
                  <td className="p-6 text-center text-sm font-bold text-slate-400 italic">{(Number(p.velocity) || 0).toFixed(1)} /día</td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-black ${
                        p.days_to_exhaust < 7 ? 'text-rose-500' : 
                        p.days_to_exhaust < 15 ? 'text-amber-500' : 'text-emerald-500'
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
                    <div className={`inline-block px-4 py-2 rounded-xl border-2 font-black text-lg transition-all ${
                      p.needed > 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-300'
                    }`}>
                      {p.needed} <span className="text-[10px] uppercase">ud</span>
                    </div>
                    {p.isExcludedBudget && (
                      <p className="text-[8px] font-black text-rose-500 uppercase mt-1">Fuera de Presupuesto</p>
                    )}
                  </td>
                  <td className="p-6 text-right font-black text-slate-700">
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowConvertModal(false)}></div>
          
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-scale-in border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Confirmar Ejecución</h2>
                <p className="text-xs font-bold text-slate-400">Selecciona el proveedor para procesar la orden.</p>
              </div>
              <button onClick={() => setShowConvertModal(false)} className="text-2xl text-slate-300 hover:text-rose-500 transition-colors">×</button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-xs font-black uppercase text-slate-500 mb-4">
                  <span>Resumen de Simulación</span>
                  <span>{days} días</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-600">Total a Invertir</span>
                  <span className="text-3xl font-black text-indigo-600">${simulatedData.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Proveedor</label>
                <div className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:border-indigo-500 transition-all">
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
                <p className="text-[10px] text-slate-400 font-bold italic ml-1">
                  * Solo se incluirán los productos de la simulación vinculados al proveedor elegido.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleConvertToOrder}
                  disabled={isSubmitting || !selectedSupplierId}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '✓'} 
                  Confirmar y Crear Orden
                </button>
                <button 
                  onClick={() => setShowConvertModal(false)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all"
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
