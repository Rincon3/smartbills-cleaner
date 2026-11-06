DROP INDEX IF EXISTS "InvoiceChunk_embedding_hnsw_idx";

ALTER TABLE "InvoiceChunk" DROP COLUMN IF EXISTS embedding;
ALTER TABLE "InvoiceChunk" ADD COLUMN embedding vector(1024);

ALTER TABLE "InvoiceChunk" ALTER COLUMN "embeddingModel" SET DEFAULT 'amazon.titan-embed-text-v2:0';
ALTER TABLE "InvoiceChunk" ALTER COLUMN "embeddingDim" SET DEFAULT 1024;

CREATE INDEX IF NOT EXISTS "InvoiceChunk_embedding_hnsw_idx"
ON "InvoiceChunk"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 8, ef_construction = 32);
