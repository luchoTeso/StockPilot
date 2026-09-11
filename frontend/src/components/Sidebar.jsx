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
  const { logout, user, switchStore } = useAuth();
  const { isOpen, isCollapsed, toggleCollapse, closeSidebar } = useSidebar();
  const [alertCount, setAlertCount] = useState(0);
  const [tiendas, setTiendas] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

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

  useEffect(() => {
    if (user?.rol === 'Administrador') {
      axios.get('/api/tiendas')
        .then(res => { if (res.data.success) setTiendas(res.data.tiendas); })
        .catch(err => console.error('Error fetching stores in sidebar', err));
    }
  }, [user?.tiendaId, user?.rol]);

  const links = [
    { to: "/dashboard",  text: "Vista general",    icon: LayoutDashboard },
    { to: "/ventas",     text: "Punto de Venta",    icon: ShoppingCart },
    { to: "/productos",  text: "Catálogo",          icon: Package },
    { to: "/alertas",    text: "Monitor Alertas",   icon: Bell },
    { to: "/tiendas",    text: user?.rol === 'Administrador' ? "Mis Tiendas" : "Mi Tienda", icon: Store },
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
        bg-[#334155] text-white py-6 flex flex-col justify-between
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
              active:scale-90 border-2 border-[#334155] z-[120] hover:scale-110
            `}
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Logo */}
          <div className="flex flex-col items-center w-full relative">
            <div className={`
              bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-[width,height,background-color,color]
              ${isCollapsed ? 'w-10 h-10' : 'w-16 h-16 mb-4'}
            `}>
              <Store size={isCollapsed ? 20 : 32} />
            </div>

            {!isCollapsed && (
              <div className="text-center animate-fade-in w-full">
                <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white">StockPilot</h1>
                
                {/* Selector de tienda */}
                {user?.rol === 'Administrador' && tiendas.length > 0 ? (
                  <div className="mt-3 relative w-full">
                    <button 
                      onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-800/80 border border-slate-600/60 hover:bg-slate-800 hover:border-indigo-400/60 rounded-xl transition-all shadow-inner group"
                    >
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Tienda Activa</span>
                        <span className="text-xs font-bold text-white truncate max-w-[130px] leading-tight mt-0.5 group-hover:text-indigo-300 transition-colors">
                          {user?.tiendaNombre || 'Cargando...'}
                        </span>
                      </div>
                      <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform duration-300 ${isStoreDropdownOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isStoreDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden z-[300] py-1 animate-fade-in">
                        {tiendas.map(t => (
                          <button
                            key={t.id_tienda}
                            onClick={async () => {
                              if (t.id_tienda !== user.tiendaId) {
                                await switchStore(t.id_tienda);
                              }
                              setIsStoreDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${t.id_tienda === user.tiendaId ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                          >
                            <Store size={12} className={t.id_tienda === user.tiendaId ? 'text-indigo-400' : 'text-slate-500'} />
                            <span className="truncate">{t.nombre_establecimiento}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-[0.3em] mt-1">Inteligencia Stock</p>
                )}
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
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'opacity-100 scale-110' : 'opacity-80'}`}
                      />
                      {!isCollapsed && <span className="text-sm tracking-wide">{link.text}</span>}
                    </div>

                    {!isCollapsed && link.to === "/alertas" && alertCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm ${isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white animate-pulse'}`}>
                        {alertCount}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[200] border border-slate-600 shadow-2xl uppercase font-black tracking-widest translate-x-1 group-hover:translate-x-0">
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
              flex items-center gap-3 py-3 transition-colors text-slate-300 hover:text-rose-300 hover:bg-rose-500/15 mt-4 rounded-xl shrink-0
              ${isCollapsed ? 'justify-center px-0' : 'px-4'}
            `}
          >
            <LogOut size={18} className="opacity-80" />
            {!isCollapsed && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 shrink-0 mt-2 border-t border-white/10">
          <p className="text-[10px] text-slate-300/60 text-center font-bold uppercase tracking-widest italic">
            {isCollapsed ? 'v3.0' : 'StockPilot Project v3.0'}
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
