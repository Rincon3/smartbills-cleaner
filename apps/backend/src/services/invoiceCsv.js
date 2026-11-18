const CSV_COLUMNS = [
  { header: "proveedor", get: (invoice) => invoice.supplier },
  { header: "NIT", get: (invoice) => invoice.taxId },
  { header: "fecha", get: (invoice) => formatCsvDate(invoice.issueDate) },
  { header: "subtotal", get: (invoice) => formatCsvNumber(invoice.subtotal) },
  { header: "IVA", get: (invoice) => formatCsvNumber(invoice.vat) },
  { header: "total", get: (invoice) => formatCsvNumber(invoice.total) }
];

export function formatCsvDate(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

export function formatCsvNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

export function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function invoicesToCsv(invoices = []) {
  const header = CSV_COLUMNS.map((column) => csvEscape(column.header)).join(",");
  const rows = invoices.map((invoice) => CSV_COLUMNS.map((column) => csvEscape(column.get(invoice))).join(","));
  return `\uFEFF${[header, ...rows].join("\r\n")}\r\n`;
}
