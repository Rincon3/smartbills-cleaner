import test from "node:test";
import assert from "node:assert/strict";
import { ragasScores } from "./ragasMetrics.js";

test("calcula métricas RAGAS sobre una respuesta citada y verificable", () => {
  const scores = ragasScores({
    question: "Cuanto pague de energia electrica con Enel?",
    answer: "El total de energia es 380.800 [Factura DEMO-VEC-05, pág. 2].",
    contexts: [
      { invoiceCode: "DEMO-VEC-05", page: 2, text: "Total energia 380.800" },
      { invoiceCode: "DEMO-VEC-03", page: 1, text: "Papeleria Mundial" }
    ],
    relevantCodes: ["DEMO-VEC-05"],
    groundTruth: "El total de energia Enel es 380.800 [Factura DEMO-VEC-05, pág. 2]."
  });

  assert.equal(scores.faithfulness, 1);
  assert.equal(scores.context_precision, 0.5);
  assert.equal(scores.context_recall, 1);
  assert.ok(scores.answer_relevancy > 0.2);
  assert.ok(scores.answer_correctness > 0.4);
  assert.ok(scores.ragas > 0.5);
});
