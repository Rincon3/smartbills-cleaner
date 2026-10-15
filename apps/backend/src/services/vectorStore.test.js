import test from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity, embedText, VECTOR_SIZE } from "../utils/embeddings.js";
import { hybridScore, lexicalOverlap, toVectorLiteral } from "./vectorStore.js";

test("serializa embeddings de 96 dimensiones para pgvector", () => {
  const vector = embedText("Factura de energia electrica Enel Colombia");
  const literal = toVectorLiteral(vector);

  assert.equal(vector.length, VECTOR_SIZE);
  assert.match(literal, /^\[(-?\d+\.\d{6},){95}-?\d+\.\d{6}\]$/);
  assert.throws(() => toVectorLiteral([0, 1]), /96 dimensiones/);
});

test("la similitud semantica favorece textos del mismo dominio", () => {
  const query = embedText("cuanto pague de energia electrica");
  const energy = embedText("Factura de energia Enel kWh tarifa residencial total a pagar");
  const stationery = embedText("Papeleria Mundial resmas de papel y toner de impresora");

  assert.ok(cosineSimilarity(query, energy) > cosineSimilarity(query, stationery));
});

test("combina solapamiento lexico con score hibrido acotado", () => {
  assert.ok(lexicalOverlap("NIT de Claro", "NIT Claro Colombia 900111222") > 0.4);
  assert.equal(Number(hybridScore(1, 0).toFixed(2)), 0.55);
  assert.equal(Number(hybridScore(0, 1).toFixed(2)), 0.45);
});
