import test from "node:test";
import assert from "node:assert/strict";
import { focusHits, focusTerms, rankHits } from "./retrieve.js";

test("si la pregunta nombra una entidad, descarta hits que no la contienen", () => {
  assert.deepEqual(focusTerms("Cuánto pagué de energía eléctrica con Enel?"), ["enel"]);

  const hits = focusHits("energía eléctrica con Enel", [
    { invoiceCode: "ELECTR", supplier: "Otro", text: "Impuestos y totales", semantic: 0.9 },
    { invoiceCode: "DEMO-VEC-05", supplier: "Enel Colombia", text: "energia 380.800", semantic: 0.7 }
  ]);

  assert.equal(hits.length, 1);
  assert.equal(hits[0].invoiceCode, "DEMO-VEC-05");
});

test("Madrid sin evidencia en los hits deja la lista vacía", () => {
  const hits = focusHits("canon de arriendo en Madrid", [
    { invoiceCode: "ELECTR", supplier: "Claro", text: "telefonia movil", semantic: 0.8 }
  ]);
  assert.equal(hits.length, 0);
});

test("sin entidad dura no borra el ranking semántico", () => {
  const ranked = rankHits("energia electrica", [
    {
      invoiceId: "a",
      invoiceCode: "DEMO-VEC-05",
      supplier: "Enel",
      section: "Totales",
      text: "Servicio de energia electrica 380.800",
      semantic: 0.82
    },
    {
      invoiceId: "b",
      invoiceCode: "ELECTR",
      supplier: "Otro",
      section: "Impuestos",
      text: "Impuestos y totales",
      semantic: 0.4
    }
  ]);

  assert.equal(ranked[0].invoiceCode, "DEMO-VEC-05");
  assert.ok(ranked[0].score >= 0.32);
});
