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
        <ScrollText size={24} className="text-tinta-2" />
        <h2 className="titular text-2xl text-tinta">Historial de Órdenes a Proveedores</h2>
      </div>
      
      {loadingHistory ? (
        <div className="h-40 bg-white rounded-2xl animate-pulse"></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500">
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
                  <td className="p-5 text-sm font-bold text-tinta">{o.proveedor_nombre}</td>
                  <td className="p-5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${o.riesgo === 'Alto' ? 'bg-peligro-suave text-peligro' : (o.riesgo === 'Medio' ? 'bg-aviso-suave text-aviso' : 'bg-exito-suave text-exito')}`}>
                      {o.riesgo}
                    </span>
                  </td>
                  <td className="p-5 text-sm font-bold text-tinta-2">${o.presupuesto_total.toLocaleString()}</td>
                  <td className="p-5">
                    <span className={`text-sm font-bold ${o.saldo_pendiente > 0 ? 'text-peligro' : 'text-exito'}`}>
                      ${(o.saldo_pendiente || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      o.estado === 'Aprobada' ? 'bg-emerald-50 text-exito' : 
                      o.estado === 'Rechazada' ? 'bg-rose-50 text-peligro' : 
                      o.estado === 'Enviada' ? 'bg-azul/10 text-azul' : 
                      'bg-amber-50 text-aviso'
                    }`}>
                      {o.estado === 'Enviada' ? <span className="flex items-center gap-1"><Mail size={12} /> Enviada</span> : o.estado}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      o.estado_pago === 'Pagado' ? 'bg-exito-suave text-exito' : 
                      o.estado_pago === 'Abonado' ? 'bg-aviso-suave text-aviso' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {o.estado_pago || 'Pendiente Pago'}
                    </span>
                  </td>
                  <td className="p-5 text-right flex items-center justify-end gap-4">
                    {o.saldo_pendiente > 0 && (
                      <button
                        onClick={() => handleRegisterPayment(o.id_orden, o.presupuesto_total, o.monto_pagado)}
                        className="text-xs font-bold text-exito hover:text-emerald-800 border-b border-emerald-200 flex items-center gap-1"
                      >
                        <Banknote size={12} /> Pagar
                      </button>
                    )}
                    <button 
                      onClick={() => fetchOrderDetail(o)}
                      className="text-xs font-bold text-azul hover:text-azul"
                    >
                      Revisar Pedido →
                    </button>
                  </td>
                </tr>
              ))}
              {ordenesHistory.length === 0 && (
                <tr><td colSpan="6" className="p-10 text-center text-sm font-bold text-slate-500">No hay órdenes registradas aún.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showHistoryDetail && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-tinta/60 backdrop-blur-sm" role="presentation" aria-hidden="true" onClick={() => setShowHistoryDetail(null)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-lg relative z-10 overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="titular text-xl text-tinta">Detalle de Orden #{showHistoryDetail.id_orden}</h2>
              <button onClick={() => setShowHistoryDetail(null)} aria-label="Cerrar detalle" className="text-2xl text-slate-500 hover:text-rose-500 transition-colors">×</button>
            </div>

            {/* Metadata de la orden */}
            <div className="px-6 pt-5 pb-3 grid grid-cols-3 gap-3">
              <div className="col-span-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Proveedor</p>
                <p className="text-sm font-bold text-tinta mt-1">{showHistoryDetail.proveedor_nombre}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Fecha</p>
                <p className="text-sm font-bold text-tinta mt-1">{(() => { const r = (showHistoryDetail.fecha_creacion || '').split('T')[0]; const [y,m,d] = r.split('-'); return (y && m && d) ? `${d}/${m}/${y}` : r; })()}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-500">Presupuesto</p>
                <p className="text-sm font-bold text-tinta mt-1">${showHistoryDetail.presupuesto_total?.toLocaleString()}</p>
              </div>
              <div className={`rounded-2xl p-3 border ${showHistoryDetail.estado === 'Aprobada' ? 'bg-emerald-50 border-emerald-200' : showHistoryDetail.estado === 'Rechazada' ? 'bg-rose-50 border-rose-200' : showHistoryDetail.estado === 'Enviada' ? 'bg-azul/10 border-azul/30' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-xs font-bold text-slate-500">Estado</p>
                <p className={`text-sm font-bold mt-1 flex items-center gap-1 ${showHistoryDetail.estado === 'Aprobada' ? 'text-exito' : showHistoryDetail.estado === 'Rechazada' ? 'text-peligro' : showHistoryDetail.estado === 'Enviada' ? 'text-azul' : 'text-aviso'}`}>{showHistoryDetail.estado === 'Enviada' ? <><Mail size={14} /> Enviada</> : showHistoryDetail.estado}</p>
              </div>
            </div>

            <div className="px-6 pb-6 max-h-[40vh] overflow-y-auto scrollbar-premium">
              <div className="space-y-3">
                {ordenDetail.map(det => (
                  <div key={det.id_detalle} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-tinta">{det.nombre_producto}</p>
                      <p className="text-xs font-bold text-slate-500">Base: {det.cantidad_base} ud → Final: <span className="text-exito">{det.cantidad_final} ud</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500">Ajuste IA</p>
                      <p className="text-sm font-bold text-azul">{det.sugerencia_ia > 0 ? '+' : ''}{det.sugerencia_ia}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones de Revisión (solo para Pendiente/Borrador) */}
            {(showHistoryDetail.estado === 'Pendiente' || showHistoryDetail.estado === 'Borrador') && (
              <div className="p-5 border-t border-slate-100 bg-amber-50/50 flex gap-3 justify-end items-center">
                <span className="text-xs font-bold text-aviso mr-auto flex items-center gap-2">
                  <AlertTriangle size={14} /> Esta orden requiere su aprobación
                </span>
                <button
                  onClick={() => onUpdateEstado(showHistoryDetail.id_orden, 'Rechazada')}
                  className="px-6 py-3 rounded-lg text-xs font-bold bg-peligro-suave text-peligro hover:bg-rose-500 hover:text-white border border-rose-200 transition-colors transition-transform active:scale-95"
                >
                  ✕ Rechazar
                </button>
                <button
                  onClick={() => onUpdateEstado(showHistoryDetail.id_orden, 'Aprobada')}
                  className="px-6 py-3 rounded-lg text-xs font-bold bg-exito text-white hover:bg-emerald-700 shadow-lg transition-colors transition-shadow transition-transform active:scale-95"
                >
                  ✓ Autorizar Pedido
                </button>
              </div>
            )}

            {/* Estado final (para órdenes ya aprobadas o rechazadas) */}
            {showHistoryDetail.estado === 'Aprobada' && (
              <div className="p-5 border-t border-exito-suave bg-emerald-50 space-y-4">
                <div className="text-center">
                  <span className="text-xs font-bold text-exito">✓ Orden aprobada — Lista para enviar</span>
                </div>
                <div className="space-y-3">
                  <textarea
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    placeholder="Mensaje para el proveedor (opcional). Ej: Por favor confirmar disponibilidad y tiempo de entrega."
                    aria-label="Mensaje para el proveedor"
                    className="w-full p-4 bg-white border border-emerald-200 rounded-lg text-sm text-tinta-2 outline-none focus:border-emerald-500 resize-none placeholder:text-slate-500"
                    rows={2}
                  />
                  <button
                    onClick={() => handleSendToSupplier(showHistoryDetail.id_orden)}
                    disabled={isSendingEmail}
                    className="w-full py-4 bg-azul hover:bg-azul-hondo text-white rounded-lg text-xs font-bold shadow-lg transition-colors transition-shadow transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="p-4 border-t border-azul/30 bg-azul/10 text-center">
                <span className="text-xs font-bold text-azul flex items-center justify-center gap-2"><Mail size={12} /> Orden enviada al proveedor por correo electrónico</span>
              </div>
            )}
            {showHistoryDetail.estado === 'Rechazada' && (
              <div className="p-4 border-t border-peligro-suave bg-rose-50 text-center">
                <span className="text-xs font-bold text-peligro">✕ Orden rechazada</span>
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
