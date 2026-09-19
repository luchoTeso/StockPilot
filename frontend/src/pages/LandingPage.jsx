import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

/* ------------------------------------------------------------------
   StockPilot — Landing
   Idea: el mundo de la tienda de barrio. El héroe es la tirilla de caja
   con lo que la IA sugiere hoy; el azul es el del esfero con que se
   anota el cuaderno; el amarillo es el resaltador.
   Todo lo demás (secciones, tipografía, listas) se mantiene callado.
------------------------------------------------------------------- */

const DECISIONES = [
  {
    pregunta: '¿Qué pido?',
    texto:
      'Analiza tu historial de ventas, calcula cuánto vas a necesitar y arma la orden de compra para cada proveedor sin pasarte de tu presupuesto.',
    muestra: (
      <>
        <p className="sp-s-name">Arroz Roa 5 kg</p>
        <p className="sp-s-line">
          <span className="sp-pill sp-pill-ok">Alta demanda</span>
          <strong>+42 ud</strong>
        </p>
      </>
    ),
  },
  {
    pregunta: '¿Qué remato?',
    texto:
      'Encuentra lo que se está quedando quieto o está por vencer y propone un descuento, un 2x1 o un combo. Tú activas la oferta cuando quieras.',
    muestra: (
      <>
        <p className="sp-s-name">Yogurt 200 g</p>
        <p className="sp-s-line">
          <span className="sp-pill sp-pill-desc">-15%</span>
          <span>
            Recuperas <strong>$28.560</strong>
          </span>
        </p>
      </>
    ),
  },
  {
    pregunta: '¿A quién le fío?',
    texto:
      'Revisa cómo paga cada cliente y te dice si puedes darle más crédito o si conviene cobrarle antes. Menos cartera perdida.',
    muestra: (
      <>
        <p className="sp-s-name">Marta R.</p>
        <p className="sp-s-line">
          <span className="sp-pill sp-pill-risk">Riesgo alto</span>
          <span>
            Debe <strong>$86.000</strong>
          </span>
        </p>
      </>
    ),
  },
  {
    pregunta: '¿Qué tan segura está?',
    texto:
      'Cada sugerencia trae su nivel de confianza y guarda los datos en que se basó, para que puedas revisar cuándo, por qué y qué decidiste.',
    muestra: (
      <>
        <p className="sp-s-name">Aceite Girasol 1 L</p>
        <p className="sp-s-line">
          <span>Confianza</span>
          <strong>52%</strong>
        </p>
        <div className="sp-bar" role="img" aria-label="Confianza de 52%">
          <span style={{ width: '52%' }} />
        </div>
      </>
    ),
  },
];

const GRUPOS = [
  { 
    titulo: 'Vender', 
    items: ['Punto de venta (POS)', 'Gestión de cajeros', 'Lector de códigos de barras', 'Historial de ventas y caja'] 
  },
  {
    titulo: 'Controlar el inventario',
    items: ['Gestión de inventarios', 'Kardex y movimientos', 'Monitor de agotamiento', 'Gestión de proveedores'],
  },
  {
    titulo: 'Decidir con IA',
    items: [
      'Motor de predicción',
      'Órdenes a proveedor',
      'Estratega de promociones',
      'Evaluador de riesgo (fiados)',
      'Simulador de riesgos',
      'Feedback adaptativo',
    ],
  },
  {
    titulo: 'Administrar',
    items: [
      'Dashboard analítico',
      'Auditoría transparente',
      'Roles y permisos',
      'Soporte multi-tienda',
      'Reportes PDF y Excel',
      'Automatización de tareas',
    ],
  },
];

const USUARIOS = [
  { rol: 'Administrador', usuario: 'Carlos Admin' },
  { rol: 'Colaborador', usuario: 'María' },
];

const FICHA = [
  ['Metodología', 'Scrum, 5 sprints en 10 semanas'],
  ['Requerimientos', '95: 75 funcionales y 20 no funcionales'],
  ['Pruebas', '64 casos ejecutados al cierre'],
  ['Inteligencia artificial', 'GPT-4o-mini'],
  ['Datos', 'PostgreSQL'],
];

const VERSION_4 = [
  'Panel maestro multi-sucursal',
  'Planes de suscripción',
  'API pública para integraciones',
  'App móvil nativa',
];

const LandingPage = () => (
  <div className="sp">
    <style>{CSS}</style>

    {/* ───────── Hero ───────── */}
    <nav className="sp-navbar" aria-label="Principal">
      <div className="sp-wrap sp-nav">
        <Link to="/" className="sp-brand" aria-label="StockPilot, inicio">
          <span className="sp-brand-mark" aria-hidden="true">
            <Store size={20} />
          </span>
          <span className="sp-brand-text">StockPilot</span>
        </Link>
        <div className="sp-nav-actions">
          <Link to="/login" className="sp-link">
            Iniciar sesión
          </Link>
          <Link to="/register" className="sp-btn sp-btn-line sp-nav-cta">
            Crear mi tienda
          </Link>
        </div>
      </div>
    </nav>

    <header className="sp-hero">
      <div className="sp-wrap">
        <div className="sp-hero-grid">
          <div>
            <h1 className="sp-h1">
              <span>Qué pedir.</span>
              <span>Qué rematar.</span>
              <span>A quién fiarle.</span>
            </h1>
            <p className="sp-lead">
              StockPilot lee tus ventas y tu inventario y te deja listas tres decisiones: el pedido a proveedores, las
              ofertas y el crédito de cada cliente. Tú eliges qué aprobar.
            </p>
            <div className="sp-cta-row">
              <Link to="/register" className="sp-btn sp-btn-primary">
                Crear mi tienda
              </Link>
              <a href="#como" className="sp-link">
                Ver cómo funciona
              </a>
            </div>
          </div>

          {/* La tirilla: único momento animado de la página (se imprime al cargar) */}
          <figure className="sp-print">
            <figcaption className="sp-sr">Ejemplo de las sugerencias de StockPilot para un día</figcaption>
            <div className="sp-slot" aria-hidden="true" />
            <div className="sp-paper">
              <div className="sp-receipt">
                <p className="sp-r-center sp-r-name">StockPilot</p>
                <p className="sp-r-center">Sugerencias de hoy</p>
                <hr className="sp-r-hr" />

                <p className="sp-r-head">Pedir a proveedores</p>
                <ul>
                  <li className="sp-r-row">
                    <span>Arroz Roa 5 kg</span>
                    <span>+42 ud</span>
                  </li>
                  <li className="sp-r-row">
                    <span>Huevos x30</span>
                    <span>+12 ud</span>
                  </li>
                </ul>
                <hr className="sp-r-hr" />

                <p className="sp-r-head">Rematar esta semana</p>
                <ul>
                  <li className="sp-r-row">
                    <span>Yogurt 200 g</span>
                    <span>{'-15%\u00A0\u00A0$28.560'}</span>
                  </li>
                  <li className="sp-r-row">
                    <span>Leche UHT 1 L</span>
                    <span>{'-25%\u00A0\u00A0$25.200'}</span>
                  </li>
                </ul>
                <hr className="sp-r-hr" />

                <p className="sp-r-head">Fiados</p>
                <ul>
                  <li>
                    <p className="sp-r-row">
                      <span>Marta R.</span>
                      <span>No fiar más</span>
                    </p>
                    <p className="sp-r-note">debe $86.000, 3 semanas sin abonar</p>
                  </li>
                  <li>
                    <p className="sp-r-row">
                      <span>Julián P.</span>
                      <span>Puede fiar</span>
                    </p>
                    <p className="sp-r-note">debe $40.000, paga a tiempo</p>
                  </li>
                </ul>
                <hr className="sp-r-hr" />

                <p className="sp-r-row sp-r-total">
                  <span>Capital por recuperar</span>
                  <span>$53.760</span>
                </p>
                <hr className="sp-r-hr" />
                <p className="sp-r-center">Tú decides qué aprobar.</p>
                <p className="sp-r-center sp-r-note">Ejemplo con datos ficticios</p>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </header>

    <main>
      {/* ───────── Las cuatro preguntas ───────── */}
      <section id="como" className="sp-sec" aria-labelledby="como-t">
        <div className="sp-wrap">
          <h2 id="como-t" className="sp-h2">
            Las decisiones que hoy tomas de memoria
          </h2>
          <ul className="sp-rows">
            {DECISIONES.map(({ pregunta, texto, muestra }) => (
              <li key={pregunta} className="sp-row">
                <h3 className="sp-q">{pregunta}</h3>
                <p className="sp-row-text">{texto}</p>
                <div className="sp-sample">{muestra}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Módulos ───────── */}
      <section className="sp-sec sp-mod" aria-labelledby="mod-t">
        <div className="sp-wrap sp-mod-grid">
          <div className="sp-mod-intro">
            <h2 id="mod-t" className="sp-h2">
              18 módulos en un solo sistema
            </h2>
            <p>Vender, controlar el inventario, decidir con IA y administrar la tienda sin cambiar de aplicación.</p>
          </div>
          <div className="sp-groups">
            {GRUPOS.map(({ titulo, items }) => (
              <div key={titulo} className="sp-group">
                <h3>{titulo}</h3>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Demo + CTA final ───────── */}
      <section id="demo" className="sp-sec sp-demo" aria-labelledby="demo-t">
        <div className="sp-wrap sp-demo-grid">
          <div>
            <h2 id="demo-t" className="sp-h2">
              Pruébalo con una tienda de ejemplo
            </h2>
            <p className="sp-demo-copy">
              Entra con uno de los usuarios de prueba, o crea tu propia tienda, carga tus productos y deja que la IA
              empiece a sugerir pedidos según tu ritmo de ventas real.
            </p>
            <div className="sp-cta-row">
              <Link to="/register" className="sp-btn sp-btn-primary">
                Crear mi tienda
              </Link>
              <Link to="/login" className="sp-link">
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div className="sp-slip">
            <p className="sp-slip-title">Usuarios de prueba</p>
            {USUARIOS.map(({ rol, usuario }) => (
              <div key={rol} className="sp-slip-user">
                <h3>{rol}</h3>
                <dl>
                  <div>
                    <dt>Usuario</dt>
                    <dd>{usuario}</dd>
                  </div>
                  <div>
                    <dt>Contraseña</dt>
                    <dd>consultar al autor</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

    {/* ───────── Ficha del proyecto + pie ───────── */}
    <footer className="sp-ficha" aria-labelledby="ficha-t">
      <div className="sp-wrap">
        <h2 id="ficha-t" className="sp-h2">
          Ficha del proyecto
        </h2>
        <div className="sp-ficha-grid">
          <dl className="sp-spec">
            {FICHA.map(([dt, dd]) => (
              <div key={dt}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
          <div className="sp-next">
            <h3>Lo que viene en la v4</h3>
            <ul>
              {VERSION_4.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="sp-foot">
          <span>StockPilot v3.0</span>
          <span>Práctica de Ingeniería IV, Universidad Central, 2026</span>
        </div>
      </div>
    </footer>
  </div>
);

/* Nota: si prefieres, mueve este @import a index.html con <link rel="preconnect"> + <link rel="stylesheet">. */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

/* Los resets usan :where() para tener especificidad 0 y no pisar las clases de abajo */
:where(.sp) :where(h1, h2, h3, p, ul, dl, dd, hr, figure) { margin: 0; padding: 0; }
:where(.sp) ul { list-style: none; }
:where(.sp) a { color: inherit; }

.sp {
  --azul: #252C93;       /* azul esfero: el índigo del producto, más hondo */
  --tinta: #14173F;      /* texto y fondos oscuros */
  --tinta-2: #3A3F6E;   /* texto secundario */
  --papel: #EEF0F8;      /* papel de cuaderno */
  --tirilla: #FDFDFB;    /* papel térmico */
  --resaltador: #FFD84A; /* acción y énfasis */
  --ambar: #E08A00;
  --ring: var(--azul);

  font-family: 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: var(--tinta);
  background: var(--papel);
  line-height: 1.55;
  min-height: 100vh;
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}
.sp *, .sp *::before, .sp *::after { box-sizing: border-box; }
.sp :focus-visible { outline: 3px solid var(--ring); outline-offset: 3px; }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }

.sp [id] { scroll-margin-top: 88px; }
.sp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.sp-wrap { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* Botones y enlaces */
.sp-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 48px; padding: 0 24px; border-radius: 6px;
  border: 2px solid transparent; font: inherit; font-weight: 700; font-size: 1rem;
  text-decoration: none; cursor: pointer;
  transition: background-color .15s, border-color .15s, transform .1s;
}
.sp-btn:active { transform: translateY(1px); }
.sp-btn-primary { background: var(--resaltador); color: var(--tinta); }
.sp-btn-primary:hover { background: #FFC81A; }
.sp-btn-line { min-height: 40px; padding: 0 18px; border-color: rgba(255,255,255,.6); color: #fff; }
.sp-btn-line:hover { border-color: #fff; background: rgba(255,255,255,.1); }
.sp-link { font-weight: 600; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; }
.sp-link:hover { text-decoration-color: var(--resaltador); }

/* Titulares: Archivo condensado, en minúscula normal */
.sp-h2 {
  max-width: 16em; font-weight: 800; font-stretch: 75%;
  font-size: clamp(2.2rem, 4.6vw, 3.6rem); line-height: .98; letter-spacing: -.005em;
}

/* ── Hero ── */
.sp-hero { --ring: #fff; background: var(--azul); color: #fff; padding-bottom: 104px; }
/* Nav pegajoso: mismo azul del hero, así arriba no se nota la unión y al bajar queda como barra sólida (sin blur ni JS) */
.sp-navbar { --ring: #fff; position: sticky; top: 0; z-index: 50; background: var(--azul); color: #fff; }
.sp-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.sp-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; font-weight: 800; font-stretch: 75%; font-size: 1.7rem; letter-spacing: -.005em; }
.sp-brand-mark { width: 38px; height: 38px; border-radius: 10px; background: #fff; color: var(--azul); display: grid; place-items: center; }
.sp-nav-actions { display: flex; align-items: center; gap: 22px; }

.sp-hero-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, .7fr); gap: 64px; align-items: center; padding-top: 56px; }
.sp-h1 { font-weight: 800; font-stretch: 75%; font-size: clamp(3.1rem, 7.4vw, 6.5rem); line-height: .92; letter-spacing: -.01em; }
.sp-h1 span { display: block; }
.sp-lead { margin-top: 32px; max-width: 33rem; font-size: 1.2rem; line-height: 1.5; color: rgba(255,255,255,.88); }
.sp-cta-row { margin-top: 36px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 28px; }

/* Tirilla */
.sp-print { width: min(100%, 360px); justify-self: end; }
.sp-slot { position: relative; z-index: 2; height: 14px; margin: 0 -14px; border-radius: 8px; background: var(--tinta); box-shadow: inset 0 -3px 0 rgba(255,255,255,.12); }
.sp-paper { margin: -4px 8px 0; filter: drop-shadow(0 26px 22px rgba(6,8,64,.4)); transform: rotate(1deg); transform-origin: top center; }
.sp-receipt {
  padding: 24px 22px 40px; background: var(--tirilla); color: var(--tinta);
  font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace; font-size: .8125rem; line-height: 1.5;
  -webkit-mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 18px 100%;
          mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 18px 100%;
  animation: sp-print 2.8s steps(36, end) .4s both;
}
@keyframes sp-print { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
.sp-r-center { text-align: center; }
.sp-r-name { font-size: 1rem; font-weight: 600; }
.sp .sp-r-hr { border: 0; border-top: 1px dashed rgba(20,23,63,.45); margin: 14px 0; }
.sp-r-head { font-weight: 600; margin-bottom: 6px; }
.sp-r-row { display: flex; justify-content: space-between; gap: 12px; }
.sp-r-row span:last-child { white-space: nowrap; text-align: right; }
.sp-r-note { padding-left: 12px; margin-bottom: 6px; font-size: .75rem; color: var(--tinta-2); }
.sp-r-center.sp-r-note { padding-left: 0; margin-bottom: 0; }
.sp-r-total { font-weight: 600; }
.sp-r-total span:last-child { margin-right: -6px; padding: 0 6px; background: linear-gradient(transparent 10%, var(--resaltador) 10% 90%, transparent 90%); }

/* ── Secciones ── */
.sp-sec { padding: 112px 0; }

.sp-rows { margin-top: 56px; border-bottom: 2px solid var(--tinta); }
.sp-row { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 4fr) minmax(0, 3fr); gap: 16px 40px; align-items: start; padding: 36px 0; border-top: 2px solid var(--tinta); }
.sp-q { font-weight: 800; font-stretch: 75%; font-size: clamp(2.4rem, 5vw, 4.4rem); line-height: .92; }
.sp-row-text { max-width: 36rem; font-size: 1.05rem; color: var(--tinta-2); }

/* Muestras: réplicas pequeñas de la interfaz real */
.sp-sample { display: grid; gap: 8px; padding: 14px 16px; background: #fff; border: 1px solid rgba(37,44,147,.3); border-radius: 14px; }
.sp-s-name { font-size: .95rem; font-weight: 800; }
.sp-s-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: .9rem; }
.sp-s-line strong { font-weight: 800; }
.sp-pill { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: .75rem; font-weight: 700; }
.sp-pill-ok { background: #DDF3E9; color: #0B6B45; }
.sp-pill-risk { background: #FBE3E1; color: #B42A26; }
.sp-pill-desc { background: var(--azul); color: #fff; }
.sp-bar { height: 6px; border-radius: 6px; background: #E3E6F3; overflow: hidden; }
.sp-bar span { display: block; height: 100%; background: var(--ambar); }

/* Módulos */
.sp-mod { background: #fff; }
.sp-mod-grid { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 64px; align-items: start; }
.sp-mod-intro p { margin-top: 20px; max-width: 26rem; font-size: 1.05rem; color: var(--tinta-2); }
.sp-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 48px; }
.sp-group h3, .sp-next h3 { margin-bottom: 8px; padding-top: 12px; border-top: 4px solid var(--azul); font-size: 1.1rem; font-weight: 800; }
.sp-group li, .sp-next li { padding: 9px 0; border-bottom: 1px solid rgba(20,23,63,.14); font-size: .98rem; }

/* Demo */
.sp-demo { --ring: #fff; background: var(--tinta); color: #fff; }
.sp-demo-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 72px; align-items: center; }
.sp-demo-copy { margin-top: 24px; max-width: 32rem; font-size: 1.1rem; color: rgba(255,255,255,.82); }
.sp-slip { padding: 28px 28px 32px; background: var(--resaltador); color: var(--tinta); font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace; font-size: .9rem; transform: rotate(-1.5deg); box-shadow: 0 18px 30px rgba(0,0,0,.35); }
.sp-slip-title { margin-bottom: 18px; font-weight: 600; }
.sp-slip-user + .sp-slip-user { margin-top: 22px; padding-top: 22px; border-top: 1px dashed rgba(20,23,63,.5); }
.sp-slip-user h3 { margin-bottom: 10px; font-family: 'Archivo', system-ui, sans-serif; font-weight: 800; font-stretch: 75%; font-size: 1.7rem; line-height: 1; }
.sp-slip dl > div { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; }
.sp-slip dt { color: var(--tinta-2); }
.sp-slip dd { font-weight: 600; text-align: right; }

/* Ficha y pie */
.sp-ficha { padding: 112px 0 40px; }
.sp-ficha-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 72px; margin-top: 48px; align-items: start; }
.sp-spec { border-bottom: 1px solid rgba(20,23,63,.2); }
.sp-spec > div { display: grid; grid-template-columns: 11rem 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid rgba(20,23,63,.2); }
.sp-spec dt { font-weight: 700; }
.sp-spec dd { color: var(--tinta-2); }
.sp-next li { display: flex; align-items: center; gap: 12px; }
.sp-next li::before { content: ''; flex: none; width: 14px; height: 14px; border: 2px solid var(--tinta); border-radius: 3px; }
.sp-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px; margin-top: 96px; padding-top: 24px; border-top: 2px solid var(--tinta); font-size: .9rem; color: var(--tinta-2); }

/* ── Responsive ── */
@media (max-width: 960px) {
  .sp-hero-grid { grid-template-columns: 1fr; gap: 56px; }
  .sp-print { justify-self: center; }
  .sp-row { grid-template-columns: 1fr; }
  .sp-mod-grid, .sp-demo-grid, .sp-ficha-grid { grid-template-columns: 1fr; gap: 48px; }
}
@media (max-width: 600px) {
  .sp-wrap { padding: 0 20px; }
  .sp-hero { padding-bottom: 72px; }
  .sp-nav { height: 64px; }
  .sp-sec { padding: 72px 0; }
  .sp-ficha { padding: 72px 0 32px; }
  .sp-groups { grid-template-columns: 1fr; }
  .sp-spec > div { grid-template-columns: 1fr; gap: 2px; }
  .sp-foot { margin-top: 64px; }
}
@media (max-width: 520px) {
  .sp-brand-text { display: none; }
  .sp-nav-actions { gap: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .sp-receipt { animation: none; }
  .sp-btn { transition: none; }
}
`;

export default LandingPage;