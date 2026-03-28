import { useState } from 'react';

const Tooltip = ({ text, children, className = "", align = "center" }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Determinar clases de alineación del tooltip (la burbuja)
  let alignClasses = "left-1/2 -translate-x-1/2";
  let arrowClasses = "left-1/2 -translate-x-1/2";
  
  if (align === "left") {
    alignClasses = "left-0";
    arrowClasses = "left-4";
  } else if (align === "right") {
    alignClasses = "right-0";
    arrowClasses = "right-4";
  }

  return (
    <div 
      className={`relative flex items-center group cursor-pointer ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && text && (
        <div className={`absolute bottom-full ${alignClasses} mb-3 w-max max-w-[250px] sm:max-w-xs z-[100] animate-fade-in pointer-events-none`}>
          <div className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-center leading-relaxed normal-case">
            {text}
          </div>
          {/* Triángulo flotante (Flecha) */}
          <div className={`absolute top-full ${arrowClasses} -mt-px border-[6px] border-transparent border-t-slate-800`}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
