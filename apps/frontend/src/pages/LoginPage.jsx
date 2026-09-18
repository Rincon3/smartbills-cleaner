import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "admin@smartbills.local",
    password: "Admin123!"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate("/app");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <section className="login-card">
        <div className="login-copy">
          <p className="eyebrow">EDITORIAL AUTOMATION</p>
          <h1>SmartBills Cleaner</h1>
          <p>
            MVP funcional para centralizar carga, OCR , validacion y seguimiento de
            facturas editoriales.
          </p>
          <div className="login-badges">
            <span>JWT Auth</span>
            <span>Prisma + PostgreSQL</span>
            <span>OCR </span>
          </div>
        </div>

        <form className="login-form" onSubmit={submit}>
          <h2>Iniciar sesion</h2>
          <p>Usa cualquiera de los usuarios seed para entrar al sistema.</p>
          <Link className="back-link" to="/">
            Volver al landing
          </Link>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            Contrasena
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar al dashboard"}
          </button>
          <div className="login-hint">
            <strong>Usuarios de prueba</strong>
            <span>admin@smartbills.local / Admin123!</span>
            <span>analyst@smartbills.local / Analyst123!</span>
            <span>
              O crea una cuenta en <Link to="/register">registro publico</Link>
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}
