import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Icon } from "../components/Icon";
import { InvoiceEditor } from "../components/InvoiceEditor";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2
  }).format(value || 0);
}

export function InvoicesPage() {
  const [filters, setFilters] = useState({
    status: "",
    supplier: "",
    from: "",
    to: ""
  });
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadInvoices = () => api.getInvoices(filters).then(setInvoices);

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
    await loadInvoices();
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
          <p>Filtra, revisa, corrige y elimina documentos dentro del flujo del MVP.</p>
        </div>
        <div className="stats-inline">
          <div>
            <span>Total</span>
            <strong>{totals.total}</strong>
          </div>
          <div>
            <span>Monto acumulado</span>
            <strong>{formatCurrency(totals.amount)}</strong>
          </div>
        </div>
      </div>

      <form className="filter-bar panel" onSubmit={handleSearch}>
        <input
          placeholder="Proveedor"
          value={filters.supplier}
          onChange={(event) => setFilters((current) => ({ ...current, supplier: event.target.value }))}
        />
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">Todos los estados</option>
          <option value="QUEUED">En cola</option>
          <option value="PROCESSING">Procesando</option>
          <option value="PROCESSED">Procesada</option>
          <option value="ERROR">Error OCR</option>
        </select>
        <input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
        <input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
        <button className="secondary-button" type="submit">
          Aplicar filtros
        </button>
      </form>

      <section className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
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
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.code}</td>
                  <td>{invoice.supplier}</td>
                  <td>{String(invoice.issueDate).slice(0, 10)}</td>
                  <td>{formatCurrency(invoice.total)}</td>
                  <td>{Math.round(invoice.ocrAverageConfidence * 100)}%</td>
                  <td>
                    <span className={`status-pill status-pill--${invoice.status.toLowerCase()}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button className="ghost-button" type="button" onClick={() => setSelectedInvoice(invoice)}>
                      Validar
                    </button>
                    <button className="ghost-button danger" type="button" onClick={() => handleDelete(invoice.id)}>
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
    </section>
  );
}

