import test from "node:test";
import assert from "node:assert/strict";
import { HASH_VECTOR_SIZE } from "./embeddings.js";
import {
  EmbeddingUnavailableError,
  embedQuery,
  isEmbeddingUnavailable,
  isHashBaseline
} from "./titanEmbeddings.js";

test("trata tokens expirados y 403 como embedding no disponible", () => {
  assert.equal(isEmbeddingUnavailable(new EmbeddingUnavailableError()), true);
  assert.equal(isEmbeddingUnavailable({ name: "ExpiredTokenException" }), true);
  assert.equal(isEmbeddingUnavailable({ $metadata: { httpStatusCode: 403 } }), true);
  assert.equal(isEmbeddingUnavailable({ name: "TypeError" }), false);
});

test("el baseline hash no llama a Bedrock y sigue en 96 dimensiones", async () => {
  const previous = process.env.EMBEDDING_BASELINE;
  process.env.EMBEDDING_BASELINE = "hash";
  try {
    assert.equal(isHashBaseline(), true);
    const query = await embedQuery("energia electrica");
    assert.equal(query.embeddingDim, HASH_VECTOR_SIZE);
    assert.equal(query.embeddingModel, "hashed-bow-96-v2");
    assert.equal(query.embedding.length, 96);
  } finally {
    if (previous === undefined) {
      delete process.env.EMBEDDING_BASELINE;
    } else {
      process.env.EMBEDDING_BASELINE = previous;
    }
  }
});
