import { createPortal } from 'react-dom';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';

const SmartOrderModal = ({
  isOpen,
  onClose,
  supplier,
  smartCart,
  forecastData,
  riskEval,
  isForecastLoading,
  isConsultingAI,
  isSubmitting,
  handleToggleItem,
  handleEditQty,
  submitFinalOrder,
  requestCopilot,
  setSmartCart
}) => {
  if (!isOpen || !supplier) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" role="presentation" aria-hidden="true" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-scale-in border border-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Orden a: {supplier.nombre_empresa}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sugerencia del Asistente de Compras</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal" className="w-8 h-8 bg-slate-200 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
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
                          aria-label={`Incluir ${item.nombre} en la orden`}
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
                          aria-label={`Cantidad a pedir de ${item.nombre}`}
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
                className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-colors transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Orden sin IA'}
              </button>
              <button
                onClick={requestCopilot}
                disabled={isConsultingAI || forecastData.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
                onClick={() => submitFinalOrder()}
                disabled={isSubmitting}
                className={`text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 ${
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
  );
};

export default SmartOrderModal;
