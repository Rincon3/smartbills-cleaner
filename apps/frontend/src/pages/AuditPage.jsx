import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api.getAuditLogs().then(setLogs);
    }
  }, [user]);

  if (user?.role !== "ADMIN") {
    return (
      <section className="page">
        <section className="panel empty-state">
          <h2>Auditoria visible solo para administradores</h2>
          <p>El backend ya registra login, upload, edit, delete y cambios de usuarios.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="page">
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Bitacora de auditoria</h3>
            <p>Ultimos eventos registrados por el sistema</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Accion</th>
                <th>Entidad</th>
                <th>Usuario</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString("es-CO")}</td>
                  <td>{log.action}</td>
                  <td>{log.entity}</td>
                  <td>{log.user?.name}</td>
                  <td>{log.ipAddress || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

