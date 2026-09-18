import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "VIEWER"
  });
  const [message, setMessage] = useState("");

  const loadUsers = () => api.getUsers().then(setUsers);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadUsers();
    }
  }, [user]);

  if (user?.role !== "ADMIN") {
    return (
      <section className="page">
        <section className="panel empty-state">
          <h2>Acceso restringido</h2>
          <p>Solo el rol ADMIN puede gestionar usuarios en este MVP.</p>
        </section>
      </section>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    await api.createUser(form);
    setMessage("Usuario creado correctamente.");
    setForm({ name: "", email: "", password: "", role: "VIEWER" });
    await loadUsers();
  };

  const changeRole = async (id, role) => {
    await api.updateUser(id, { role });
    await loadUsers();
  };

  return (
    <section className="page users-grid">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Crear usuario</h3>
            <p>Asigna roles `ADMIN`, `ANALYST` o `VIEWER`.</p>
          </div>
        </div>
        <form className="stack-form" onSubmit={submit}>
          <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} />
          <input placeholder="Contrasena" type="password" value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} />
          <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))}>
            <option value="ADMIN">ADMIN</option>
            <option value="ANALYST">ANALYST</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <button className="primary-button" type="submit">
            Crear usuario
          </button>
          {message ? <span className="success-copy">{message}</span> : null}
        </form>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Usuarios registrados</h3>
            <p>Administracion basica de acceso</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Alta</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>
                    <select value={row.role} onChange={(e) => changeRole(row.id, e.target.value)}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="ANALYST">ANALYST</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </td>
                  <td>{new Date(row.createdAt).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

