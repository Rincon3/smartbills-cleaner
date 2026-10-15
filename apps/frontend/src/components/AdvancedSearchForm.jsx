const emptyFilters = {
  q: "",
  supplier: "",
  status: "",
  from: "",
  to: "",
  minTotal: "",
  maxTotal: ""
};

export function AdvancedSearchForm({
  filters,
  onChange,
  onSubmit,
  onReset,
  loading = false,
  submitLabel = "Buscar",
  showQuery = true,
  showStatus = true
}) {
  const setField = (field) => (event) =>
    onChange({
      ...filters,
      [field]: event.target.value
    });

  return (
    <form className="panel advanced-search" onSubmit={onSubmit}>
      <div className="panel-heading">
        <div>
          <h3>Búsqueda avanzada</h3>
          <p>Filtros SQL primero; si hay texto, el orden es semántico (pgvector).</p>
        </div>
      </div>
      <div className="advanced-search-grid">
        {showQuery ? (
          <label className="advanced-search-query">
            Palabra clave o concepto
            <input
              placeholder="Ej. energía, papelería, NIT, Enel"
              value={filters.q}
              onChange={setField("q")}
            />
          </label>
        ) : null}
        <label>
          Proveedor
          <input placeholder="Proveedor" value={filters.supplier} onChange={setField("supplier")} />
        </label>
        {showStatus ? (
          <label>
            Estado
            <select value={filters.status} onChange={setField("status")}>
              <option value="">Todos</option>
              <option value="QUEUED">En cola</option>
              <option value="PROCESSING">Procesando</option>
              <option value="PROCESSED">Procesada</option>
              <option value="ERROR">Error OCR</option>
            </select>
          </label>
        ) : null}
        <label>
          Fecha inicio
          <input type="date" value={filters.from} onChange={setField("from")} />
        </label>
        <label>
          Fecha fin
          <input type="date" value={filters.to} onChange={setField("to")} />
        </label>
        <label>
          Monto mín. (COP)
          <input type="number" min="0" placeholder="0" value={filters.minTotal} onChange={setField("minTotal")} />
        </label>
        <label>
          Monto máx. (COP)
          <input type="number" min="0" placeholder="999999999" value={filters.maxTotal} onChange={setField("maxTotal")} />
        </label>
      </div>
      <div className="advanced-search-actions">
        <button className="ghost-button" type="button" onClick={() => onReset(emptyFilters)}>
          Limpiar
        </button>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Buscando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export { emptyFilters };
