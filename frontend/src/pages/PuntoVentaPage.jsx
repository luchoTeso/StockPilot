import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingCart, History, Lock, Unlock } from 'lucide-react';
import CashRegisterModal from '../components/CashRegisterModal';
import { useAuth } from '../context/AuthContext';

// Importar Pestañas Modulares
import CajaRapidaTab from '../components/puntoventa/CajaRapidaTab';
import HistorialVentasTab from '../components/puntoventa/HistorialVentasTab';
import HistorialCajaTab from '../components/puntoventa/HistorialCajaTab';
import HistorialEgresosTab from '../components/puntoventa/HistorialEgresosTab';

const PuntoVentaPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Administrador';
  const [activeTab, setActiveTab] = useState('caja'); // 'caja' | 'historial' | 'historial_caja' | 'egresos'

  // Cash Register Session State
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Cargar estado inicial de la sesión de caja
  useEffect(() => {
    const checkRegisterSession = async () => {
      try {
        const res = await axios.get('/api/caja/sesion');
        setIsSessionActive(Boolean(res.data?.active));
      } catch (error) {
        console.error("Error al verificar sesión de caja", error);
      }
    };
    checkRegisterSession();
  }, []);

  return (
    <div className="animate-fade-in pb-12 space-y-8 font-outfit">
      {/* Pestañas / Header */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('caja')}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'caja' ? 'bg-white text-indigo-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
          >
            <ShoppingCart size={16} /> Caja Rápida (POS)
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'historial' ? 'bg-white text-emerald-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
          >
            <History size={16} /> Historial
          </button>
          {isAdmin && (
            <>
            <button
              onClick={() => setActiveTab('historial_caja')}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'historial_caja' ? 'bg-white text-rose-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
            >
              <DollarSign size={16} /> Historial Caja
            </button>
            <button
              onClick={() => setActiveTab('egresos')}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${activeTab === 'egresos' ? 'bg-white text-orange-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 scale-95'}`}
            >
              <History size={16} /> Egresos
            </button>
            </>
          )}
        </div>

        {/* Botón de Caja movido al lado de las pestañas */}
        <button
          onClick={() => setIsCashRegisterOpen(true)}
          className={`px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            isSessionActive 
              ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 shadow-sm' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
          }`}
        >
          {isSessionActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <Lock size={14} />
              Cerrar Turno (Caja Activa)
            </>
          ) : (
            <>
              <Unlock size={14} />
              Abrir Caja
            </>
          )}
        </button>
      </div>

      {activeTab === 'caja' && <CajaRapidaTab isSessionActive={isSessionActive} setIsCashRegisterOpen={setIsCashRegisterOpen} user={user} />}
      {activeTab === 'historial' && <HistorialVentasTab />}
      {activeTab === 'historial_caja' && isAdmin && <HistorialCajaTab />}
      {activeTab === 'egresos' && isAdmin && (
        <HistorialEgresosTab 
          isSessionActive={isSessionActive} 
          setIsCashRegisterOpen={setIsCashRegisterOpen} 
          user={user}
        />
      )}

      <CashRegisterModal
        isOpen={isCashRegisterOpen}
        onClose={() => setIsCashRegisterOpen(false)}
        onStatusChange={setIsSessionActive}
      />
    </div>
  );
};

export default PuntoVentaPage;
