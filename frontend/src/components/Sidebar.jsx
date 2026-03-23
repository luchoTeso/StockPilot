import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await axios.get('/api/dashboard/stats');
        setAlertCount((data.alertasCriticas > 0) ? data.alertasCriticas : (data.alertasAdvertencia > 0) ? data.alertasAdvertencia : 0);
      } catch (err) {
        console.error('Error fetching alerts for sidebar', err);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  // Definir links base por orden lógico
  const links = [
    { to: "/dashboard", text: "Panel de Control", icon: "📊" },
    { to: "/alertas", text: "Alertas", icon: "🚨" },
    { to: "/ventas", text: "Ventas", icon: "💰" },
    { to: "/movimientos", text: "Movimientos", icon: "🔄" },
    { to: "/productos", text: "Ver Productos", icon: "📦" }
  ];

  // Agregar links de Administrador en su posición lógica
  if (user?.rol === 'Administrador') {
    links.push({ to: "/proveedores", text: "Proveedores (IA)", icon: "🏢" });
  }

  links.push({ to: "/reportes", text: "Reportes", icon: "📈" });

  if (user?.rol === 'Administrador') {
    links.push({ to: "/auditoria", text: "Auditoría IA", icon: "🔍" });
  }

  links.push({ to: "/tiendas", text: "Ver Tienda", icon: "🏪" });

  if (user?.rol === 'Administrador') {
    links.push({ to: "/registro-tendedero", text: "Registro Tendedero", icon: "🏗️", id: "nav-registro-tendedero" });
  }

  links.push({ to: "/perfil", text: "Mi Perfil", icon: "👤" });

  return (
    <div className="w-[240px] bg-[#1e2235] text-white py-[20px] flex flex-col justify-between sticky top-0 h-screen overflow-y-auto shrink-0 shadow-2xl font-outfit">
      <div>
        <div className="flex flex-col items-center mb-10 px-4">
          <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-lg shadow-indigo-500/20">🏪</div>
          <h1 className="text-xl font-black tracking-tighter italic uppercase text-white">StockPilot</h1>
          <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-1">IA de Inventario Inteligente</p>
        </div>
        
        <nav className="flex flex-col space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              id={link.id}
              className={({ isActive }) =>
                `flex items-center justify-between py-[12px] px-[20px] transition-colors duration-300 border-l-4 ${
                  isActive 
                    ? 'bg-[#4f46e5]/10 border-[#4f46e5] text-white font-bold' 
                    : 'border-transparent text-[#adb5bd] hover:bg-[#4f46e5]/5 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-lg opacity-80">{link.icon}</span>
                <span className="text-sm">{link.text}</span>
              </div>
              
              {link.to === "/productos" && alertCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse shadow-sm shadow-rose-900/40">
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
          <button 
            onClick={logout} 
            className="block w-full text-left py-[10px] px-[20px] text-[#adb5bd] hover:bg-[#4f46e5] hover:text-white transition-colors duration-300 mt-4 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
