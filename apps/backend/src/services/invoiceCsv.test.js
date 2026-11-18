import test from "node:test";
import assert from "node:assert/strict";
import { csvEscape, invoicesToCsv } from "./invoiceCsv.js";

test("el CSV incluye proveedor, NIT, fecha, subtotal, IVA y total de las facturas dadas", () => {
  const csv = invoicesToCsv([
    {
      supplier: 'Enel "Colombia"',
      taxId: "830.037.248-0",
      issueDate: new Date("2026-04-01"),
      subtotal: 320000,
      vat: 60800,
      total: 380800
    }
  ]);

  assert.match(csv, /proveedor,NIT,fecha,subtotal,IVA,total\r\n/);
  assert.match(csv, /"Enel ""Colombia""",830.037.248-0,2026-04-01,320000,60800,380800/);
});

test("escapa comas y comillas para no romper columnas", () => {
  assert.equal(csvEscape("a,b"), '"a,b"');
  assert.equal(csvEscape('x"y'), '"x""y"');
});
