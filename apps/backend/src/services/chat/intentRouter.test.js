import test from "node:test";
import assert from "node:assert/strict";
import { routeIntent } from "./intentRouter.js";

test("mayor gasto y suma a proveedor van a analytics; energía Enel y Madrid van a document", () => {
  assert.deepEqual(routeIntent("Cuál fue mi mayor gasto?"), {
    mode: "analytics",
    tool: "maxByTotal"
  });

  const sum = routeIntent("Cuánto pagué a Enel?");
  assert.equal(sum.mode, "analytics");
  assert.equal(sum.tool, "sumBySupplier");
  assert.equal(sum.supplier, "enel");

  const month = routeIntent("Qué facturas tengo de marzo 2026?");
  assert.equal(month.mode, "analytics");
  assert.equal(month.tool, "listByMonth");
  assert.equal(month.month, 2);
  assert.equal(month.year, 2026);

  assert.equal(routeIntent("Cuánto pagué de energía eléctrica con Enel?").mode, "document");
  assert.equal(routeIntent("Cuál es el NIT de Aguas de la Sabana?").mode, "document");
  assert.equal(routeIntent("Cuál es el canon de arriendo de un local en Madrid?").mode, "document");
});

test("pregunta vacía no inventa herramienta", () => {
  assert.deepEqual(routeIntent("   "), { mode: "none", tool: null });
});
