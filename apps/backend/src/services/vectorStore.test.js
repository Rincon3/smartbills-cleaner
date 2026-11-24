import test from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity, embedText, HASH_VECTOR_SIZE, VECTOR_SIZE } from "../utils/embeddings.js";
import { hybridScore, lexicalOverlap, toVectorLiteral } from "./vectorStore.js";

test("serializa embeddings de 1024 dimensiones para pgvector", () => {
  const vector = Array.from({ length: VECTOR_SIZE }, (_, index) => (index === 0 ? 1 : 0));
  const literal = toVectorLiteral(vector);

  assert.equal(vector.length, 1024);
  assert.match(literal, /^\[(-?\d+\.\d{6},){1023}-?\d+\.\d{6}\]$/);
  assert.throws(() => toVectorLiteral([0, 1]), /1024 dimensiones/);
});

test("el hash de 96 dimensiones sigue disponible como línea base local", () => {
  const vector = embedText("Factura de energia electrica Enel Colombia");
  assert.equal(vector.length, HASH_VECTOR_SIZE);
});

test("la similitud hash favorece textos del mismo dominio", () => {
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
