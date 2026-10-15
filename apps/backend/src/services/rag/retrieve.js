import { prisma } from "../../config/prisma.js";
import { embedText } from "../../utils/embeddings.js";
import { buildInvoiceWhere, parseSearchFilters } from "../invoiceSearchService.js";
import { hybridScore, lexicalOverlap, searchSimilarChunks } from "../vectorStore.js";
import { MIN_RETRIEVAL_SCORE, RAG_TOP_K } from "./constants.js";

export function rankHits(question, candidates, limit = RAG_TOP_K) {
  const ranked = candidates
    .map((chunk) => {
      const lexical = lexicalOverlap(
        question,
        `${chunk.invoiceCode} ${chunk.supplier} ${chunk.section} ${chunk.text}`
      );
      return {
        ...chunk,
        invoice: {
          id: chunk.invoiceId,
          code: chunk.invoiceCode,
          supplier: chunk.supplier,
          fileName: chunk.fileName
        },
        score: hybridScore(Number(chunk.semantic || 0), lexical)
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  if (!ranked.length || ranked[0].score < MIN_RETRIEVAL_SCORE) {
    return [];
  }

  return ranked;
}

export async function retrieveInvoiceHits({ question, invoiceId = null, filters = {}, limit = RAG_TOP_K }) {
  const parsed = parseSearchFilters({ ...filters, q: question });
  const where = buildInvoiceWhere(parsed);
  const hasSqlFilter = Boolean(
    parsed.supplier || parsed.status || parsed.from || parsed.to || parsed.minTotal != null || parsed.maxTotal != null
  );

  let invoiceIds = null;
  if (invoiceId) {
    invoiceIds = [invoiceId];
  } else if (hasSqlFilter) {
    const scoped = await prisma.invoice.findMany({
      where,
      select: { id: true }
    });
    invoiceIds = scoped.map((invoice) => invoice.id);
    if (!invoiceIds.length) {
      return { candidates: [], hits: [] };
    }
  }

  const candidates = await searchSimilarChunks({
    embedding: embedText(question),
    invoiceIds,
    limit: Math.max(limit * 4, 12)
  });

  return {
    candidates,
    hits: rankHits(question, candidates, limit)
  };
}
