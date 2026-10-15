import test from "node:test";
import assert from "node:assert/strict";
import { scoreCandidate, selectConsensus } from "./consensus.js";

const hits = [
  {
    page: 1,
    text: "NIT: 860.063.875-8 Total energia 380.800",
    invoice: { code: "DEMO-VEC-05" },
    invoiceCode: "DEMO-VEC-05"
  }
];

test("el consenso prefiere la respuesta más fiel a las citas recuperadas", () => {
  const faithful = scoreCandidate(
    {
      role: "adjusted",
      provider: "local",
      model: "grounded-top3",
      text: "El total de energia es 380.800 [Factura DEMO-VEC-05, pág. 1]."
    },
    "cuanto pague de energia",
    hits
  );
  const hallucinated = scoreCandidate(
    {
      role: "base",
      provider: "local",
      model: "grounded-top1",
      text: "El arriendo es 12 millones [Factura INV-FALSA, pág. 9]."
    },
    "cuanto pague de energia",
    hits
  );

  const winner = selectConsensus([faithful, hallucinated]);
  assert.equal(winner.role, "adjusted");
  assert.ok(winner.score > hallucinated.score);
  assert.match(winner.answer, /DEMO-VEC-05/);
});
