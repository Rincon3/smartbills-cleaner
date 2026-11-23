import { prisma } from "../../config/prisma.js";
import { tokenize } from "../../utils/embeddings.js";
import { embedQuery, isEmbeddingUnavailable } from "../../utils/titanEmbeddings.js";
import { buildInvoiceWhere, parseSearchFilters } from "../invoiceSearchService.js";
import { hybridScore, lexicalOverlap, searchSimilarChunks } from "../vectorStore.js";
import { MIN_RETRIEVAL_SCORE, RAG_TOP_K } from "./constants.js";

const GENERIC_FOCUS = new Set([
  "energia",
  "electrica",
  "servicio",
  "servicios",
  "residencial",
  "comercial",
  "total",
  "gasto",
  "mayor",
  "plan",
  "telefonia",
  "internet",
  "fibra",
  "factura",
  "facturas",
  "utiles",
  "oficina",
  "consumo",
  "kwh",
  "luz",
  "acueducto",
  "alcantarillado",
  "canon",
  "arriendo",
  "local",
  "suscripcion",
  "software",
  "licencias",
  "galones",
  "gasolina",
  "combustible",
  "flota",
  "nit",
  "pagina",
  "cuanto",
  "pague",
  "cual",
  "hay",
  "alguna",
  "tengo",
  "dice",
  "sobre",
  "pedido"
]);

export function focusTerms(question) {
  return tokenize(question, { dropStopwords: true }).filter(
    (token) => token.length >= 4 && !GENERIC_FOCUS.has(token)
  );
}

function hitHaystack(hit) {
  return `${hit.invoiceCode || ""} ${hit.supplier || ""} ${hit.text || ""} ${hit.invoice?.code || ""} ${hit.invoice?.supplier || ""}`;
}

export function focusHits(question, hits = []) {
  const terms = focusTerms(question);
  if (!terms.length || !hits.length) {
    return hits;
  }

  const matched = hits.filter((hit) => {
    const hay = tokenize(hitHaystack(hit), { dropStopwords: false }).join(" ");
    return terms.some((term) => hay.includes(term));
  });

  return matched;
}

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
    .slice(0, Math.max(limit * 2, 6));

  const focused = focusHits(question, ranked).slice(0, limit);

  if (!focused.length || focused[0].score < MIN_RETRIEVAL_SCORE) {
    return [];
  }

  return focused;
}

export async function retrieveInvoiceHits({
  question,
  invoiceId = null,
  filters = {},
  user = null,
  limit = RAG_TOP_K
}) {
  const parsed = parseSearchFilters({ ...filters, q: question });
  const where = {
    ...buildInvoiceWhere(parsed, user),
    ...(invoiceId ? { id: invoiceId } : {})
  };

  const scoped = await prisma.invoice.findMany({
    where,
    select: { id: true }
  });
  const invoiceIds = scoped.map((invoice) => invoice.id);
  if (!invoiceIds.length) {
    return { candidates: [], hits: [] };
  }

  try {
    const query = await embedQuery(question);
    const candidates = await searchSimilarChunks({
      embedding: query.embedding,
      embeddingModel: query.embeddingModel,
      embeddingDim: query.embeddingDim,
      invoiceIds,
      limit: Math.max(limit * 4, 12)
    });

    return {
      candidates,
      hits: rankHits(question, candidates, limit)
    };
  } catch (error) {
    if (!isEmbeddingUnavailable(error)) {
      throw error;
    }

    return { candidates: [], hits: [] };
  }
}
