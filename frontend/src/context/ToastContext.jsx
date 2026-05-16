import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    // First mark as exiting for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    }, 300);
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 6000),
    warning: (msg) => addToast(msg, 'warning', 5000),
    info: (msg) => addToast(msg, 'info'),
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const bgColors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    info: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  };

  const titles = {
    success: '¡Éxito!',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: '420px',
        width: '100%',
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: bgColors[t.type],
              color: 'white',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.25), 0 2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              pointerEvents: 'auto',
              animation: t.exiting ? 'toastSlideOut 0.3s ease forwards' : 'toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onClick={() => removeToast(t.id)}
          >
            {(() => { const Icon = icons[t.type]; return <Icon size={22} style={{ flexShrink: 0, marginTop: '2px' }} />; })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', letterSpacing: '0.3px' }}>
                {titles[t.type]}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.95, lineHeight: '1.45', wordBreak: 'break-word' }}>
                {t.message}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                lineHeight: 1,
                padding: 0,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(100px) scale(0.9); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
