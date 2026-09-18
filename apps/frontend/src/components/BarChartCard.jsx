export function BarChartCard({ series }) {
  const max = Math.max(...series.map((item) => item.value), 1);

  return (
    <section className="panel chart-card">
      <div className="panel-heading">
        <div>
          <h3>Invoices processed per month</h3>
          <p>Comparativa de volumen operativo anual</p>
        </div>
        <div className="chart-legend">
          <span><i className="dot dot--solid" />Procesadas</span>
          <span><i className="dot dot--ghost" />Proyeccion</span>
        </div>
      </div>
      <div className="chart-bars">
        {series.map((item, index) => (
          <div className="chart-column" key={`${item.month}-${index}`}>
            <div
              className={`chart-bar ${index >= series.length - 2 ? "chart-bar--ghost" : ""}`}
              style={{ height: `${Math.max((item.value / max) * 100, 12)}%` }}
            />
            <span>{item.month}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

