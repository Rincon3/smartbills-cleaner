import { useRef, useState } from "react";
import { api } from "../api/client";
import { DocumentPreview } from "../components/DocumentPreview";

export function UploadPage() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file) => {
    setLoading(true);
    setError("");

    try {
      const invoice = await api.uploadInvoice(file);
      setUploadedInvoice(invoice);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setLoading(false);
      setDragging(false);
    }
  };

  const onDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];

    if (file) {
      await handleUpload(file);
    }
  };

  return (
    <section className="page">
      <div className="page-header compact">
        <div>
          <p className="eyebrow">Carga documental</p>
          <h1>Subir factura</h1>
          <p>El archivo se guarda en el servidor y se lee con OCR real (PDF nativo o Tesseract si esta escaneado).</p>
        </div>
      </div>

      <div
        className={`upload-dropzone panel ${dragging ? "upload-dropzone--active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tiff"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
          }}
        />
        <div className="upload-orb" />
        <h2>Arrastra tu factura aqui</h2>
        <p>Formatos soportados: PDF, PNG, JPG, TIFF</p>
        <button className="primary-button" type="button" onClick={() => inputRef.current?.click()}>
          Seleccionar archivo
        </button>
        {loading ? <span className="upload-status">Procesando documento...</span> : null}
        {error ? <div className="error-banner">{error}</div> : null}
      </div>

      {uploadedInvoice ? (
        <section className="panel upload-result">
          <div className="panel-heading">
            <div>
              <h3>Documento incorporado</h3>
              <p>
                Motor OCR: {uploadedInvoice.ocrEngine || "n/d"} · {uploadedInvoice.pageCount || 1} pagina(s). Revisa
                los campos extraidos.
              </p>
            </div>
          </div>
          <div className="upload-preview-grid">
            <div>
              <span>Codigo</span>
              <strong>{uploadedInvoice.code}</strong>
            </div>
            <div>
              <span>Proveedor</span>
              <strong>{uploadedInvoice.supplier}</strong>
            </div>
            <div>
              <span>NIT</span>
              <strong>{uploadedInvoice.taxId}</strong>
            </div>
            <div>
              <span>Confianza OCR</span>
              <strong>{Math.round(uploadedInvoice.ocrAverageConfidence * 100)}%</strong>
            </div>
          </div>
          <div className="confidence-list">
            {uploadedInvoice.fields.map((field) => (
              <div className="confidence-item" key={field.id}>
                <div>
                  <span>{field.label}</span>
                  <strong>{field.value}</strong>
                </div>
                <b>{Math.round(field.confidence * 100)}%</b>
              </div>
            ))}
          </div>
          <DocumentPreview invoice={uploadedInvoice} />
        </section>
      ) : null}
    </section>
  );
}

