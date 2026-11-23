import test from "node:test";
import assert from "node:assert/strict";
import { extractEvidenceLine } from "./citations.js";

test("si preguntan un monto, prefiere la línea con cifras y no el título del servicio", () => {
  const line = extractEvidenceLine("Cuánto pagué de energía eléctrica con Enel?", {
    text: "Servicio de energia electrica residencial/comercial\nTotal energia 380.800"
  });
  assert.match(line, /380/);
});
