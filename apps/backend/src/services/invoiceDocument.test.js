import test from "node:test";
import assert from "node:assert/strict";
import { buildChunkSource, buildCitationLabel, buildInvoicePages } from "./invoiceDocument.js";

test("construye identificadores de fragmento y cita", () => {
  assert.equal(buildChunkSource("abc123", 2), "abc123:2");
  assert.equal(buildCitationLabel("FV-88421", 1), "[Factura FV-88421, pág. 1]");
});

test("arma paginas de respaldo con datos estructurados de la factura", () => {
  const pages = buildInvoicePages({
    code: "FV-1",
    supplier: "Editorial Andes",
    taxId: "900.123.456-7",
    issueDate: "2026-09-17",
    fileName: "factura.pdf",
    subtotal: 100,
    vat: 19,
    total: 119,
    status: "PROCESSED",
    fields: [{ label: "NIT", value: "900.123.456-7" }]
  });

  assert.equal(pages.length, 3);
  assert.match(pages[0].text, /Editorial Andes/);
  assert.match(pages[2].text, /119.00/);
});
