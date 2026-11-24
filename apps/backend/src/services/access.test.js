import test from "node:test";
import assert from "node:assert/strict";
import { canMutateInvoices, canReadInvoice, invoiceWhereFor } from "./access.js";
import { buildInvoiceWhere, parseSearchFilters } from "./invoiceSearchService.js";

const admin = { id: "admin-1", role: "ADMIN" };
const analystA = { id: "user-a", role: "ANALYST" };
const analystB = { id: "user-b", role: "ANALYST" };
const viewer = { id: "user-v", role: "VIEWER" };
const invoiceA = { id: "inv-a", ownerId: "user-a" };
const invoiceB = { id: "inv-b", ownerId: "user-b" };

test("ADMIN no restringe el where; ANALYST y VIEWER solo ven las suyas", () => {
  assert.deepEqual(invoiceWhereFor(admin), {});
  assert.deepEqual(invoiceWhereFor(analystA), { ownerId: "user-a" });
  assert.deepEqual(invoiceWhereFor(viewer), { ownerId: "user-v" });
  assert.deepEqual(invoiceWhereFor(null), {});
});

test("VIEWER no muta; ANALYST y ADMIN sí", () => {
  assert.equal(canMutateInvoices(viewer), false);
  assert.equal(canMutateInvoices(analystA), true);
  assert.equal(canMutateInvoices(admin), true);
});

test("lectura: ADMIN ve todas; el resto solo las propias; id ajeno no se filtra como 403", () => {
  assert.equal(canReadInvoice(admin, invoiceB), true);
  assert.equal(canReadInvoice(analystA, invoiceA), true);
  assert.equal(canReadInvoice(analystA, invoiceB), false);
  assert.equal(canReadInvoice(analystA, null), false);
  assert.equal(canReadInvoice(viewer, invoiceA), false);
  assert.equal(canReadInvoice(viewer, { id: "inv-v", ownerId: "user-v" }), true);
});

test("sin filtros SQL el where de búsqueda y retrieval igual incluye ownerId", () => {
  const filters = parseSearchFilters({ q: "energia" });
  const where = buildInvoiceWhere(filters, analystA);
  assert.equal(where.ownerId, "user-a");
  assert.equal(where.supplier, undefined);
});

test("ADMIN conserva filtros SQL y no añade ownerId", () => {
  const filters = parseSearchFilters({ supplier: "Enel" });
  const where = buildInvoiceWhere(filters, admin);
  assert.equal(where.ownerId, undefined);
  assert.equal(where.supplier.contains, "Enel");
});
