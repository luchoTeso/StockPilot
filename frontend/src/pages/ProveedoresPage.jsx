import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useSidebar } from '../context/SidebarContext';
import { Building2, Plus, Pencil, Trash2, Package, Loader2, CheckCircle2, Sparkles, ScrollText, Mail, Banknote, AlertTriangle, Zap, Wallet } from 'lucide-react';

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  
  // Modals state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  
  const [smartCart, setSmartCart] = useState(null); // Data if AI has been invoked
  const [riskEval, setRiskEval] = useState(null);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [isConsultingAI, setIsConsultingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // History state
  const [ordenesHistory, setOrdenesHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryDetail, setShowHistoryDetail] = useState(null);
  const [ordenDetail, setOrdenDetail] = useState([]);
  
  // Supplier CRUD state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    id_proveedor: '',
    nombre_empresa: '',
    contacto_principal: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Email sending state
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ ordenId: null, total: 0, currentPaid: 0 });
  const [manualAmount, setManualAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchProveedores();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/ordenes/historial');
      if (res.data.success) setOrdenesHistory(res.data.data);
    } catch (e) {
      console.error('Error cargando historial:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/proveedores');
      if (res.data.success) {
        setProveedores(res.data.data);
      }
    } catch (e) {
      toast.error('Error cargando la lista de proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForecast = async (proveedor) => {
    setSelectedSupplier(proveedor);
    setSmartCart(null);
    setRiskEval(null);
    setForecastData([]);
    setIsForecastLoading(true);
    setShowOrderModal(true);
    try {
      const res = await axios.get(`/api/proveedores/${proveedor.id_proveedor}/forecast`);
      if (res.data.success) {
        setForecastData(res.data.recomendaciones_matematicas);
      }
    } catch (e) {
      toast.error('Error calculando la demanda base');
    } finally {
      setIsForecastLoading(false);
    }
  };

  const requestCopilot = async () => {
    if (forecastData.length === 0) return toast.info('No hay productos críticos para recomendar.');
    
    setIsConsultingAI(true);
    try {
      const res = await axios.post(`/api/proveedores/${selectedSupplier.id_proveedor}/ai-copilot`, {
        recomendaciones_matematicas: forecastData,
        presupuesto_maximo: 5000000 // Presupuesto quemado para efectos de demo
      });
      if (res.data.success) {
        // Inicializar smartCart con campo 'incluido'
        const cartWithFlags = res.data.carrito_inteligente.map(i => ({ ...i, incluido: true }));
        setSmartCart(cartWithFlags);
        setRiskEval(res.data.evaluacion_riesgo);
        toast.success('El Copiloto IA ha analizado el carrito exitosamente.');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Falló la consulta al Oráculo IA');
    } finally {
      setIsConsultingAI(false);
    }
  };

  const handleToggleItem = (productId) => {
    const updated = smartCart.map(item => 
      item.id_producto === productId ? { ...item, incluido: !item.incluido } : item
    );
    setSmartCart(updated);
    recalculateRisk(updated);
  };

  const handleEditQty = (productId, newQty) => {
    const qty = parseInt(newQty) || 0;
    const updated = smartCart.map(item => {
      if (item.id_producto === productId) {
        const unitCost = item.presupuesto_estimado_final / (item.sugerencia_final || 1);
        return { 
          ...item, 
          sugerencia_final: qty, 
          presupuesto_estimado_final: Math.round(qty * unitCost)
        };
      }
      return item;
    });
    setSmartCart(updated);
    recalculateRisk(updated);
  };

  const recalculateRisk = (currentCart) => {
    const included = currentCart.filter(i => i.incluido);
    const total = included.reduce((acc, curr) => acc + curr.presupuesto_estimado_final, 0);
    const criticalCount = included.filter(i => i.nivel_riesgo === 'critical').length;
    
    let level = 'Bajo';
    let reason = 'Optimizado manualmente.';
    
    if (total > 5000000) {
      level = 'Alto';
      reason = 'El costo total excede el presupuesto estratégico.';
    } else if (criticalCount > 0) {
      level = 'Medio';
      reason = `Contiene ${criticalCount} ítems con stock crítico.`;
    }

    setRiskEval({
      nivel: level,
      justificacion: reason,
      costo_total_estimado: total
    });
  };

  const fetchOrderDetail = async (orden) => {
    setShowHistoryDetail(orden);
    try {
      const res = await axios.get(`/api/ordenes/${orden.id_orden}`);
      if (res.data.success) setOrdenDetail(res.data.rows || res.data.data);
    } catch (e) {
      toast.error('No se pudo cargar el detalle');
    }
  };

  const submitFinalOrder = async (sinIA = false) => {
    setIsSubmitting(true);
    try {
      let includedItems, riskData;

      if (sinIA || !smartCart) {
        includedItems = forecastData.map(i => ({
          ...i,
          sugerencia_final: i.cantidad_sugerida,
          calculo_base: i.cantidad_sugerida,
          ajuste_ia: '+0%',
          razon_ia: 'Orden manual sin optimización IA.',
          presupuesto_estimado_final: i.presupuesto_estimado,
          incluido: true
        }));
        riskData = {
          nivel: 'Bajo',
          justificacion: 'Orden manual generada sin análisis IA.',
          costo_total_estimado: forecastData.reduce((acc, i) => acc + i.presupuesto_estimado, 0)
        };
      } else {
        includedItems = smartCart.filter(i => i.incluido);
        riskData = riskEval;
      }

      if (includedItems.length === 0) return toast.error('Debe incluir al menos un producto.');

      const res = await axios.post(`/api/proveedores/${selectedSupplier.id_proveedor}/ordenes`, {
        carrito_final: includedItems,
        evaluacion_riesgo: riskData,
        estado_deseado: riskData.nivel === 'Bajo' ? 'Aprobada' : 'Pendiente'
      });
      if (res.data.success) {
        const ordenId = res.data.orden_id;
        if (riskData.nivel === 'Bajo') {
          try {
            await axios.post(`/api/ordenes/${ordenId}/enviar-proveedor`);
            toast.success(`Orden #${ordenId} aprobada y enviada al proveedor automáticamente.`);
          } catch {
            toast.success(`Orden #${ordenId} creada y aprobada.`);
            toast.warning('No se pudo enviar el email. Verifica que el proveedor tenga correo registrado.');
          }
        } else {
          toast.success(`Orden #${ordenId} enviada a revisión.`);
        }
        setShowOrderModal(false);
        fetchHistory();
      }
    } catch (e) {
      toast.error('Ocurrió un error guardando la Orden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToSupplier = async (ordenId) => {
    setIsSendingEmail(true);
    try {
      const res = await axios.post(`/api/ordenes/${ordenId}/enviar-proveedor`, {
        mensaje_personalizado: emailMessage || ''
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setEmailMessage('');
        // Actualizar localmente para feedback inmediato
        setOrdenesHistory(prev => prev.map(o => o.id_orden === ordenId ? { ...o, estado: 'Enviada' } : o));
        if (showHistoryDetail && showHistoryDetail.id_orden === ordenId) {
          setShowHistoryDetail(prev => ({ ...prev, estado: 'Enviada' }));
        }
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al enviar la orden por correo');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRegisterPayment = (ordenId, total, currentPaid) => {
    const remaining = total - currentPaid;
    setPaymentData({ ordenId, total, currentPaid });
    setManualAmount(remaining.toString());
    setShowPaymentModal(true);
  };

  const confirmPayment = async (amount) => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return toast.error('Monto inválido.');
    
    setIsPaying(true);
    try {
      const res = await axios.post(`/api/proveedores/ordenes/${paymentData.ordenId}/pay`, { monto: amountNum });
      if (res.data.success) {
        toast.success(`Pago de $${amountNum.toLocaleString()} registrado con éxito.`);
        setShowPaymentModal(false);
        fetchHistory();
        fetchProveedores();
        if (showHistoryDetail && showHistoryDetail.id_orden === paymentData.ordenId) {
           setShowHistoryDetail(null);
        }
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al registrar pago');
    } finally {
      setIsPaying(false);
    }
  };

  const handleOpenSupplierModal = (supplier = null) => {
    if (supplier) {
      setIsEditingSupplier(true);
      setSupplierFormData({
        id_proveedor: supplier.id_proveedor,
        nombre_empresa: supplier.nombre_empresa || '',
        contacto_principal: supplier.contacto_principal || '',
        email: supplier.email || '',
        telefono: supplier.telefono || '',
        direccion: supplier.direccion || ''
      });
    } else {
      setIsEditingSupplier(false);
      setSupplierFormData({
        id_proveedor: '',
        nombre_empresa: '',
        contacto_principal: '',
        email: '',
        telefono: '',
        direccion: ''
      });
    }
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setSupplierLoading(true);
    try {
      if (isEditingSupplier) {
        await axios.put(`/api/proveedores/${supplierFormData.id_proveedor}`, supplierFormData);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await axios.post('/api/proveedores', supplierFormData);
        toast.success('Nuevo proveedor registrado');
      }
      setShowSupplierModal(false);
      fetchProveedores();
    } catch (error) {
      toast.error('Error al guardar el proveedor');
    } finally {
      setSupplierLoading(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
    setSupplierLoading(true);
    try {
      await axios.delete(`/api/proveedores/${id}`);
      toast.success('Proveedor inhabilitado');
      setSupplierToDelete(null);
      fetchProveedores();
    } catch (error) {
      toast.error('No se pudo inhabilitar el proveedor');
    } finally {
      setSupplierLoading(false);
    }
  };

  return (
    <div className="pb-32 space-y-8 animate-fade-in font-outfit">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner border border-indigo-200">
              <Building2 size={20} />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Red de Proveedores</h1>
          </div>
          <p className="text-sm font-bold text-slate-400 max-w-xl">
            Gestiona tus compras apoyado en el Copiloto IA. Revisa qué productos necesitas pedir y genera tus órdenes de abastecimiento al instante.
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenSupplierModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95 z-20"
        >
          <Plus size={14} /> Registrar Proveedor
        </button>
      </div>

      {/* SUPPLIERS GRID */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {proveedores.map(p => (
            <div key={p.id_proveedor} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all hover:-translate-y-1">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{p.nombre_empresa}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenSupplierModal(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm hover:shadow-indigo-100 transition-all active:scale-90"
                      title="Editar Proveedor"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setSupplierToDelete(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm hover:shadow-rose-100 transition-all active:scale-90"
                      title="Eliminar Proveedor"
                    >
                        <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                  <Package size={14} /> {p.productos_vinculados} Productos Vinculados
                </p>
                <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Deuda Pendiente</p>
                  <p className="text-sm font-black text-rose-600">${(p.total_deuda || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleOpenForecast(p)}
                className="mt-6 w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Calcular Pedido ⚡
              </button>
            </div>
          ))}
          {proveedores.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-slate-300">
              No hay proveedores registrados.
            </div>
          )}
        </div>
      )}

      {/* SMART ORDER MODAL */}
      {showOrderModal && selectedSupplier && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowOrderModal(false)}></div>
          
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-scale-in border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Orden a: {selectedSupplier.nombre_empresa}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sugerencia del Asistente de Compras</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="w-8 h-8 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto scrollbar-premium flex-1 space-y-6 bg-slate-50/50">
              
              {/* STATUS CARD (RISK ENGINE) */}
              {riskEval && (
                <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${riskEval.nivel === 'Bajo' ? 'bg-emerald-50 border-emerald-200' : (riskEval.nivel === 'Alto' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200')}`}>
                  <div>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${riskEval.nivel === 'Bajo' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Alerta del Pedido: {riskEval.nivel === 'Bajo' ? 'Normal' : riskEval.nivel === 'Medio' ? 'Atención' : 'Crítica'}
                    </h4>
                    <p className="text-sm font-bold text-slate-600 mt-1">{riskEval.justificacion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presupuesto Estimado</p>
                    <p className="text-xl font-black text-slate-800">${riskEval.costo_total_estimado.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* PRODUCTS LIST */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      {smartCart && <th className="p-4 border-b border-slate-100 w-10">INC.</th>}
                      <th className="p-4 border-b border-slate-100">Producto</th>
                      <th className="p-4 border-b border-slate-100">Prioridad</th>
                      <th className="p-4 border-b border-slate-100 text-center">Cálculo Básico</th>
                      {smartCart && <th className="p-4 border-b border-slate-100 text-center bg-indigo-50 text-indigo-500">Sugerencia IA</th>}
                      <th className="p-4 border-b border-slate-100 text-center text-emerald-600 border-x">Cantidad a Pedir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(smartCart || forecastData).map(item => (
                      <tr key={item.id_producto} className={`border-b last:border-0 border-slate-50 transition-colors ${smartCart && !item.incluido ? 'opacity-40 grayscale' : 'hover:bg-slate-50/50'}`}>
                        {smartCart && (
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={item.incluido} 
                              onChange={() => handleToggleItem(item.id_producto)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                        )}
                        <td className="p-4 max-w-xs">
                          <p className="text-sm font-black text-slate-800">{item.nombre}</p>
                          {item.razon_ia && item.incluido && <p className="text-[10px] leading-tight font-bold text-indigo-500 mt-1 italic">"{item.razon_ia}"</p>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.clasificacion_abc === 'A' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            TIPO {item.clasificacion_abc}
                          </span>
                        </td>
                        <td className="p-4 text-center text-sm font-bold text-slate-400 italic">
                          {item.cantidad_sugerida !== undefined ? item.cantidad_sugerida : item.calculo_base} ud
                        </td>
                        {smartCart && (
                          <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/30">
                            {item.ajuste_ia}
                          </td>
                        )}
                        <td className="p-4 text-center border-x border-slate-50 bg-emerald-50/20">
                          {smartCart ? (
                            <input 
                              type="number"
                              disabled={!item.incluido}
                              value={item.sugerencia_final}
                              onChange={(e) => handleEditQty(item.id_producto, e.target.value)}
                              className="w-20 bg-transparent text-center font-black text-emerald-600 text-lg border-b-2 border-emerald-200 focus:border-emerald-500 outline-none"
                            />
                          ) : (
                            <span className="font-black text-emerald-600 text-lg">{item.cantidad_sugerida}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(smartCart || forecastData).length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-sm font-bold text-slate-400 italic uppercase tracking-widest">
                          {isForecastLoading
                            ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Calculando recomendaciones...</span>
                            : <span className="flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Todos los productos tienen stock suficiente o no hay productos vinculados a este proveedor.</span>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer Align Action */}
            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 justify-end items-center">
              {!smartCart ? (
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => submitFinalOrder(true)}
                    disabled={isSubmitting || forecastData.length === 0}
                    className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Crear Orden sin IA'}
                  </button>
                  <button
                    onClick={requestCopilot}
                    disabled={isConsultingAI || forecastData.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isConsultingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={14} />}
                    {isConsultingAI ? 'Pensando...' : 'Optimizar con IA'}
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setSmartCart(null)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest px-4">
                    Volver al original
                  </button>
                  <button 
                    onClick={submitFinalOrder}
                    disabled={isSubmitting}
                    className={`text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                      riskEval?.nivel === 'Bajo' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                        : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                    }`}
                  >
                    {isSubmitting ? 'Procesando...' : (riskEval?.nivel === 'Bajo' ? '✓ Aprobar y Enviar al Proveedor' : 'Enviar a Revisión')}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
      {/* HISTORY PANEL */}
      <div className="relative z-10 pt-10 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <ScrollText size={24} className="text-slate-700" />
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Historial de Órdenes a Proveedores</h2>
        </div>
        
        {loadingHistory ? (
          <div className="h-40 bg-white rounded-3xl animate-pulse"></div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-5">Fecha</th>
                  <th className="p-5">Proveedor</th>
                  <th className="p-5">Alerta</th>
                  <th className="p-5">Costo Total</th>
                  <th className="p-5">Saldo Pendiente</th>
                  <th className="p-5">Estado Logístico</th>
                  <th className="p-5">Estado de Pago</th>
                  <th className="p-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ordenesHistory.map(o => (
                  <tr key={o.id_orden} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-xs font-bold text-slate-500">{new Date(o.fecha_creacion).toLocaleDateString()}</td>
                    <td className="p-5 text-sm font-black text-slate-800">{o.proveedor_nombre}</td>
                    <td className="p-5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${o.riesgo === 'Alto' ? 'bg-rose-100 text-rose-600' : (o.riesgo === 'Medio' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}`}>
                        {o.riesgo}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-black text-slate-700">${o.presupuesto_total.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={`text-sm font-black ${o.saldo_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${(o.saldo_pendiente || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        o.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-600' : 
                        o.estado === 'Rechazada' ? 'bg-rose-50 text-rose-600' : 
                        o.estado === 'Enviada' ? 'bg-indigo-50 text-indigo-600' : 
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {o.estado === 'Enviada' ? <span className="flex items-center gap-1"><Mail size={12} /> Enviada</span> : o.estado}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        o.estado_pago === 'Pagado' ? 'bg-emerald-100 text-emerald-600' : 
                        o.estado_pago === 'Abonado' ? 'bg-amber-100 text-amber-600' : 
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {o.estado_pago || 'Pendiente Pago'}
                      </span>
                    </td>
                    <td className="p-5 text-right flex items-center justify-end gap-4">
                      {o.saldo_pendiente > 0 && (
                        <button
                          onClick={() => handleRegisterPayment(o.id_orden, o.presupuesto_total, o.monto_pagado)}
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-widest border-b border-emerald-200 flex items-center gap-1"
                        >
                          <Banknote size={12} /> Pagar
                        </button>
                      )}
                      <button 
                        onClick={() => fetchOrderDetail(o)}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                      >
                        Revisar Pedido →
                      </button>
                    </td>
                  </tr>
                ))}
                {ordenesHistory.length === 0 && (
                  <tr><td colSpan="6" className="p-10 text-center text-sm font-bold text-slate-400 italic uppercase">No hay órdenes registradas aún.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showHistoryDetail && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowHistoryDetail(null)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 uppercase italic">Detalle de Orden #{showHistoryDetail.id_orden}</h2>
              <button onClick={() => setShowHistoryDetail(null)} className="text-2xl text-slate-400 hover:text-rose-500 transition-colors">×</button>
            </div>

            {/* Metadata de la orden */}
            <div className="px-6 pt-5 pb-3 grid grid-cols-3 gap-3">
              <div className="col-span-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{showHistoryDetail.proveedor_nombre}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{(() => { const r = (showHistoryDetail.fecha_creacion || '').split('T')[0]; const [y,m,d] = r.split('-'); return (y && m && d) ? `${d}/${m}/${y}` : r; })()}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Presupuesto</p>
                <p className="text-sm font-black text-slate-800 mt-1">${showHistoryDetail.presupuesto_total?.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl p-3 border ${showHistoryDetail.estado === 'Aprobada' ? 'bg-emerald-50 border-emerald-200' : showHistoryDetail.estado === 'Rechazada' ? 'bg-rose-50 border-rose-200' : showHistoryDetail.estado === 'Enviada' ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                <p className={`text-sm font-black mt-1 flex items-center gap-1 ${showHistoryDetail.estado === 'Aprobada' ? 'text-emerald-600' : showHistoryDetail.estado === 'Rechazada' ? 'text-rose-600' : showHistoryDetail.estado === 'Enviada' ? 'text-indigo-600' : 'text-amber-600'}`}>{showHistoryDetail.estado === 'Enviada' ? <><Mail size={14} /> Enviada</> : showHistoryDetail.estado}</p>
              </div>
            </div>

            <div className="px-6 pb-6 max-h-[40vh] overflow-y-auto scrollbar-premium">
              <div className="space-y-3">
                {ordenDetail.map(det => (
                  <div key={det.id_detalle} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase">{det.nombre_producto}</p>
                      <p className="text-[10px] font-bold text-slate-400">Base: {det.cantidad_base} ud → Final: <span className="text-emerald-600">{det.cantidad_final} ud</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase">Ajuste IA</p>
                      <p className="text-sm font-black text-indigo-600">{det.sugerencia_ia > 0 ? '+' : ''}{det.sugerencia_ia}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones de Revisión (solo para Pendiente/Borrador) */}
            {(showHistoryDetail.estado === 'Pendiente' || showHistoryDetail.estado === 'Borrador') && (
              <div className="p-5 border-t border-slate-100 bg-amber-50/50 flex gap-3 justify-end items-center">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mr-auto flex items-center gap-2">
                  <AlertTriangle size={14} /> Esta orden requiere su aprobación
                </span>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.patch(`/api/ordenes/${showHistoryDetail.id_orden}/estado`, { estado: 'Rechazada' });
                      if (res.data.success) {
                        toast.success('Orden rechazada correctamente.');
                        setShowHistoryDetail(null);
                        fetchHistory();
                      }
                    } catch (e) { toast.error(e.response?.data?.error || 'Error al rechazar'); }
                  }}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 transition-all active:scale-95"
                >
                  ✕ Rechazar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.patch(`/api/ordenes/${showHistoryDetail.id_orden}/estado`, { estado: 'Aprobada' });
                      if (res.data.success) {
                        toast.success('¡Orden aprobada! Lista para enviar al proveedor.');
                        setShowHistoryDetail(null);
                        fetchHistory();
                      }
                    } catch (e) { toast.error(e.response?.data?.error || 'Error al aprobar'); }
                  }}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  ✓ Autorizar Pedido
                </button>
              </div>
            )}

            {/* Estado final (para órdenes ya aprobadas o rechazadas) */}
            {showHistoryDetail.estado === 'Aprobada' && (
              <div className="p-5 border-t border-emerald-100 bg-emerald-50 space-y-4">
                <div className="text-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ Orden aprobada — Lista para enviar</span>
                </div>
                <div className="space-y-3">
                  <textarea
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    placeholder="Mensaje para el proveedor (opcional). Ej: Por favor confirmar disponibilidad y tiempo de entrega."
                    className="w-full p-4 bg-white border border-emerald-200 rounded-2xl text-sm text-slate-700 outline-none focus:border-emerald-500 resize-none placeholder:text-slate-400"
                    rows={2}
                  />
                  <button
                    onClick={() => handleSendToSupplier(showHistoryDetail.id_orden)}
                    disabled={isSendingEmail}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingEmail ? (
                      <><Loader2 size={16} className="animate-spin" /> Enviando correo...</>
                    ) : (
                      <><Mail size={16} /> Enviar Orden al Proveedor por Email</>
                    )}
                  </button>
                </div>
              </div>
            )}
            {showHistoryDetail.estado === 'Enviada' && (
              <div className="p-4 border-t border-indigo-100 bg-indigo-50 text-center">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-2"><Mail size={12} /> Orden enviada al proveedor por correo electrónico</span>
              </div>
            )}
            {showHistoryDetail.estado === 'Rechazada' && (
              <div className="p-4 border-t border-rose-100 bg-rose-50 text-center">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">✕ Orden rechazada</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      {/* SUPPLIER CRUD MODAL */}
      {showSupplierModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowSupplierModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-20 animate-scale-in border border-slate-100 overflow-hidden">
             <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">
                  {isEditingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>
                <button onClick={() => setShowSupplierModal(false)} className="text-2xl text-slate-400 hover:text-rose-500 transition-colors">&times;</button>
             </div>
             
             <form onSubmit={handleSaveSupplier} className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                  <input required type="text" value={supplierFormData.nombre_empresa} onChange={e => setSupplierFormData({...supplierFormData, nombre_empresa: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contacto Principal</label>
                        <input required type="text" value={supplierFormData.contacto_principal} onChange={e => setSupplierFormData({...supplierFormData, contacto_principal: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                        <input type="text" value={supplierFormData.telefono} onChange={e => setSupplierFormData({...supplierFormData, telefono: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500" />
                    </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" value={supplierFormData.email} onChange={e => setSupplierFormData({...supplierFormData, email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Física</label>
                  <input type="text" value={supplierFormData.direccion} onChange={e => setSupplierFormData({...supplierFormData, direccion: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500" />
                </div>
                
                <button 
                  disabled={supplierLoading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 animate-bounce-in mt-4"
                >
                  {supplierLoading ? 'Procesando...' : (isEditingSupplier ? 'Actualizar Datos' : 'Registrar Proveedor')}
                </button>
             </form>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {supplierToDelete && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSupplierToDelete(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-20 animate-scale-in border border-rose-100 overflow-hidden">
             <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100 shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">¿Confirmas la baja?</h3>
                   <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">
                     Vas a inhabilitar a <span className="text-rose-600">{supplierToDelete.nombre_empresa}</span>. Se mantendrá el registro histórico pero no podrás vincularlo a nuevos productos.
                   </p>
                </div>
                
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => handleDeleteSupplier(supplierToDelete.id_proveedor)}
                     className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-200 transition-all active:scale-95"
                   >
                     Sí, inhabilitar ahora
                   </button>
                   <button 
                     onClick={() => setSupplierToDelete(null)}
                     className="w-full py-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                   >
                     No, mantener activo
                   </button>
                </div>
             </div>
          </div>
        </div>,
        document.body
      )}
      {/* PAYMENT MODAL PREMIUM */}
      {showPaymentModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowPaymentModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[90vh] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] relative z-[160] animate-in zoom-in-95 duration-200 border border-white overflow-hidden flex flex-col">
            
            {/* Header Fijo */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-white relative shrink-0">
               <div className="absolute top-0 right-0 p-6 opacity-10 select-none pointer-events-none"><Banknote size={56} /></div>
               <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Registrar Pago</h3>
               <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-2 opacity-80">Orden de Compra #{paymentData.ordenId}</p>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-8 space-y-6 overflow-y-auto scrollbar-premium">
              <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 flex justify-between items-center shadow-inner">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
                <p className="text-2xl font-black text-rose-600 tracking-tighter">${(paymentData.total - paymentData.currentPaid).toLocaleString()}</p>
              </div>

              <div className="space-y-3 px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto a Abonar</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg transition-colors group-focus-within:text-emerald-500">$</span>
                  <input 
                    type="number" 
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full pl-10 p-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-lg font-black text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={() => confirmPayment(paymentData.total - paymentData.currentPaid)}
                  disabled={isPaying}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> LIQUIDAR DEUDA TOTAL: ${(paymentData.total - paymentData.currentPaid).toLocaleString()}
                </button>
                <button 
                  onClick={() => confirmPayment(manualAmount)}
                  disabled={isPaying}
                  className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 hover:border-emerald-600 hover:text-emerald-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
                >
                  {isPaying ? <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div> : <Wallet size={16} />}
                  {isPaying ? 'PROCESANDO...' : 'PROCESAR ABONO MANUAL'}
                </button>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isPaying}
                  className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors mt-2"
                >
                  Regresar al historial
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

export default ProveedoresPage;
