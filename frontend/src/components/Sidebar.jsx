import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import {
  LayoutDashboard, ShoppingCart, Package, Bell, Store,
  ArrowLeftRight, Truck, TrendingDown, FlaskConical,
  FileText, ScanSearch, Brain, Users, User, LogOut,
  X, ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { isOpen, isCollapsed, toggleCollapse, closeSidebar } = useSidebar();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAlerts = async () => {
      try {
        const { data } = await axios.get('/api/dashboard/stats', { signal: controller.signal });
        if (controller.signal.aborted) return;
        setAlertCount((data.alertasCriticas > 0) ? data.alertasCriticas : (data.alertasAdvertencia > 0) ? data.alertasAdvertencia : 0);
      } catch (err) {
        if (!axios.isCancel(err) && !controller.signal.aborted) {
          console.error('Error fetching alerts for sidebar', err);
        }
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  const links = [
    { to: "/dashboard",  text: "Vista general",    icon: LayoutDashboard },
    { to: "/ventas",     text: "Ventas",            icon: ShoppingCart },
    { to: "/productos",  text: "Catálogo",          icon: Package },
    { to: "/alertas",    text: "Monitor Alertas",   icon: Bell },
    { to: "/tiendas",    text: "Mi Tienda",         icon: Store },
  ];

  if (user?.rol === 'Administrador') {
    links.push({ to: "/movimientos",        text: "Movimientos",      icon: ArrowLeftRight,  id: "nav-movimientos" });
    links.push({ to: "/proveedores",        text: "Proveedores AI",   icon: Truck });
    links.push({ to: "/analitica-visual",   text: "Analítica Visual", icon: TrendingDown,    id: "nav-analitica-visual" });
    links.push({ to: "/simulador",          text: "Simulador AI",     icon: FlaskConical,    id: "nav-simulador" });
    links.push({ to: "/reportes",           text: "Generar Reportes", icon: FileText });
    links.push({ to: "/auditoria",          text: "Auditoría AI",     icon: ScanSearch });
    links.push({ to: "/aprendizaje",        text: "Aprendizaje AI",   icon: Brain });
    links.push({ to: "/registro-tendero", text: "Colaboradores",    icon: Users,           id: "nav-registro-tendero" });
  }

  links.push({ to: "/perfil", text: "Mi Perfil", icon: User });

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Overlay Móvil */}
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] md:hidden transition-opacity"
          onClick={closeSidebar}
          onKeyDown={(e) => { if (e.key === 'Escape') closeSidebar(); }}
        />
      )}

      {/* Sidebar Principal */}
      <div className={`
        fixed left-0 top-0 h-screen z-[200]
        bg-[#1e2235] text-white py-6 flex flex-col justify-between
        shadow-2xl transition-[width,transform] duration-300 ease-in-out font-outfit
        ${sidebarWidth}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        ${isCollapsed ? 'items-center' : ''}
        shrink-0 overflow-visible
      `}>

        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-10 px-4 relative shrink-0">

          {/* Cerrar — solo móvil */}
          <button
            onClick={closeSidebar}
            className="md:hidden absolute -right-2 top-0 bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform z-10"
          >
            <X size={14} />
          </button>

          {/* Colapsar — desktop */}
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            className={`
              hidden md:flex absolute top-10 -right-4 w-8 h-8 rounded-full
              bg-indigo-600 hover:bg-indigo-700 text-white
              items-center justify-center transition-transform transition-colors shadow-xl shadow-indigo-500/40
              active:scale-90 border-2 border-[#1e2235] z-[120] hover:scale-110
            `}
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className={`
              bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-[width,height,background-color,color]
              ${isCollapsed ? 'w-10 h-10' : 'w-16 h-16 mb-4'}
            `}>
              <Store size={isCollapsed ? 20 : 32} />
            </div>

            {!isCollapsed && (
              <div className="text-center animate-fade-in whitespace-nowrap overflow-hidden">
                <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white">StockPilot</h1>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-1">Inteligencia Stock</p>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-grow flex flex-col space-y-1 px-3 overflow-y-auto scrollbar-hide overflow-x-visible">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                id={link.id}
                onClick={() => { if (window.innerWidth < 768) closeSidebar(); }}
                className={({ isActive }) =>
                  `flex items-center group py-3 transition-colors transition-shadow duration-300 rounded-xl relative mb-1 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'
                  } ${isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'opacity-100 scale-110' : 'opacity-60'}`}
                      />
                      {!isCollapsed && <span className="text-sm tracking-wide">{link.text}</span>}
                    </div>

                    {!isCollapsed && link.to === "/alertas" && alertCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white animate-pulse'}`}>
                        {alertCount}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[200] border border-slate-700 shadow-2xl uppercase font-black tracking-widest translate-x-1 group-hover:translate-x-0">
                        {link.text}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            onClick={logout}
            className={`
              flex items-center gap-3 py-3 transition-colors text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 mt-4 rounded-xl shrink-0
              ${isCollapsed ? 'justify-center px-0' : 'px-4'}
            `}
          >
            <LogOut size={18} className="opacity-60" />
            {!isCollapsed && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 shrink-0 mt-2 border-t border-white/5">
          <p className="text-[10px] text-slate-600 text-center font-bold uppercase tracking-widest opacity-40 italic">
            {isCollapsed ? 'v3.0' : 'StockPilot Project v3.0'}
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
