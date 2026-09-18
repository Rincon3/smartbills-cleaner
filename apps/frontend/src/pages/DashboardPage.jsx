import { useEffect, useState } from "react";
import { api } from "../api/client";
import { KpiCard } from "../components/KpiCard";
import { BarChartCard } from "../components/BarChartCard";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2
  }).format(value || 0);
}

export function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);

  if (!data) {
    return <div className="screen-loader">Cargando dashboard...</div>;
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dashboard principal</p>
          <h1>Vision general</h1>
          <p>Controla y gestiona el flujo de facturacion editorial con precision automatizada.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button">
            Descargar reporte
          </button>
          <button className="primary-button" type="button">
            Cargar nueva factura
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Facturas procesadas" value={data.kpis.processed} helper="+12.5% este mes" />
        <KpiCard
          title="En procesamiento"
          value={data.kpis.queued}
          helper="Cola operativa actual"
          progress={Math.min(data.kpis.queued * 12, 100)}
        />
        <KpiCard title="Facturas con error" value={data.kpis.error} helper="Requiere atencion inmediata" tone="danger" />
        <KpiCard
          title="Precision promedio OCR"
          value={`${data.kpis.avgConfidence}%`}
          helper="Algoritmo simulado optimizado"
          tone="success"
        />
      </div>

      <div className="dashboard-grid">
        <BarChartCard
          series={
            data.monthlySeries.length >= 6
              ? data.monthlySeries
              : [
                  { month: "ENE", value: 4 },
                  { month: "FEB", value: 6 },
                  { month: "MAR", value: 5 },
                  { month: "ABR", value: 8 },
                  { month: "MAY", value: 10 },
                  { month: "JUN", value: 12 },
                  { month: "JUL", value: 7 },
                  { month: "AGO", value: 9 }
                ]
          }
        />

        <aside className="panel insight-card">
          <div className="insight-spark" />
          <h3>Smart Insights</h3>
          <p>
            Se detectan patrones de duplicado y riesgo operativo en las ultimas cargas. En este
            MVP los insights son simulados, pero el flujo queda listo para evolucionar.
          </p>
          <div className="insight-metric">
            <span>Ahorro potencial</span>
            <strong>{formatCurrency(1420)}</strong>
          </div>
          <button className="primary-button" type="button">
            Revisar duplicados
          </button>
        </aside>
      </div>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Ultimas 5 facturas cargadas</h3>
            <p>Vista rapida del estado operacional</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Factura ID</th>
                <th>Proveedor</th>
                <th>Fecha carga</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.code}</td>
                  <td>{invoice.supplier}</td>
                  <td>{new Date(invoice.uploadedAt).toLocaleString("es-CO")}</td>
                  <td>{formatCurrency(invoice.total)}</td>
                  <td>
                    <span className={`status-pill status-pill--${invoice.status.toLowerCase()}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

