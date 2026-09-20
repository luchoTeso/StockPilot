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
      bg: 'bg-peligro-suave',
      text: 'text-peligro',
      shadow: '',
      border: 'border-peligro-suave',
      btn: 'bg-peligro hover:bg-rose-700',
      highlightBg: 'bg-rose-50 text-rose-700 border-peligro-suave'
    },
    amber: {
      bg: 'bg-aviso-suave',
      text: 'text-amber-500',
      shadow: '',
      border: 'border-aviso-suave',
      btn: 'bg-ambar hover:bg-amber-600',
      highlightBg: 'bg-amber-50 text-aviso border-aviso-suave'
    },
    emerald: {
      bg: 'bg-exito-suave',
      text: 'text-emerald-500',
      shadow: '',
      border: 'border-exito-suave',
      btn: 'bg-emerald-500 hover:bg-exito',
      highlightBg: 'bg-emerald-50 text-emerald-700 border-exito-suave'
    }
  };

  const theme = colors[highlightColor] || colors.rose;

  return (
    <div className="fixed inset-0 bg-tinta/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-[3rem] w-full max-w-sm shadow-2xl animate-scale-in p-8 text-center border-4 ${theme.border}`}>
         <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl ${theme.bg} ${theme.text} ${theme.shadow}`}>
            {getIcon()}
         </div>
         <h3 className="text-2xl font-black text-tinta tracking-tighter uppercase mb-2">{title}</h3>
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
