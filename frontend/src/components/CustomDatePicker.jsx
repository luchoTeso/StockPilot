import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CustomDatePicker = ({ value, onChange, placeholder = "Seleccionar fecha...", align = "left" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extraer año, mes (0-11) y día del string YYYY-MM-DD
  const getInitialDate = () => {
    if (value) {
      const [y, m, d] = value.split('-');
      if (y && m && d) return new Date(y, parseInt(m) - 1, d);
    }
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialDate());
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, origin: 'top' });

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (align === 'right-flyout') {
        setCoords({
          top: rect.top - 180, // Alinear el centro del calendario con el botón
          left: rect.right + 20, // Del lado derecho del botón
          right: 'auto',
          origin: 'left center'
        });
      } else {
        setCoords({
          top: rect.bottom + 8,
          left: align === 'right' ? 'auto' : rect.left,
          right: align === 'right' ? window.innerWidth - rect.right : 'auto',
          origin: align === 'right' ? 'top right' : 'top left'
        });
      }
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

  const selectDate = (year, month, day) => {
    const formattedY = year;
    const formattedM = String(month + 1).padStart(2, '0');
    const formattedD = String(day).padStart(2, '0');
    onChange(`${formattedY}-${formattedM}-${formattedD}`);
    setIsOpen(false);
  };

  const nextMonth = (e) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = (e) => {
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Nombres de meses y días
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  // Calcular días a mostrar
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const days = [];

  // Espacios vacíos al inicio
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Display del botón
  const displayValue = value ? (() => {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  })() : placeholder;

  const dropdownPortal = isOpen ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        top: `${coords.top}px`,
        ...(coords.right !== 'auto' ? { right: `${coords.right}px` } : { left: `${coords.left}px` }),
        transformOrigin: coords.origin
      }}
      className={`fixed z-[9999] p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full min-w-[320px] max-w-[320px] animate-scale-in font-outfit`}
    >

      {/* Header Calendario (Mes y Año) */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">
          {meses[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center font-bold transition-colors">
            &larr;
          </button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center font-bold transition-colors">
            &rarr;
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
        ))}
      </div>

      {/* Grilla de Días */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} className="p-2"></div>;

          const isSelected = value && value === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

          return (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); selectDate(currentMonth.getFullYear(), currentMonth.getMonth(), day); }}
              className={`relative flex items-center justify-center w-full aspect-square text-sm font-bold rounded-xl transition-all ${isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105'
                  : (isToday ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 'text-slate-700 hover:bg-slate-100 hover:-translate-y-0.5')
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between">
        <button
          onClick={(e) => { e.preventDefault(); onChange(''); setIsOpen(false); }}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
        >
          Borrar
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            const today = new Date();
            selectDate(today.getFullYear(), today.getMonth(), today.getDate());
          }}
          className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Hoy
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative font-outfit w-full">
      {/* Botón Input (Fake) */}
      <button
        ref={buttonRef}
        type="button"
        className={`w-full flex items-center justify-between p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none transition-all ${isOpen ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-slate-200'} ${value ? 'text-slate-800' : 'text-slate-400'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayValue}</span>
        <span className="text-xl block opacity-80" style={{ transform: isOpen ? 'translateY(1px)' : 'none' }}>📅</span>
      </button>

      {dropdownPortal}
    </div>
  );
};

export default CustomDatePicker;
