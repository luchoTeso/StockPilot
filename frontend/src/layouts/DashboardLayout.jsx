import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationCenter from '../components/NotificationCenter';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useSidebar } from '../context/SidebarContext';
import { Store, Menu, X, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const DashboardLayout = () => {
  const { toggleSidebar, isOpen, isCollapsed } = useSidebar();
  const { user } = useAuth();
  const toast = useToast();
  
  const marginLeft = isCollapsed ? 'md:ml-20' : 'md:ml-64';

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpToken, setTotpToken] = useState('');

  useEffect(() => {
    if (user?.needs2FASetup && !qrCodeUrl) {
      handleGenerate2FA();
    }
  }, [user]);

  const handleGenerate2FA = async () => {
    try {
      const { data } = await axios.post('/api/2fa/generate');
      if (data.success) {
        setQrCodeUrl(data.qrCode);
      }
    } catch (err) {
      toast.error('Error generando configuración 2FA');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/2fa/verify', { token: totpToken });
      toast.success('2FA Habilitado con éxito');
      window.location.reload(); 
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código incorrecto');
    }
  };

  const renderForce2FA = () => {
    if (!user?.needs2FASetup) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
        <form onSubmit={handleVerify2FA} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-scale-in text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-2">Configurar Seguridad</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6 leading-relaxed">
            Como Administrador, es obligatorio configurar 2FA antes de continuar.<br/>
            1. Descarga Google Authenticator.<br/>
            2. Escanea el código QR.
          </p>

          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Código QR 2FA" className="mx-auto w-48 h-48 border-4 border-slate-100 rounded-xl mb-6 shadow-sm" />
          ) : (
            <div className="w-48 h-48 bg-slate-100 animate-pulse mx-auto rounded-xl mb-6"></div>
          )}

          <div className="space-y-1 mb-8 text-left">
            <label htmlFor="totp-token-layout" className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">3. Ingresa el código de 6 dígitos</label>
            <input
              id="totp-token-layout"
              type="text"
              maxLength="6"
              value={totpToken}
              required
              placeholder="000000"
              onChange={e => setTotpToken(e.target.value.replace(/\D/g, ''))}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl tracking-[0.5em] font-black focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-colors"
          >
            Verificar y Activar
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="flex w-full min-h-screen bg-papel font-outfit overflow-x-hidden relative">
      
      {/* 📱 Mobile Top Bar (Only < 768px) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-[150] flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md">
            <Store size={16} />
          </div>
          <span className="font-black text-slate-800 tracking-tighter uppercase text-sm italic underline decoration-indigo-500 underline-offset-4">StockPilot</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="mt-1">
            <NotificationCenter />
          </div>
          <button
            onClick={toggleSidebar}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 active:scale-95 transition-transform"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Menú Lateral (FIJO) */}
      <Sidebar />

      {/* Area de Contenido Principal (Con margen reactivo para el sidebar fijo) */}
      <main className={`
        flex-grow relative min-h-screen transition-[margin] duration-300 ease-in-out
        ${marginLeft}
        ${isOpen ? 'hidden md:flex' : 'flex'} flex-col
        pt-16 md:pt-0
        grain-bg
      `}>
        {/* 🖥️ Desktop Header (Only md+) */}
        <header className="hidden md:flex items-center justify-end px-12 h-14 w-full z-[150] shrink-0">
            <div className="mt-2">
              <NotificationCenter />
            </div>
        </header>

        {/* Elemento decorativo de fondo */}
        <div className="!absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50/50 blur-3xl -z-10 pointer-events-none"></div>
        
        {/* Contenedor Fluido */}
        <div className="p-4 md:p-8 lg:px-12 lg:pb-12 lg:pt-2 max-w-7xl xl:max-w-[1600px] mx-auto w-full flex-grow flex flex-col gap-8">
          <Outlet />
        </div>
      </main>

      {/* Botón Flotante de Scroll (Nivel Raíz para evitar estiramientos) */}
      <ScrollToTopButton />

      {/* Modal global forzado para Admins sin 2FA */}
      {renderForce2FA()}
    </div>
  );
};

export default DashboardLayout;
