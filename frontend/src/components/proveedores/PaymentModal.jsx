import { Banknote, Zap, Wallet } from 'lucide-react';
import { createPortal } from 'react-dom';

const PaymentModal = ({
  isOpen,
  onClose,
  paymentData,
  manualAmount,
  setManualAmount,
  isPaying,
  confirmPayment
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-tinta/60 backdrop-blur-sm" role="presentation" aria-hidden="true" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] relative z-[160] animate-in zoom-in-95 duration-200 border border-white overflow-hidden flex flex-col">
        
        {/* Header Fijo */}
        <div className="bg-exito p-8 text-white relative shrink-0">
           <div className="absolute top-0 right-0 p-6 opacity-10 select-none pointer-events-none"><Banknote size={56} /></div>
           <h3 className="titular text-2xl">Registrar Pago</h3>
           <p className="text-xs font-bold text-exito-suave mt-2 opacity-80">Orden de Compra #{paymentData.ordenId}</p>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-8 space-y-6 overflow-y-auto scrollbar-premium">
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center shadow-inner">
            <p className="text-xs font-bold text-slate-500">Saldo Pendiente</p>
            <p className="text-2xl font-bold text-peligro">${(paymentData.total - paymentData.currentPaid).toLocaleString()}</p>
          </div>

          <div className="space-y-3 px-2">
            <label htmlFor="input_abono" className="text-xs font-semibold text-slate-600 ml-1">Monto a Abonar</label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg transition-colors group-focus-within:text-emerald-500">$</span>
              <input 
                id="input_abono"
                type="number" 
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="w-full pl-10 p-4 bg-slate-50 border-2 border-slate-100 rounded-lg text-lg font-bold text-tinta outline-none focus:border-emerald-500 focus:bg-white transition-colors transition-shadow shadow-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={() => confirmPayment(paymentData.total - paymentData.currentPaid)}
              disabled={isPaying}
              className="w-full py-4 bg-exito hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-lg transition-colors transition-shadow transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap size={14} /> LIQUIDAR DEUDA TOTAL: ${(paymentData.total - paymentData.currentPaid).toLocaleString()}
            </button>
            <button 
              onClick={() => confirmPayment(manualAmount)}
              disabled={isPaying}
              className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 hover:border-exito hover:text-exito rounded-lg text-xs font-bold transition-colors transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
            >
              {isPaying ? <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div> : <Wallet size={16} />}
              {isPaying ? 'PROCESANDO...' : 'PROCESAR ABONO MANUAL'}
            </button>
            <button 
              onClick={onClose}
              disabled={isPaying}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-600 transition-colors mt-2"
            >
              Regresar al historial
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PaymentModal;
