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
      <div className="absolute inset-0 bg-tinta/60 backdrop-blur-sm" role="presentation" aria-hidden="true" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-lg relative z-10 flex flex-col overflow-hidden animate-scale-in border border-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="titular text-2xl text-tinta">Orden a: {supplier.nombre_empresa}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">Sugerencia del Asistente de Compras</p>
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
                <h4 className={`font-bold text-xs ${riskEval.nivel === 'Bajo' ? 'text-exito' : 'text-peligro'}`}>
                  Alerta del Pedido: {riskEval.nivel === 'Bajo' ? 'Normal' : riskEval.nivel === 'Medio' ? 'Atención' : 'Crítica'}
                </h4>
                <p className="text-sm font-bold text-slate-600 mt-1">{riskEval.justificacion}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400">Presupuesto Estimado</p>
                <p className="text-xl font-bold text-tinta">${riskEval.costo_total_estimado.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* PRODUCTS LIST */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-400 mb-4">
                  {smartCart && <th className="p-4 border-b border-slate-100 w-10">INC.</th>}
                  <th className="p-4 border-b border-slate-100">Producto</th>
                  <th className="p-4 border-b border-slate-100">Prioridad</th>
                  <th className="p-4 border-b border-slate-100 text-center">Cálculo Básico</th>
                  {smartCart && <th className="p-4 border-b border-slate-100 text-center bg-azul/10 text-azul">Sugerencia IA</th>}
                  <th className="p-4 border-b border-slate-100 text-center text-exito border-x">Cantidad a Pedir</th>
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
                          className="w-4 h-4 rounded border-slate-300 text-azul focus:ring-azul/30"
                        />
                      </td>
                    )}
                    <td className="p-4 max-w-xs">
                      <p className="text-sm font-bold text-tinta">{item.nombre}</p>
                      {item.razon_ia && item.incluido && <p className="text-xs leading-tight font-bold text-azul mt-1">"{item.razon_ia}"</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.clasificacion_abc === 'A' ? 'bg-azul/10 text-azul' : 'bg-slate-100 text-slate-500'}`}>
                        TIPO {item.clasificacion_abc}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm font-bold text-slate-400">
                      {item.cantidad_sugerida !== undefined ? item.cantidad_sugerida : item.calculo_base} ud
                    </td>
                    {smartCart && (
                      <td className="p-4 text-center font-bold text-azul bg-azul/10">
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
                          className="w-20 bg-transparent text-center font-bold text-exito text-lg border-b-2 border-emerald-200 focus:border-emerald-500 outline-none"
                        />
                      ) : (
                        <span className="font-bold text-exito text-lg">{item.cantidad_sugerida}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(smartCart || forecastData).length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-sm font-bold text-slate-400">
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
                className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-3 rounded-lg text-xs font-bold transition-colors transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Crear Orden sin IA'}
              </button>
              <button
                onClick={requestCopilot}
                disabled={isConsultingAI || forecastData.length === 0}
                className="bg-azul hover:bg-azul-hondo text-white px-8 py-3 rounded-lg text-xs font-bold shadow-lg transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isConsultingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={14} />}
                {isConsultingAI ? 'Pensando...' : 'Optimizar con IA'}
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setSmartCart(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-4">
                Volver al original
              </button>
              <button 
                onClick={() => submitFinalOrder()}
                disabled={isSubmitting}
                className={`text-white px-8 py-3 rounded-lg text-xs font-bold shadow-lg transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 ${
                  riskEval?.nivel === 'Bajo' 
                    ? 'bg-emerald-500 hover:bg-exito' 
                    : 'bg-ambar hover:bg-amber-600'
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
