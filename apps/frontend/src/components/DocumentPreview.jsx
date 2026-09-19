import { useEffect, useState } from "react";
import { api } from "../api/client";

export function DocumentPreview({ invoice }) {
  const [preview, setPreview] = useState({ url: "", mimeType: "", error: "" });

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function loadFile() {
      try {
        const file = await api.getInvoiceFile(invoice.id);
        if (cancelled) {
          URL.revokeObjectURL(file.url);
          return;
        }
        objectUrl = file.url;
        setPreview({ url: file.url, mimeType: file.mimeType || invoice.mimeType, error: "" });
      } catch (error) {
        if (!cancelled) {
          setPreview({ url: "", mimeType: "", error: error.message });
        }
      }
    }

    loadFile();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoice.id, invoice.mimeType]);

  if (preview.error) {
    return <div className="error-banner">{preview.error}</div>;
  }

  if (!preview.url) {
    return <p className="upload-status">Cargando documento original...</p>;
  }

  const isPdf = (preview.mimeType || "").includes("pdf") || invoice.fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className="document-preview">
      <div className="document-preview-meta">
        <strong>{invoice.fileName}</strong>
        <span>
          {invoice.pageCount || 1} pag. · OCR {invoice.ocrEngine || "n/d"}
        </span>
      </div>
      {isPdf ? (
        <iframe title={invoice.fileName} src={preview.url} className="document-frame" />
      ) : (
        <img alt={invoice.fileName} src={preview.url} className="document-image" />
      )}
    </div>
  );
}
