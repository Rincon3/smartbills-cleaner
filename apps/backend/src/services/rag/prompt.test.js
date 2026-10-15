import test from "node:test";
import assert from "node:assert/strict";
import { RAG_TOP_K } from "./constants.js";
import { FEW_SHOT_EXAMPLES, renderCitationPrompt } from "./prompt.js";

test("el prompt RAG incluye citación, español y few-shot", () => {
  const prompt = renderCitationPrompt({
    question: "Cuál es el total de Enel?",
    sources: "- chunk_source=a:1 | cita=[Factura DEMO-VEC-05, pág. 1]\n  fragmento: Total energia 380.800"
  });

  assert.equal(RAG_TOP_K, 5);
  assert.equal(FEW_SHOT_EXAMPLES.length, 3);
  assert.match(prompt, /español/i);
  assert.match(prompt, /\[Factura CODIGO, pág\. N\]/);
  assert.match(prompt, /Ejemplo 1/);
  assert.match(prompt, /No encontré evidencia verificable/);
  assert.match(prompt, /Cuál es el total de Enel\?/);
});
