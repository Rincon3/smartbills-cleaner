import test from "node:test";
import assert from "node:assert/strict";
import { buildInvoiceWhere, collapseChunksToInvoices, parseSearchFilters } from "./invoiceSearchService.js";

test("parsea filtros SQL de proveedor, fechas y rango de montos", () => {
  const filters = parseSearchFilters({
    q: "energia",
    supplier: "Enel",
    from: "2026-04-01",
    to: "2026-04-30",
    minTotal: "100000",
    maxTotal: "500000"
  });

  assert.equal(filters.q, "energia");
  assert.equal(filters.supplier, "Enel");
  assert.equal(filters.minTotal, 100000);
  assert.equal(filters.maxTotal, 500000);
  assert.ok(filters.to.getHours() >= 23);

  const where = buildInvoiceWhere(filters);
  assert.equal(where.supplier.contains, "Enel");
  assert.equal(where.total.gte, 100000);
  assert.equal(where.total.lte, 500000);
});

test("ordena facturas por relevancia semántica tras el filtro SQL", () => {
  const invoices = [
    { id: "a", code: "DEMO-VEC-03", supplier: "Papeleria", total: 10 },
    { id: "b", code: "DEMO-VEC-05", supplier: "Enel", total: 380800 }
  ];
  const ranked = collapseChunksToInvoices(invoices, [
    { invoiceId: "a", semantic: 0.21, page: 1, section: "Oficina", text: "resmas" },
    { invoiceId: "b", semantic: 0.81, page: 2, section: "Totales", text: "energia 380.800" }
  ]);

  assert.equal(ranked[0].code, "DEMO-VEC-05");
  assert.equal(ranked[0].score, 0.81);
  assert.equal(ranked[0].matchPage, 2);
});
