import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // Estado para móviles (Abierto/Cerrado)
  const [isOpen, setIsOpen] = useState(false);
  // Estado para PC/Tablet (Expandido/Colapsado)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Cerrar sidebar al cambiar de ruta en móviles
  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const closeSidebar = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      isCollapsed, 
      setIsCollapsed,
      toggleSidebar,
      toggleCollapse,
      closeSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
