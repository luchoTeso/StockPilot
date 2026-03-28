import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationCenter from '../components/NotificationCenter';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useSidebar } from '../context/SidebarContext';

const DashboardLayout = () => {
  const { toggleSidebar, isOpen, isCollapsed } = useSidebar();

  const marginLeft = isCollapsed ? 'md:ml-20' : 'md:ml-64';

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc] font-outfit overflow-x-hidden relative">
      
      {/* 📱 Mobile Top Bar (Only < 768px) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-[150] flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-lg shadow-md">🏪</div>
          <span className="font-black text-slate-800 tracking-tighter uppercase text-sm italic underline decoration-indigo-500 underline-offset-4">StockPilot</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="mt-1">
            <NotificationCenter />
          </div>
          <button 
            onClick={toggleSidebar}
            className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 active:scale-95 transition-transform"
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Menú Lateral (FIJO) */}
      <Sidebar />

      {/* Area de Contenido Principal (Con margen reactivo para el sidebar fijo) */}
      <main className={`
        flex-grow relative min-h-screen transition-all duration-300 ease-in-out
        ${marginLeft}
        ${isOpen ? 'hidden md:flex' : 'flex'} flex-col
        pt-16 md:pt-0
        grain-bg
      `}>
        {/* 🖥️ Desktop Header (Only md+) */}
        <header className="hidden md:flex items-center justify-end px-12 h-20 w-full z-[150]">
            <div className="mt-3">
              <NotificationCenter />
            </div>
        </header>
        {/* Elemento decorativo de fondo */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50/50 blur-3xl -z-10 pointer-events-none"></div>
        
        {/* Contenedor Fluido */}
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl xl:max-w-[1600px] mx-auto w-full flex-grow flex flex-col gap-8">
          <Outlet />
        </div>
      </main>

      {/* Botón Flotante de Scroll (Nivel Raíz para evitar estiramientos) */}
      <ScrollToTopButton />
    </div>
  );
};

export default DashboardLayout;
