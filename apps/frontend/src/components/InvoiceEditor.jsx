import { useState } from "react";
import { DocumentPreview } from "./DocumentPreview";

const labelToField = {
  Proveedor: "supplier",
  NIT: "taxId",
  Fecha: "issueDate",
  Subtotal: "subtotal",
  IVA: "vat",
  Total: "total"
};

export function InvoiceEditor({ invoice, onClose, onSave }) {
  const [form, setForm] = useState(invoice);
  const [saving, setSaving] = useState(false);

  const handleRootChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFieldChange = (index, key, value) => {
    setForm((current) => {
      const fields = current.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field
      );

      const rootField = labelToField[fields[index].label];
      const nextForm = { ...current, fields };

      if (rootField) {
        nextForm[rootField] = value;
      }

      return nextForm;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <div className="drawer-header">
          <div>
            <p>Validar documento</p>
            <h3>{invoice.code}</h3>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <DocumentPreview invoice={invoice} />

        {invoice.ocrRawText ? (
          <details className="ocr-text-panel">
            <summary>Texto extraido por OCR</summary>
            <pre>{invoice.ocrRawText}</pre>
          </details>
        ) : null}

        <form className="drawer-form" onSubmit={submit}>
          <label>
            Proveedor
            <input value={form.supplier} onChange={(e) => handleRootChange("supplier", e.target.value)} />
          </label>
          <label>
            NIT
            <input value={form.taxId} onChange={(e) => handleRootChange("taxId", e.target.value)} />
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={String(form.issueDate).slice(0, 10)}
              onChange={(e) => handleRootChange("issueDate", e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label>
              Subtotal
              <input
                type="number"
                step="0.01"
                value={form.subtotal}
                onChange={(e) => handleRootChange("subtotal", e.target.value)}
              />
            </label>
            <label>
              IVA
              <input type="number" step="0.01" value={form.vat} onChange={(e) => handleRootChange("vat", e.target.value)} />
            </label>
          </div>
          <label>
            Total
            <input
              type="number"
              step="0.01"
              value={form.total}
              onChange={(e) => handleRootChange("total", e.target.value)}
            />
          </label>
          <label>
            Estado
            <select value={form.status} onChange={(e) => handleRootChange("status", e.target.value)}>
              <option value="QUEUED">En cola</option>
              <option value="PROCESSING">Procesando</option>
              <option value="PROCESSED">Procesada</option>
              <option value="ERROR">Error OCR</option>
            </select>
          </label>

          <div className="confidence-list">
            <div className="panel-heading">
              <div>
                <h3>Campos detectados</h3>
                <p>Campos detectados por OCR. Corrigelos si hace falta.</p>
              </div>
            </div>
            {form.fields.map((field, index) => (
              <div className="confidence-item" key={field.id || `${field.label}-${index}`}>
                <div>
                  <span>{field.label}</span>
                  <input
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, "value", e.target.value)}
                  />
                </div>
                <label>
                  %
                  <input
                    type="number"
                    min="0.5"
                    max="1"
                    step="0.01"
                    value={field.confidence}
                    onChange={(e) => handleFieldChange(index, "confidence", e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar validacion"}
          </button>
        </form>
      </aside>
    </div>
  );
}

