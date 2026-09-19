import test from "node:test";
import assert from "node:assert/strict";
import {
  extractInvoiceFields,
  mergeExtractedFields,
  parseDate,
  parseMoney
} from "./extractInvoiceFields.js";

const sample = `
FACTURA ELECTRONICA DE VENTA
Editorial Andes S.A.S.
NIT: 900.123.456-7
Fecha de emision: 17/09/2026
Numero de factura: FV-88421
Subtotal: 1.000.000,00
IVA: 190.000,00
Total a pagar: 1.190.000,00
`;

test("extrae campos clave de una factura colombiana", () => {
  const result = extractInvoiceFields(sample);
  assert.equal(result.documentNumber, "FV-88421");
  assert.equal(result.taxId, "900.123.456-7");
  assert.equal(result.issueDate, "2026-09-17");
  assert.equal(result.total, 1190000);
  assert.equal(result.vat, 190000);
  assert.equal(result.subtotal, 1000000);
  assert.match(result.supplier, /Editorial Andes/i);
  assert.equal(result.missingCore, false);
});

test("identifica proveedor aunque el OCR entregue una sola linea", () => {
  const result = extractInvoiceFields(
    "FACTURA ELECTRONICA DE VENTA Editorial Andes SAS NIT: 900.123.456-7 Fecha de emision: 17/09/2026 Total a pagar: 1190000.00"
  );
  assert.match(result.supplier, /Editorial Andes/i);
  assert.equal(result.missingCore, false);
});

test("parsea montos colombianos y fechas latinas", () => {
  assert.equal(parseMoney("1.234.567,89"), 1234567.89);
  assert.equal(parseMoney("1190000.00"), 1190000);
  assert.equal(parseDate("05/01/2026"), "2026-01-05");
  assert.equal(parseDate("2026-09-17"), "2026-09-17");
  assert.equal(parseMoney(""), null);
});

test("marca error de identificacion si falta NIT y total", () => {
  const result = extractInvoiceFields("Documento sin estructura comercial");
  assert.equal(result.missingCore, true);
  assert.equal(result.taxId, "No detectado");
});

test("deriva subtotal cuando solo hay total e IVA", () => {
  const result = extractInvoiceFields(`
    Editorial Norte
    NIT: 800123456-1
    IVA: 19000
    Total a pagar: 119000
  `);
  assert.equal(result.total, 119000);
  assert.equal(result.vat, 19000);
  assert.equal(result.subtotal, 100000);
});

test("fusiona extraccion por reglas con resultado de modelo", () => {
  const rules = extractInvoiceFields(sample);
  const merged = mergeExtractedFields(rules, {
    supplier: "Editorial Andes S.A.S.",
    taxId: "900.123.456-7",
    total: "1190000"
  });
  assert.equal(merged.supplier, "Editorial Andes S.A.S.");
  assert.equal(merged.total, 1190000);
  assert.equal(merged.missingCore, false);
});
