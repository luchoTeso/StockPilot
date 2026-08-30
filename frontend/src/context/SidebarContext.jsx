import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // Estado para móviles (Abierto/Cerrado)
  const [isOpen, setIsOpen] = useState(false);
  // Estado para PC/Tablet (Expandido/Colapsado)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Cerrar sidebar al cambiar de ruta en móviles
  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);
  const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);
  const closeSidebar = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({
    isOpen, 
    setIsOpen, 
    isCollapsed, 
    setIsCollapsed,
    toggleSidebar,
    toggleCollapse,
    closeSidebar
  }), [isOpen, isCollapsed, toggleSidebar, toggleCollapse, closeSidebar]);

  return (
    <SidebarContext.Provider value={value}>
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
