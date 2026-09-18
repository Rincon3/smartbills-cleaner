export function KpiCard({ title, value, helper, tone = "primary", progress }) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-icon" />
      <p>{title}</p>
      <strong>{value}</strong>
      {progress ? (
        <div className="kpi-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <small>{helper}</small>
    </article>
  );
}

