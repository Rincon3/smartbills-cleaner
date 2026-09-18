import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
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
          <p className="eyebrow">ACCESO SELF-SERVICE</p>
          <h1>Crea tu cuenta viewer</h1>
          <p>
            Registra un usuario de tipo viewer desde la landing para explorar el MVP sin depender
            de un administrador.
          </p>
          <div className="login-badges">
            <span>Rol VIEWER</span>
            <span>Registro publico</span>
            <span>Ingreso inmediato</span>
          </div>
        </div>

        <form className="login-form" onSubmit={submit}>
          <h2>Registro de usuario</h2>
          <p>El sistema te asigna automaticamente el rol `VIEWER`.</p>
          <Link className="back-link" to="/">
            Volver al landing
          </Link>
          <label>
            Nombre completo
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
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
            {loading ? "Creando cuenta..." : "Crear cuenta y entrar"}
          </button>
          <div className="login-hint">
            <strong>Que podras hacer</strong>
            <span>Entrar al dashboard</span>
            <span>Consultar facturas y flujo</span>
          </div>
        </form>
      </section>
    </div>
  );
}

