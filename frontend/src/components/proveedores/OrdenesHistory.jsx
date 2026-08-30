import { ScrollText, Mail, Banknote, AlertTriangle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const OrdenesHistory = ({
  ordenesHistory,
  loadingHistory,
  showHistoryDetail,
  setShowHistoryDetail,
  ordenDetail,
  fetchOrderDetail,
  handleRegisterPayment,
  handleSendToSupplier,
  isSendingEmail,
  emailMessage,
  setEmailMessage,
  onUpdateEstado
}) => {
  return (
    <div className="relative z-10 pt-10 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <ScrollText size={24} className="text-slate-700" />
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Historial de Órdenes a Proveedores</h2>
      </div>
      
      {loadingHistory ? (
        <div className="h-40 bg-white rounded-3xl animate-pulse"></div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
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
        </div>
      )}

      {/* DETAIL MODAL */}
      {showHistoryDetail && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" role="presentation" aria-hidden="true" onClick={() => setShowHistoryDetail(null)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl relative z-10 overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 uppercase italic">Detalle de Orden #{showHistoryDetail.id_orden}</h2>
              <button onClick={() => setShowHistoryDetail(null)} aria-label="Cerrar detalle" className="text-2xl text-slate-400 hover:text-rose-500 transition-colors">×</button>
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
                  onClick={() => onUpdateEstado(showHistoryDetail.id_orden, 'Rechazada')}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 transition-colors transition-transform active:scale-95"
                >
                  ✕ Rechazar
                </button>
                <button
                  onClick={() => onUpdateEstado(showHistoryDetail.id_orden, 'Aprobada')}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors transition-shadow transition-transform active:scale-95"
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
                    aria-label="Mensaje para el proveedor"
                    className="w-full p-4 bg-white border border-emerald-200 rounded-2xl text-sm text-slate-700 outline-none focus:border-emerald-500 resize-none placeholder:text-slate-400"
                    rows={2}
                  />
                  <button
                    onClick={() => handleSendToSupplier(showHistoryDetail.id_orden)}
                    disabled={isSendingEmail}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-colors transition-shadow transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default OrdenesHistory;
