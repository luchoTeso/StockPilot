import { AlertTriangle, Trash2, CheckCircle2, Pause } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  highlightText,
  highlightColor = 'rose',
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  onConfirm, 
  onCancel, 
  loading = false, 
  icon = 'trash' 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case 'trash': return <Trash2 size={36} />;
      case 'pause': return <Pause size={36} />;
      case 'check': return <CheckCircle2 size={36} />;
      default: return <AlertTriangle size={36} />;
    }
  };

  const colors = {
    rose: {
      bg: 'bg-rose-100',
      text: 'text-rose-600',
      shadow: 'shadow-rose-100/50',
      border: 'border-rose-100',
      btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
      highlightBg: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-500',
      shadow: 'shadow-amber-100/50',
      border: 'border-amber-100',
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
      highlightBg: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-500',
      shadow: 'shadow-emerald-100/50',
      border: 'border-emerald-100',
      btn: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
      highlightBg: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    }
  };

  const theme = colors[highlightColor] || colors.rose;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-[3rem] w-full max-w-sm shadow-2xl animate-scale-in p-8 text-center border-4 ${theme.border}`}>
         <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl ${theme.bg} ${theme.text} ${theme.shadow}`}>
            {getIcon()}
         </div>
         <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-2">{title}</h3>
         <p className="text-xs font-bold text-slate-500 mb-6">{message}</p>
         
         {highlightText && (
           <div className={`p-4 rounded-2xl border mb-8 uppercase line-clamp-2 font-black ${theme.highlightBg}`}>
              {highlightText}
           </div>
         )}

          <div className="flex gap-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
              {cancelText}
            </button>
            <button type="button" onClick={onConfirm} disabled={loading} className={`flex-[1.5] py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-colors transition-transform transition-shadow active:scale-95 disabled:opacity-50 ${theme.btn}`}>
              {loading ? 'Procesando...' : confirmText}
            </button>
          </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
