CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "InvoiceChunk"
ADD COLUMN "embeddingModel" TEXT NOT NULL DEFAULT 'hashed-bow-96',
ADD COLUMN "embeddingDim" INTEGER NOT NULL DEFAULT 96;

ALTER TABLE "InvoiceChunk"
ALTER COLUMN embedding TYPE vector(96)
USING (
  CASE
    WHEN jsonb_typeof(embedding) = 'array' THEN (embedding::text)::vector
    ELSE array_fill(0::double precision, ARRAY[96])::vector
  END
);

CREATE INDEX IF NOT EXISTS "InvoiceChunk_embedding_hnsw_idx"
ON "InvoiceChunk"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 8, ef_construction = 32);
