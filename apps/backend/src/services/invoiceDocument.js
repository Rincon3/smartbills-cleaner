function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value) {
  return String(value).slice(0, 10);
}

export function buildCitationLabel(invoiceCode, page) {
  return `[Factura ${invoiceCode}, pág. ${page}]`;
}

export function buildChunkSource(invoiceId, page) {
  return `${invoiceId}:${page}`;
}

export function buildInvoicePages(invoice) {
  const issueDate = formatDate(invoice.issueDate);
  const extraFields = (invoice.fields || [])
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");

  return [
    {
      page: 1,
      section: "Encabezado y datos del emisor",
      text: [
        `Factura ${invoice.code}`,
        `Proveedor: ${invoice.supplier}`,
        `NIT: ${invoice.taxId}`,
        `Fecha de emision: ${issueDate}`,
        `Archivo fuente: ${invoice.fileName}`,
        extraFields
      ]
        .filter(Boolean)
        .join("\n")
    },
    {
      page: 2,
      section: "Detalle de conceptos",
      text: [
        `Detalle de la factura ${invoice.code} emitida por ${invoice.supplier}.`,
        `Subtotal antes de impuestos: ${formatMoney(invoice.subtotal)}`,
        `Fecha de los servicios: ${issueDate}`
      ].join("\n")
    },
    {
      page: 3,
      section: "Impuestos y totales",
      text: [
        `Resumen de cobro de la factura ${invoice.code}.`,
        `IVA: ${formatMoney(invoice.vat)}`,
        `Total a pagar: ${formatMoney(invoice.total)}`,
        `Estado de procesamiento: ${invoice.status}`
      ].join("\n")
    }
  ];
}
