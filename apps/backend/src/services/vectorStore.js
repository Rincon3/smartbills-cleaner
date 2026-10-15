import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { EMBEDDING_MODEL, VECTOR_SIZE, tokenize } from "../utils/embeddings.js";

const SEARCH_CANDIDATES = 16;

export function toVectorLiteral(values) {
  if (!Array.isArray(values) || values.length !== VECTOR_SIZE) {
    throw new Error(`El embedding debe tener ${VECTOR_SIZE} dimensiones`);
  }

  return `[${values.map((value) => Number(value || 0).toFixed(6)).join(",")}]`;
}

export function lexicalOverlap(question, haystack) {
  const questionTokens = tokenize(question, { dropStopwords: true });
  if (!questionTokens.length) {
    return 0;
  }

  const haystackTokens = tokenize(haystack, { dropStopwords: true });
  const overlap = questionTokens.filter((token) => haystackTokens.includes(token)).length;
  return overlap / questionTokens.length;
}

export function hybridScore(semantic, lexical, semanticWeight = 0.55) {
  return Number(semantic || 0) * semanticWeight + Number(lexical || 0) * (1 - semanticWeight);
}

export async function replaceInvoiceChunks(invoiceId, chunks) {
  await prisma.invoiceChunk.deleteMany({ where: { invoiceId } });

  const created = [];

  for (const chunk of chunks) {
    const id = `chk_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const vector = toVectorLiteral(chunk.embedding);

    await prisma.$executeRaw`
      INSERT INTO "InvoiceChunk" (
        id,
        "invoiceId",
        page,
        section,
        text,
        "chunkSource",
        embedding,
        "embeddingModel",
        "embeddingDim",
        "createdAt"
      )
      VALUES (
        ${id},
        ${invoiceId},
        ${chunk.page},
        ${chunk.section},
        ${chunk.text},
        ${chunk.chunkSource},
        ${vector}::vector,
        ${chunk.embeddingModel || EMBEDDING_MODEL},
        ${chunk.embeddingDim || VECTOR_SIZE},
        NOW()
      )
    `;

    created.push({
      id,
      invoiceId,
      page: chunk.page,
      section: chunk.section,
      text: chunk.text,
      chunkSource: chunk.chunkSource,
      embeddingModel: chunk.embeddingModel || EMBEDDING_MODEL,
      embeddingDim: chunk.embeddingDim || VECTOR_SIZE
    });
  }

  return created;
}

function chunkScopeSql({ invoiceId = null, invoiceIds = null } = {}) {
  if (invoiceId) {
    return Prisma.sql`WHERE c."invoiceId" = ${invoiceId}`;
  }

  if (invoiceIds?.length) {
    return Prisma.sql`WHERE c."invoiceId" IN (${Prisma.join(invoiceIds.map((id) => Prisma.sql`${id}`))})`;
  }

  return Prisma.empty;
}

export async function searchSimilarChunks({
  embedding,
  invoiceId = null,
  invoiceIds = null,
  limit = SEARCH_CANDIDATES
}) {
  const vector = toVectorLiteral(embedding);
  const take = Math.max(1, Math.min(Number(limit) || SEARCH_CANDIDATES, 64));

  return prisma.$queryRaw`
    SELECT
      c.id,
      c."invoiceId",
      c.page,
      c.section,
      c.text,
      c."chunkSource",
      c."embeddingModel",
      c."embeddingDim",
      i.code AS "invoiceCode",
      i.supplier,
      i."fileName",
      (1 - (c.embedding <=> ${vector}::vector))::double precision AS semantic
    FROM "InvoiceChunk" c
    INNER JOIN "Invoice" i ON i.id = c."invoiceId"
    ${chunkScopeSql({ invoiceId, invoiceIds })}
    ORDER BY c.embedding <=> ${vector}::vector
    LIMIT ${take}
  `;
}
