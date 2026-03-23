import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-outfit overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* 
        ======== NAVEGADOR SUPERIOR ======== 
      */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-default">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-slate-200">
              🏪
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter italic text-slate-800 uppercase">StockPilot</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 px-4 py-2 transition-colors"
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Probar Ahora
            </button>
          </div>
        </div>
      </nav>

      {/* 
        ======== HERO SECTION ======== 
      */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Decoraciones de Fondo (Blobs) */}
        <div className="absolute top-20 left-[-10%] w-[40%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center animate-fade-in origin-top">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            StockPilot 2026 Empresarial
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter leading-tight mb-8">
            El sistema operativo para <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500 italic pr-4">
              tu inventario inteligente
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium mb-10 leading-relaxed">
            Abandona las hojas de cálculo caóticas. StockPilot te ofrece control de inventario en tiempo real, predicciones impulsadas por IA y la mejor rentabilidad para tu red de tiendas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95"
            >
              Comenzar Auditoría
            </button>
            <button 
              onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
            >
              Ver Planes & Precios &rarr;
            </button>
          </div>
        </div>

        {/* Mockup / Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-20 px-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative rounded-[2.5rem] p-2 bg-gradient-to-b from-indigo-100 to-white shadow-2xl">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-[2.5rem] blur opacity-30"></div>
            <div className="relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner flex flex-col h-[400px]">
              {/* Fake Browser header */}
              <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-6 gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <div className="ml-4 px-4 py-1 bg-white rounded-md text-[10px] text-slate-400 font-bold w-64 border border-slate-200 flex items-center">
                  🔒 app.stockpilot.com/dashboard
                </div>
              </div>
              {/* Fake Content area */}
              <div className="flex-1 bg-slate-50/50 p-8 flex gap-6">
                <div className="w-48 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hidden sm:block">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-8 w-full bg-indigo-50 rounded-lg"></div>
                    <div className="h-8 w-full bg-slate-100 rounded-lg"></div>
                    <div className="h-8 w-full bg-slate-100 rounded-lg"></div>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex gap-4">
                     <div className="h-24 flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4"><div className="w-8 h-8 rounded-full bg-emerald-100 mb-2"></div><div className="h-4 w-16 bg-slate-200 rounded"></div></div>
                     <div className="h-24 flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4"><div className="w-8 h-8 rounded-full bg-indigo-100 mb-2"></div><div className="h-4 w-16 bg-slate-200 rounded"></div></div>
                     <div className="h-24 flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4"><div className="w-8 h-8 rounded-full bg-rose-100 mb-2"></div><div className="h-4 w-16 bg-slate-200 rounded"></div></div>
                  </div>
                  <div className="h-48 w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                     <div className="h-4 w-32 bg-slate-200 rounded mb-6"></div>
                     <div className="flex items-end gap-2 h-24">
                       <div className="w-8 bg-indigo-200 rounded-t-md h-12"></div>
                       <div className="w-8 bg-indigo-300 rounded-t-md h-16"></div>
                       <div className="w-8 bg-indigo-400 rounded-t-md h-20"></div>
                       <div className="w-8 bg-indigo-500 rounded-t-md h-10"></div>
                       <div className="w-8 bg-indigo-600 rounded-t-md h-24"></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ======== MÉTRICAS DE IMPACTO ======== 
      */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="absolute top-0 left-[20%] w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-[20%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Eficiencia Comprobada</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
              El retorno que tu negocio necesita
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatCard number="90%" label="Precisión IA" sublabel="En predicción de quiebres" />
            <StatCard number="25%" label="Más Rentable" sublabel="Eliminando merma excedente" />
            <StatCard number="24/7" label="Control Auditado" sublabel="Trazabilidad total" />
            <StatCard number="3x" label="ROI ROI" sublabel="Retorno primer trimestre" />
          </div>
        </div>
      </section>

      {/* 
        ======== PRICING SECTION (NUEVA) ======== 
      */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4">Planes y Precios</p>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter italic uppercase mb-6">
              Escala sin límites
            </h2>
            <p className="max-w-2xl mx-auto text-slate-500 font-bold">
              Selecciona el plan que se adapte al tamaño de tu operación. Todos incluyen la infraestructura base de IA.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
                name="Básico" 
                price="29" 
                desc="Ideal para tiendas individuales que están automatizando sus procesos."
                features={['Hasta 1 sucursal','Predicciones de stock base','Alertas por correo','Auditoría de IA estándar']}
            />
            <PricingCard 
                name="Profesional" 
                price="89" 
                isPopular={true}
                desc="Para empresas con múltiples puntos de venta y alta rotación."
                features={['Hasta 5 sucursales','Copiloto IA avanzado','Historial de órdenes ilimitado','Soporte prioritario']}
            />
            <PricingCard 
                name="Corporativo" 
                price="199" 
                desc="Control total para grandes distribuidores y cadenas comerciales."
                features={['Sucursales ilimitadas','Dashboards personalizados','API Access','Account Manager dedicado']}
            />
          </div>
        </div>
      </section>

      {/* 
        ======== FEATURES SECTION ======== 
      */}
      <section id="features" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter italic uppercase">
              Solución de Grado Empresarial
            </h2>
            <p className="mt-4 text-slate-500 font-bold mx-auto max-w-2xl">
              Equipa a tus tenderos con las mismas herramientas que usan las grandes cadenas.
            </p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="🤖" 
            title="Predicción IA" 
            desc="Copiloto de riesgos impulsado por algoritmos que diagnostica stock crítico antes de que se agote." 
            color="indigo"
          />
          <FeatureCard 
            icon="⚡" 
            title="Portales Dinámicos" 
            desc="Componentes de la interfaz de usuario ultrarrápidos, filtros flotantes y diseños inmersivos de cristal." 
            color="emerald"
          />
          <FeatureCard 
            icon="🏢" 
            title="Multi-Tienda" 
            desc="Asigna tenderos a sucursales específicas y controla movimientos de forma granular desde el panel maestro." 
            color="rose"
          />
        </div>
      </section>

      {/* 
        ======== CTA FINAL ======== 
      */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="absolute top-[50%] left-[50%] w-[600px] h-[600px] bg-indigo-500/15 blur-[150px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-lg shadow-indigo-500/30">
            🚀
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-6">
            Haz que tu inventario <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 italic pr-4">trabaje para ti.</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            La transformación digital de tu negocio empieza aquí. Únete a StockPilot hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-all active:scale-95"
            >
              Comenzar Prueba Gratuita
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95"
            >
              Consultar Soporte
            </button>
          </div>
        </div>
      </section>

      {/* 
        ======== FOOTER ======== 
      */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 text-center text-slate-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center text-2xl mx-auto mb-6">🏪</div>
          <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase mb-2">StockPilot</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-12">Software Financiero & Logístico</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 border-t border-slate-800 pt-8">
            <p className="text-xs">© 2026 StockPilot Inc. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <span className="text-xs hover:text-white cursor-pointer transition-colors">Términos</span>
              <span className="text-xs hover:text-white cursor-pointer transition-colors">Privacidad</span>
              <span className="text-xs hover:text-white cursor-pointer transition-colors">Contacto</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

const StatCard = ({ number, label, sublabel }) => (
  <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
    <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">{number}</p>
    <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">{label}</p>
    <p className="text-[10px] font-bold text-slate-500 mt-1">{sublabel}</p>
  </div>
);

const PricingCard = ({ name, price, desc, features, isPopular = false }) => (
    <div className={`p-8 rounded-[2.5rem] border relative flex flex-col justify-between transition-all hover:-translate-y-2 ${isPopular ? 'bg-slate-900 border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'bg-white border-slate-100 hover:shadow-xl'}`}>
        {isPopular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg shadow-indigo-500/50">Más Recomendado</span>}
        <div>
            <h3 className={`text-xl font-black tracking-tight mb-2 uppercase italic ${isPopular ? 'text-white' : 'text-slate-800'}`}>{name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-black tracking-tighter ${isPopular ? 'text-white' : 'text-slate-900'}`}>${price}</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${isPopular ? 'text-slate-400' : 'text-slate-400'}`}>/ Mes</span>
            </div>
            <p className={`text-sm font-medium leading-relaxed mb-8 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
            <ul className="space-y-4 mb-10">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px]">✓</span>
                        <span className={`text-xs font-bold ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                    </li>
                ))}
            </ul>
        </div>
        <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            Seleccionar Plan
        </button>
    </div>
);

const FeatureCard = ({ icon, title, desc, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    rose: 'bg-rose-50 border-rose-100 text-rose-600'
  };

  return (
    <div className="p-8 rounded-[2rem] border border-slate-100 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm ${colors[color]} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight mb-3">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

export default LandingPage;
