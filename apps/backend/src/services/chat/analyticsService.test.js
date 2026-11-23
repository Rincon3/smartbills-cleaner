import test from "node:test";
import assert from "node:assert/strict";
import { maxByTotal, sumBySupplier, listByMonth } from "./analyticsService.js";

const analystA = { id: "user-a", role: "ANALYST" };

function fakeDb(invoices) {
  return {
    invoice: {
      findFirst: async ({ where, orderBy }) => {
        const rows = invoices.filter((invoice) => matchWhere(invoice, where));
        if (orderBy?.total === "desc") {
          rows.sort((left, right) => right.total - left.total);
        }
        return rows[0] || null;
      },
      aggregate: async ({ where }) => {
        const rows = invoices.filter((invoice) => matchWhere(invoice, where));
        return {
          _sum: { total: rows.reduce((sum, invoice) => sum + invoice.total, 0) },
          _count: { _all: rows.length }
        };
      },
      findMany: async ({ where }) => invoices.filter((invoice) => matchWhere(invoice, where))
    }
  };
}

function matchWhere(invoice, where = {}) {
  if (where.ownerId && invoice.ownerId !== where.ownerId) {
    return false;
  }
  if (where.status && invoice.status !== where.status) {
    return false;
  }
  if (where.supplier?.contains) {
    const hay = String(invoice.supplier || "").toLowerCase();
    if (!hay.includes(String(where.supplier.contains).toLowerCase())) {
      return false;
    }
  }
  return true;
}

const corpus = [
  { code: "A-ENEL", ownerId: "user-a", supplier: "Enel Colombia", total: 380800, status: "PROCESSED", issueDate: new Date("2026-03-10T00:00:00.000Z") },
  { code: "A-CLARO", ownerId: "user-a", supplier: "Claro", total: 105910, status: "PROCESSED", issueDate: new Date("2026-04-01T00:00:00.000Z") },
  { code: "B-TERPEL", ownerId: "user-b", supplier: "Terpel", total: 900000, status: "PROCESSED", issueDate: new Date("2026-03-12T00:00:00.000Z") }
];

test("mayor gasto usa solo facturas del usuario y el total más alto de Prisma", async () => {
  const result = await maxByTotal({ user: analystA, db: fakeDb(corpus) });
  assert.equal(result.noEvidence, false);
  assert.equal(result.analytics.code, "A-ENEL");
  assert.equal(result.analytics.total, 380800);
  assert.equal(result.analytics.code === "B-TERPEL", false);
  assert.match(result.answer, /A-ENEL/);
  assert.equal(result.citations.length, 0);
});

test("suma por proveedor coincide con el agregado y no mezcla al usuario B", async () => {
  const result = await sumBySupplier({ user: analystA, supplier: "Enel", db: fakeDb(corpus) });
  assert.equal(result.analytics.total, 380800);
  assert.equal(result.analytics.count, 1);
  assert.match(result.answer, /380/);
});

test("usuario sin facturas en mayor gasto responde vacío y no lanza", async () => {
  const result = await maxByTotal({
    user: { id: "user-z", role: "ANALYST" },
    db: fakeDb(corpus)
  });
  assert.equal(result.noEvidence, true);
  assert.match(result.answer, /no hay facturas/i);
});

test("listado por mes solo devuelve códigos del mes pedido", async () => {
  const result = await listByMonth({
    user: analystA,
    month: 2,
    year: 2026,
    monthName: "marzo",
    db: fakeDb(corpus)
  });
  assert.deepEqual(result.analytics.codes, ["A-ENEL"]);
  assert.match(result.answer, /A-ENEL/);
});
