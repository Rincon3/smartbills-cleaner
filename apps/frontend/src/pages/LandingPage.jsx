import { Link } from "react-router-dom";

const highlights = [
  "Carga drag & drop para PDF, PNG, JPG y TIFF",
  "Extraccion OCR simulada con campos editables y confianza",
  "Dashboard ejecutivo con KPIs, auditoria y trazabilidad"
];

const sprintCards = [
  {
    title: "Operacion editorial centralizada",
    copy: "Unifica la recepcion, validacion y seguimiento de facturas en una sola consola."
  },
  {
    title: "Arquitectura lista para crecer",
    copy: "Hoy funciona en modo simulado; manana puede conectar OCR y storage reales sin rehacer la UX."
  },
  {
    title: "Gobierno y control",
    copy: "Roles, auditoria y flujo de aprobacion pensados para un MVP serio y demostrable."
  }
];

export function LandingPage() {
  return (
    <div className="landing-screen">
      <header className="landing-topbar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>Smart Bills</strong>
            <span>Editorial Billing</span>
          </div>
        </div>
        <nav className="landing-nav">
          <a href="#valor">Valor</a>
          <a href="#modulos">Modulos</a>
          <a href="#demo">Demo</a>
          <Link className="ghost-button" to="/register">
            Registrarse
          </Link>
          <Link className="secondary-button" to="/login">
            Iniciar sesion
          </Link>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">MVP DE FACTURACION EDITORIAL</p>
          <h1>La app ya se siente como producto que optimisa las lecturas de tus facturas.</h1>
          <p>
            SmartBills Cleaner organiza carga documental, OCR simulado, validacion manual,
            auditoria y dashboard operativo para las primeras entregas del proyecto.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/login">
              Entrar a la demo
            </Link>
            <Link className="secondary-button" to="/register">
              Crear cuenta viewer
            </Link>
            <Link className="ghost-button" to="/app">
              Ver consola
            </Link>
          </div>
          <div className="hero-badges">
            {highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="hero-preview" id="demo">
          <div className="preview-card preview-card--main">
            <span>Procesadas</span>
            <strong>1,284</strong>
            <small>+12.5% este mes</small>
          </div>
          <div className="preview-card preview-card--accent">
            <span>Precision OCR</span>
            <strong>99.2%</strong>
            <small>Simulacion validable</small>
          </div>
          <div className="preview-stats">
            <div>
              <span>En cola</span>
              <strong>42</strong>
            </div>
            <div>
              <span>Con error</span>
              <strong>07</strong>
            </div>
            <div>
              <span>Usuarios</span>
              <strong>03</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="valor">
        <div className="landing-section-copy">
          <p className="eyebrow">Por que se ve mas serio</p>
          <h2>Una primera impresion mas creible para sustentar el PMV.</h2>
        </div>
        <div className="landing-grid">
          {sprintCards.map((card) => (
            <article className="panel landing-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="modulos">
        <div className="panel module-strip">
          <div>
            <span>01</span>
            <strong>Landing + Login</strong>
          </div>
          <div>
            <span>02</span>
            <strong>Dashboard y auditoria</strong>
          </div>
          <div>
            <span>03</span>
            <strong>Upload y OCR editable</strong>
          </div>
          <div>
            <span>04</span>
            <strong>Usuarios y roles</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
