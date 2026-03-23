import { useState } from 'react';

const Tooltip = ({ text, children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative flex items-center group cursor-pointer ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs z-[100] animate-fade-in pointer-events-none">
          <div className="bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap">
            {text}
          </div>
          {/* Triángulo flotante (Flecha) */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[6px] border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
