import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { AdvancedSearchForm, emptyFilters } from "../components/AdvancedSearchForm";
import { Icon } from "../components/Icon";
import { InvoiceEditor } from "../components/InvoiceEditor";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function InvoicesPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState({ elapsedMs: null, mode: "sql", withinSla: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadInvoices = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const payload = await api.searchInvoices(nextFilters);
      setInvoices(payload.invoices || []);
      setMeta({
        elapsedMs: payload.elapsedMs,
        mode: payload.mode,
        withinSla: payload.withinSla
      });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const totals = useMemo(
    () => ({
      total: invoices.length,
      amount: invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    }),
    [invoices]
  );

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadInvoices(filters);
  };

  const handleDelete = async (id) => {
    await api.deleteInvoice(id);
    await loadInvoices();
  };

  const handleSave = async (form) => {
    await api.updateInvoice(form.id, form);
    await loadInvoices();
  };

  return (
    <section className="page">
      <div className="page-header compact">
        <div>
          <p className="eyebrow">Repositorio documental</p>
          <h1>Facturas cargadas</h1>
          <p>
            Búsqueda híbrida: filtros SQL (proveedor, fechas, montos) y ranking semántico cuando hay
            texto.
          </p>
        </div>
        <div className="stats-inline">
          <div>
            <span>Resultados</span>
            <strong>{totals.total}</strong>
          </div>
          <div>
            <span>Monto acumulado</span>
            <strong>{formatCurrency(totals.amount)}</strong>
          </div>
          <div>
            <span>Latencia</span>
            <strong>
              {meta.elapsedMs == null ? "—" : `${meta.elapsedMs} ms`}
              {meta.withinSla === false ? " · >4s" : ""}
            </strong>
          </div>
        </div>
      </div>

      <AdvancedSearchForm
        filters={filters}
        onChange={setFilters}
        onSubmit={handleSearch}
        onReset={(cleared) => {
          setFilters(cleared);
          loadInvoices(cleared);
        }}
        loading={loading}
        submitLabel="Buscar facturas"
      />

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Resultados</h3>
            <p>
              Orden {meta.mode === "sql+pgvector" ? "semántico (pgvector)" : "por fecha"} · modo {meta.mode}
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Relevancia</th>
                <th>Factura ID</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>OCR</th>
                <th>Estado</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="8">No hay documentos con esos filtros.</td>
                </tr>
              ) : null}
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.score == null ? "—" : invoice.score.toFixed(2)}</td>
                  <td>{invoice.code}</td>
                  <td>
                    {invoice.supplier}
                    {invoice.matchSection ? (
                      <small className="match-hint">
                        {" "}
                        · pág. {invoice.matchPage} · {invoice.matchSection}
                      </small>
                    ) : null}
                  </td>
                  <td>{String(invoice.issueDate).slice(0, 10)}</td>
                  <td>{formatCurrency(invoice.total)}</td>
                  <td>{Math.round(invoice.ocrAverageConfidence * 100)}%</td>
                  <td>
                    <span className={`status-pill status-pill--${invoice.status.toLowerCase()}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={async () => setSelectedInvoice(await api.getInvoice(invoice.id))}
                    >
                      Ver
                    </button>
                    <button className="ghost-button danger" type="button" onClick={() => setPendingDelete(invoice)}>
                      Eliminar
                    </button>
                    <Icon name="more" className="more-icon" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedInvoice ? (
        <InvoiceEditor
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSave={handleSave}
        />
      ) : null}

      {pendingDelete ? (
        <div className="drawer-backdrop">
          <section className="panel delete-modal">
            <h3>Eliminar documento</h3>
            <p>
              Se quitara <strong>{pendingDelete.fileName}</strong> ({pendingDelete.code}) del repositorio y del
              almacenamiento local.
            </p>
            <div className="delete-actions">
              <button className="ghost-button" type="button" onClick={() => setPendingDelete(null)}>
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={async () => {
                  await handleDelete(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
