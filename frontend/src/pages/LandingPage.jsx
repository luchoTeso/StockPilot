import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.dataset.section]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('[data-section]').forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div style={{
      fontFamily: "'Outfit', 'Inter Tight', system-ui, sans-serif",
      background: '#0f172a',
      color: '#f8fafc',
      overflowX: 'hidden',
      minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1);
        }
        .reveal.visible {
          opacity: 1;
          transform: none;
        }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }

        .nav-blur {
          background: rgba(15,23,42,0.0);
          backdrop-filter: none;
          transition: background 0.3s, backdrop-filter 0.3s, border-color 0.3s;
          border-bottom: 1px solid transparent;
        }
        .nav-blur.scrolled {
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(99,102,241,0.15);
        }

        .hero-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
        }

        .stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px 24px;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .stat-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(99,102,241,0.3);
          transform: translateY(-3px);
        }

        .feature-card {
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 36px 32px;
          transition: border-color 0.25s, transform 0.25s;
        }
        .feature-card:hover {
          border-color: rgba(99,102,241,0.4);
          transform: translateY(-4px);
        }

        .btn-primary {
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 16px 32px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          font-family: inherit;
        }
        .btn-primary:hover { background: #5254cc; }
        .btn-primary:active { transform: scale(0.97); }

        .btn-ghost {
          background: rgba(255,255,255,0.05);
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 16px 32px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
          font-family: inherit;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.09); }

        .module-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          transition: border-color 0.2s, color 0.2s;
        }
        .module-chip:hover { border-color: rgba(99,102,241,0.3); color: #c7d2fe; }

        .light-section {
          background: #f8fafc;
          color: #0f172a;
        }
        .light-section .section-label { color: #6366f1; }
        .light-section .section-title { color: #0f172a; }
        .light-section .section-sub { color: #64748b; }

        .cred-card {
          background: #1e293b;
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 20px;
          padding: 28px;
        }

        .pulse-dot {
          width: 8px; height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
        }

        .mockup-bar { width: 100%; height: 36px; background: #1e293b; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; padding: 0 16px; gap: 8px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }

        @media (max-width: 768px) {
          .hero-btns { flex-direction: column; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .demo-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: clamp(36px, 10vw, 64px) !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav-blur${scrolled ? ' scrolled' : ''}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#6366f1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏪</div>
            <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: '-0.02em', fontStyle: 'italic', textTransform: 'uppercase', color: '#f8fafc' }}>StockPilot</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-ghost" style={{ padding: '10px 20px' }} onClick={() => navigate('/login')}>Iniciar sesión</button>
            <button className="btn-primary" style={{ padding: '10px 20px' }} onClick={() => navigate('/register')}>Probar ahora</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', paddingTop: 160, paddingBottom: 100, textAlign: 'center', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 500, height: 400, background: 'rgba(99,102,241,0.15)', top: -80, left: '50%', transform: 'translateX(-50%)' }} />
        <div className="hero-glow" style={{ width: 300, height: 300, background: 'rgba(167,139,250,0.08)', top: 200, right: '10%' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 32 }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a5b4fc' }}>Desplegado en Railway · v3.0</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 24 }}>
            El sistema operativo<br />
            <span style={{ color: '#818cf8' }}>para tu inventario</span>
          </h1>

          <p style={{ fontSize: 18, color: '#94a3b8', fontWeight: 500, maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Control de inventario en tiempo real, predicciones con IA y analítica financiera. Diseñado para microempresas de víveres en Bogotá.
          </p>

          <div className="hero-btns" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/register')}>Registrar mi tienda →</button>
            <button className="btn-ghost" onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}>Explorar demo</button>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div style={{ maxWidth: 900, margin: '72px auto 0', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ background: '#1e293b', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div className="mockup-bar">
              <div className="dot" style={{ background: '#f87171' }} />
              <div className="dot" style={{ background: '#fbbf24' }} />
              <div className="dot" style={{ background: '#34d399' }} />
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 20, marginLeft: 12, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <span style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>🔒 stockpilot.up.railway.app/dashboard</span>
              </div>
            </div>
            <div style={{ display: 'flex', height: 380 }}>
              {/* Sidebar */}
              <div style={{ width: 180, background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '0 8px' }}>
                  <span style={{ fontSize: 16 }}>🏪</span>
                  <span style={{ fontWeight: 900, fontSize: 11, letterSpacing: '-0.01em', fontStyle: 'italic', textTransform: 'uppercase' }}>StockPilot</span>
                </div>
                {[['📊','Vista General', true], ['💰','Ventas', false], ['📦','Catálogo', false], ['🚨','Monitor Alertas', false], ['🔧','Proveedores', false]].map(([ico, label, active]) => (
                  <div key={label} style={{ padding: '9px 12px', borderRadius: 10, background: active ? '#6366f1' : 'transparent', color: active ? '#fff' : '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{ico}</span>{label}
                  </div>
                ))}
              </div>
              {/* Content */}
              <div style={{ flex: 1, background: '#f8fafc', padding: '24px 20px', overflow: 'hidden' }}>
                <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#1e293b', marginBottom: 4, fontStyle: 'italic' }}>Vista General</p>
                <p style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Resumen actual de tu negocio</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[['Productos','18','#1e293b','Catálogo'], ['Valor Inventario','$2.3M','#6366f1','Inventario'], ['Alertas','3','#ef4444','URGENTE'], ['Ventas Hoy','$354K','#10b981','Hoy']].map(([label, val, color, sub]) => (
                    <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <p style={{ fontSize: 8, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</p>
                      <p style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: '-0.03em', fontStyle: 'italic', marginBottom: 2 }}>{val}</p>
                      <p style={{ fontSize: 8, color, fontWeight: 800, textTransform: 'uppercase' }}>{sub}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#0f172a', borderRadius: 16, padding: '16px 18px', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🚀</div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.01em' }}>Consejero IA</p>
                      <p style={{ fontSize: 8, color: '#a5b4fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recomendaciones inteligentes</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Arroz Roa 5kg', 'ALTA DEMANDA', '+42 ud sugeridas'], ['Aceite Girasol 1L', 'BAJA ROTACIÓN', 'Revisar stock']].map(([prod, tag, action]) => (
                      <div key={prod} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ fontSize: 9, fontWeight: 900, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: 4 }}>{prod}</p>
                        <span style={{ fontSize: 8, fontWeight: 800, background: tag.includes('ALTA') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: tag.includes('ALTA') ? '#34d399' : '#f87171', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{tag}</span>
                        <p style={{ fontSize: 8, color: '#64748b', marginTop: 6, fontWeight: 700 }}>{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MÉTRICAS REALES */}
      <section data-section="stats" style={{ padding: '80px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className={`reveal${isVisible('stats') ? ' visible' : ''}`} style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 16 }}>Construido con criterio de ingeniería</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', fontStyle: 'italic' }}>Lo que hay dentro</h2>
          </div>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              ['15', 'Módulos funcionales', 'Desde autenticación hasta retroalimentación IA'],
              ['83', 'Requerimientos', '65 funcionales + 18 no funcionales implementados'],
              ['100%', 'Cobertura QA', '56 casos de prueba ejecutados al cierre'],
              ['5', 'Sprints Scrum', '10 semanas de desarrollo con entregas verificadas'],
            ].map(([num, label, sub], i) => (
              <div key={label} className={`stat-card reveal${isVisible('stats') ? ' visible' : ''} reveal-delay-${i+1}`}>
                <p style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.04em', fontStyle: 'italic', color: '#818cf8', marginBottom: 8 }}>{num}</p>
                <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#e2e8f0', marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 11, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section data-section="features" style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className={`reveal${isVisible('features') ? ' visible' : ''}`} style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 16 }}>Arquitectura modular</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 16 }}>Tres capas de inteligencia</h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>Cada capa resuelve un problema real del tendero bogotano.</p>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: '🤖', color: '#818cf8', title: 'Copiloto IA (GPT-4o-mini)', desc: 'Analiza el inventario y genera recomendaciones de reabastecimiento en lenguaje natural, con guardrails por clasificación ABC y auditoría completa de cada decisión del modelo.', tag: 'Motor predictivo' },
              { icon: '📊', color: '#34d399', title: 'Analítica en tiempo real', desc: 'Dashboard con valor del inventario, ventas del día, proyección de agotamiento por producto y nivel de servicio. Actualizado en cada transacción registrada.', tag: 'Centro analítico' },
              { icon: '🔍', color: '#f472b6', title: 'Auditoría transparente', desc: 'Cada decisión de la IA queda registrada con su prompt, respuesta y ajuste aplicado. La retroalimentación adaptativa mejora las sugerencias con cada ciclo.', tag: 'Trazabilidad total' },
            ].map(({ icon, color, title, desc, tag }, i) => (
              <div key={title} className={`feature-card reveal${isVisible('features') ? ' visible' : ''} reveal-delay-${i+1}`}>
                <div style={{ width: 52, height: 52, background: `${color}18`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>{icon}</div>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color, marginBottom: 12, display: 'block' }}>{tag}</span>
                <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 12, color: '#f1f5f9' }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, fontWeight: 500 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section data-section="modules" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className={`reveal${isVisible('modules') ? ' visible' : ''}`} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 16 }}>Todo incluido</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', fontStyle: 'italic' }}>15 módulos operativos</h2>
          </div>
          <div className={`reveal${isVisible('modules') ? ' visible' : ''} reveal-delay-2`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              ['🔐', 'Autenticación y roles'],
              ['📦', 'Gestión de productos'],
              ['💰', 'Registro de ventas'],
              ['📋', 'Control de movimientos'],
              ['🏪', 'Gestión multi-tienda'],
              ['🧠', 'Motor de predicción IA'],
              ['🛒', 'Órdenes de compra'],
              ['🚨', 'Alertas inteligentes'],
              ['📊', 'Dashboard analítico'],
              ['📄', 'Reportes y exportación'],
              ['🚚', 'Gestión de proveedores'],
              ['👥', 'Gestión de colaboradores'],
              ['🧪', 'Simulador de escenarios'],
              ['🔄', 'Retroalimentación IA'],
              ['📧', 'Automatización semanal'],
            ].map(([ico, label]) => (
              <div key={label} className="module-chip">
                <span style={{ fontSize: 15 }}>{ico}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" data-section="demo" style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className={`reveal${isVisible('demo') ? ' visible' : ''}`} style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 16 }}>Sistema desplegado</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 16 }}>Acceso al demo</h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>Sistema operativo en Railway con base de datos PostgreSQL persistente.</p>
          </div>
          <div className="demo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Credenciales */}
            <div className={`cred-card reveal${isVisible('demo') ? ' visible' : ''} reveal-delay-1`}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 24 }}>Credenciales de prueba</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '18px 20px' }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Administrador</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Usuario: <span style={{ color: '#fff', fontWeight: 900 }}>Carlos Admin</span></p>
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Contraseña: consultar al autor</p>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: '18px 20px' }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>Colaborador</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Usuario: <span style={{ color: '#fff', fontWeight: 900 }}>María</span></p>
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Contraseña: consultar al autor</p>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div className={`reveal${isVisible('demo') ? ' visible' : ''} reveal-delay-2`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ flex: 1, background: '#6366f1', borderRadius: 20, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Registra tu tienda</p>
                  <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: 16 }}>Empieza a operar en minutos</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, fontWeight: 500 }}>Crea tu tienda, carga tus productos y deja que la IA empiece a sugerir pedidos basados en tu ritmo de ventas real.</p>
                </div>
                <button onClick={() => navigate('/register')} style={{ marginTop: 24, background: '#fff', color: '#4f46e5', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s' }}>
                  Registrar mi tienda →
                </button>
              </div>
              {/* Roadmap */}
              <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px 28px' }}>
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 16 }}>Roadmap v4</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['Panel maestro multi-sucursal', 'Planes de suscripción', 'API pública para integraciones', 'App móvil nativa'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, color: '#6366f1' }}>→</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section data-section="cta" style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-glow" style={{ width: 600, height: 400, background: 'rgba(99,102,241,0.12)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className={`reveal${isVisible('cta') ? ' visible' : ''}`} style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 72, height: 72, background: '#6366f1', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 32px' }}>🚀</div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 20, lineHeight: 1.1 }}>
            Haz que tu inventario<br />
            <span style={{ color: '#818cf8' }}>trabaje para ti.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 40, lineHeight: 1.65, fontWeight: 500 }}>
            La transformación digital de tu negocio empieza con datos. Crea tu tienda y empieza a tomar decisiones basadas en tu inventario real.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/register')}>Acceder al demo</button>
            <button className="btn-ghost" onClick={() => navigate('/login')}>Ya tengo cuenta</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, background: '#1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏪</div>
          <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: '-0.01em', fontStyle: 'italic', textTransform: 'uppercase' }}>StockPilot</span>
        </div>
        <p style={{ fontSize: 11, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Práctica de Ingeniería IV · Universidad Central · 2026</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          {['Términos', 'Privacidad', 'Contacto'].map(link => (
            <span key={link} style={{ fontSize: 12, color: '#334155', cursor: 'pointer', transition: 'color 0.2s', fontWeight: 600 }}
              onMouseEnter={e => e.target.style.color = '#94a3b8'}
              onMouseLeave={e => e.target.style.color = '#334155'}
            >{link}</span>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#1e293b', marginTop: 20 }}>© 2026 StockPilot</p>
      </footer>
    </div>
  );
};

export default LandingPage;
