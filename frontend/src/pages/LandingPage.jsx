import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-outfit overflow-x-hidden selection:bg-indigo-500 selection:text-white">

      {/* NAVEGADOR */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-default">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-slate-200">🏪</div>
            <span className="text-xl font-black tracking-tighter italic text-slate-800 uppercase">StockPilot</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 px-4 py-2 transition-colors">
              Iniciar Sesión
            </button>
            <button onClick={() => navigate('/register')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all active:scale-95">
              Probar Ahora
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-20 left-[-10%] w-[40%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center animate-fade-in origin-top">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            StockPilot 2026 — Prototipo Funcional v3.0
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter leading-tight mb-8">
            El sistema operativo para <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500 italic pr-4">
              tu inventario inteligente
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium mb-10 leading-relaxed">
            Abandona las hojas de cálculo caóticas. StockPilot te ofrece control de inventario en tiempo real, predicciones impulsadas por IA y analítica financiera para tu negocio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95">
              Registrar mi Tienda
            </button>
            <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95">
              Explorar Demo &rarr;
            </button>
          </div>
        </div>

        {/* Mockup */}
        <div className="max-w-5xl mx-auto mt-20 px-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative rounded-[2.5rem] p-2 bg-gradient-to-b from-indigo-100 to-white shadow-[0_20px_50px_-12px_rgba(99,102,241,0.2)] group transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(99,102,241,0.4)] hover:-translate-y-2">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition-opacity duration-1000"></div>
            <div className="relative bg-[#f8fafc] rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner flex flex-col h-[480px]">
              <div className="h-12 bg-white border-b border-slate-100 flex items-center px-6 gap-3 shrink-0">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="ml-4 px-4 py-1.5 bg-slate-50/80 rounded-lg text-[10px] text-slate-500 font-bold w-full max-w-sm border border-slate-100 flex items-center gap-2">
                  <span className="opacity-50">🔒</span> stockpilot.up.railway.app/dashboard
                </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                <div className="w-48 bg-white border-r border-slate-100 p-4 hidden sm:flex flex-col gap-1 shrink-0">
                  <div className="flex items-center gap-2 mb-6 px-2">
                    <span className="text-indigo-600 text-lg">🏪</span>
                    <span className="font-black italic text-slate-800 tracking-tighter text-xs uppercase">StockPilot</span>
                  </div>
                  <div className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><span>📊</span> Vista General</div>
                  <div className="px-3 py-2 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><span>📦</span> Catálogo</div>
                  <div className="px-3 py-2 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><span>💰</span> Ventas</div>
                  <div className="px-3 py-2 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><span>🤖</span> Proveedores AI</div>
                  <div className="px-3 py-2 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-auto border-t border-slate-50 pt-4"><span>👤</span> Mi Perfil</div>
                </div>
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden bg-slate-50/50">
                  <div className="grid grid-cols-3 gap-4 shrink-0">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm shadow-inner">💰</div>
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">+14.5%</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Ventas Mensuales</p>
                        <p className="text-lg font-black tracking-tighter text-slate-800">$45,250</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -z-0"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-sm shadow-inner">🤖</div>
                        <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Activo</span>
                      </div>
                      <div className="mt-2 relative z-10">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Copiloto IA</p>
                        <p className="text-lg font-black tracking-tighter text-indigo-600">3 Órdenes</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-sm shadow-inner">🚨</div>
                        <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Urgente</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Stock Crítico</p>
                        <p className="text-lg font-black tracking-tighter text-rose-600">12 Ítems</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Flujo de Inventario vs Ventas</h4>
                        <p className="text-[8px] font-bold text-slate-400 tracking-widest mt-0.5">Proyección últimos 7 días</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[8px] font-black text-slate-400 uppercase">Proyección IA</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[8px] font-black text-slate-400 uppercase">Real</span></div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-end gap-1 sm:gap-2 px-2 relative z-10 min-h-0 border-b border-slate-100/50 pb-2">
                      {[30, 45, 25, 60, 40, 75, 50, 85, 65, 95, 80, 100].map((height, i) => (
                        <div key={i} className="flex-1 flex justify-center items-end h-full gap-[1px]">
                          <div className="w-full h-full flex items-end opacity-60"><div className="w-full rounded-t-[2px] bg-slate-200" style={{ height: `${height * 0.7}%` }}></div></div>
                          <div className="w-full h-full flex items-end"><div className="w-full rounded-t-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" style={{ height: `${height}%` }}></div></div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 shrink-0 flex flex-col gap-2">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-[10px]">📦</div>
                          <div>
                            <div className="text-[9px] font-black text-slate-700 uppercase">Bebida Energizan...</div>
                            <div className="text-[8px] font-bold text-slate-400">Restock Sugerido: 50ud</div>
                          </div>
                        </div>
                        <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">Aprobar Orden</div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-[10px]">📦</div>
                          <div>
                            <div className="text-[9px] font-black text-slate-700 uppercase">Leche Deslactos...</div>
                            <div className="text-[8px] font-bold text-slate-400">Alerta de Vencimiento Cercano</div>
                          </div>
                        </div>
                        <div className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">Revisar Stock</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MÉTRICAS */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="absolute top-0 left-[20%] w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-[20%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Eficiencia Comprobada</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">El retorno que tu negocio necesita</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatCard number="90%" label="Precisión IA" sublabel="En predicción de quiebres" />
            <StatCard number="25%" label="Más Rentable" sublabel="Eliminando merma excedente" />
            <StatCard number="24/7" label="Control Auditado" sublabel="Trazabilidad total de IA" />
            <StatCard number="3x" label="ROI Garantizado" sublabel="Retorno primer trimestre" />
          </div>
        </div>
      </section>

      {/* ACCESO AL DEMO */}
      <section id="demo" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/80 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              🔬 Prototipo Funcional — v3.0
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter italic uppercase mb-6">
              Acceso al Demo
            </h2>
            <p className="max-w-xl mx-auto text-slate-500 font-bold">
              Sistema desplegado y operativo en Railway. Explora cada módulo con las credenciales de prueba o registra tu propia tienda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Tarjeta principal */}
            <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">🚀</div>
                <div>
                  <h3 className="text-white font-black text-lg uppercase italic tracking-tighter">Todo incluido</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Módulos disponibles ahora mismo</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  '📊 Dashboard con analítica en tiempo real',
                  '🤖 Copiloto IA (GPT-4o-mini)',
                  '🚨 Motor de alertas automático (ROP)',
                  '🚚 Gestión de proveedores con órdenes',
                  '💰 POS y registro de ventas',
                  '📑 Reportes exportables',
                  '📦 Catálogo con tipos de producto',
                  '🔍 Auditoría de decisiones IA',
                  '🧪 Simulador de escenarios financieros',
                  '👥 Roles Administrador / Colaborador',
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-black">✓</span>
                    <span className="text-slate-300 text-[11px] font-bold leading-snug">{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/register')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:-translate-y-1 shadow-lg shadow-indigo-500/20">
                Registrar mi tienda →
              </button>
            </div>

            {/* Columna derecha */}
            <div className="flex flex-col gap-5">
              {/* Credenciales */}
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-5">🔑 Credenciales Demo</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Administrador</p>
                    <p className="text-xs font-bold text-slate-700">Usuario: <span className="font-black">Carlos Admin</span></p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Contraseña: consultar al autor</p>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Colaborador</p>
                    <p className="text-xs font-bold text-slate-700">Usuario: <span className="font-black">María</span></p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Contraseña: consultar al autor</p>
                  </div>
                </div>
              </div>

              {/* Roadmap */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-5">🗺 Roadmap v4</p>
                <div className="space-y-3">
                  {[
                    'Multi-sucursal con panel maestro',
                    'Planes de suscripción',
                    'API pública para integraciones',
                    'App móvil nativa',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-400 flex items-center justify-center text-[9px]">→</span>
                      <span className="text-xs font-bold text-indigo-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter italic uppercase">
            Solución de Grado Empresarial
          </h2>
          <p className="mt-4 text-slate-500 font-bold mx-auto max-w-2xl">
            Equipa a tus colaboradores con las mismas herramientas que usan las grandes cadenas.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard icon="🤖" title="Predicción IA" desc="Copiloto de riesgos impulsado por GPT-4o-mini que diagnostica stock crítico, sugiere órdenes de compra y genera estrategias de promoción antes de que pierdas ventas." color="indigo" />
          <FeatureCard icon="📊" title="Analítica en Tiempo Real" desc="Dashboard financiero con ventas del día, valor de inventario, margen promedio y proyección de pérdidas por vencimiento, todo actualizado en cada transacción." color="emerald" />
          <FeatureCard icon="🔍" title="Auditoría Transparente" desc="Cada decisión de la IA queda registrada con su razón, los datos que analizó y el ajuste que aplicó. Trazabilidad completa para justificar cada orden de compra." color="rose" />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="absolute top-[50%] left-[50%] w-[600px] h-[600px] bg-indigo-500/15 blur-[150px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-lg shadow-indigo-500/30">🚀</div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-6">
            Haz que tu inventario <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 italic pr-4">trabaje para ti.</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            La transformación digital de tu negocio empieza aquí. Crea tu tienda y empieza a operar en minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 hover:-translate-y-1 transition-all active:scale-95">
              Acceder al Demo
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95">
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 text-center text-slate-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center text-2xl mx-auto mb-6">🏪</div>
          <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase mb-2">StockPilot</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-12">Software de Gestión de Inventario con IA</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 border-t border-slate-800 pt-8">
            <p className="text-xs">© 2026 StockPilot. Proyecto de grado — Ingeniería de Software.</p>
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
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
};

export default LandingPage;
