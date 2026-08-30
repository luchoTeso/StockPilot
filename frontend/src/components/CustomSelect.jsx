import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CustomSelect = ({ value, onChange, options, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;
  
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();

      const handleScroll = (e) => {
        if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
        updatePosition();
      };

      const handleClickOutside = (e) => {
        if (
          dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)
        ) {
          setIsOpen(false);
        }
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updatePosition);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updatePosition);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const dropdownPortal = isOpen ? createPortal(
    <div 
      ref={dropdownRef}
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`
      }}
      className="fixed z-[9999] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-scale-in py-2 max-h-60 overflow-y-auto scrollbar-premium font-outfit"
    >
      {options.map((opt) => (
        <div 
          key={opt.value}
          role="option"
          aria-selected={value === String(opt.value) || value === opt.value}
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onChange(opt.value);
              setIsOpen(false);
            }
          }}
          className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors hover:bg-indigo-50 hover:text-indigo-600 focus:bg-indigo-50 focus:text-indigo-600 outline-none ${value === String(opt.value) || value === opt.value ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'}`}
        >
          {opt.label}
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <button 
        type="button"
        ref={buttonRef}
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }} 
        className="w-full h-full flex items-center justify-between cursor-pointer outline-none select-none text-left bg-transparent border-none p-0 m-0"
      >
        <span className="truncate pr-4 font-semibold text-slate-700">{selectedLabel}</span>
        <span className={`transition-transform duration-300 text-xs opacity-50 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {dropdownPortal}
    </div>
  );
};

export default CustomSelect;
