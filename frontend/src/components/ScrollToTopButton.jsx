import { useState, useEffect } from 'react';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostrar al bajar 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      title="Volver al inicio"
      type="button"
      className={`
        fixed bottom-8 right-8 z-[200]
        w-14 h-14 aspect-square
        flex items-center justify-center
        bg-indigo-600 hover:bg-indigo-700 text-white 
        rounded-full shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)]
        hover:shadow-[0_15px_50px_-10px_rgba(79,70,229,0.6)]
        transition-all duration-500 ease-out transform
        hover:-translate-y-2 active:scale-90 group
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}
      `}
    >
      <svg 
        className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;
