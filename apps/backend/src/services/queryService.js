import { prisma } from "../config/prisma.js";
import { canReadInvoice } from "./access.js";
import { runAnalytics } from "./chat/analyticsService.js";
import { routeIntent } from "./chat/intentRouter.js";
import { buildCitationLabel } from "./invoiceDocument.js";
import { runRetrievalQa } from "./rag/chain.js";
import { RAG_TOP_K } from "./rag/constants.js";

function toPublicChunk(chunk, score = null) {
  return {
    id: chunk.id,
    invoiceId: chunk.invoiceId,
    invoiceCode: chunk.invoice.code,
    page: chunk.page,
    section: chunk.section,
    text: chunk.text,
    chunkSource: chunk.chunkSource,
    citation: buildCitationLabel(chunk.invoice.code, chunk.page),
    score
  };
}

export async function queryInvoices({ question, invoiceId = null, filters = {}, user = null, limit = RAG_TOP_K }) {
  const started = Date.now();
  const intent = invoiceId ? { mode: "document", tool: null } : routeIntent(question);

  if (intent.mode === "analytics") {
    const analytics = await runAnalytics(intent, { user, filters });
    const elapsedMs = Date.now() - started;
    return {
      mode: "analytics",
      answer: analytics.answer,
      noEvidence: analytics.noEvidence,
      analytics: analytics.analytics,
      citations: [],
      sources: [],
      consensus: null,
      prompt: null,
      promptTemplate: null,
      elapsedMs,
      retrieval: {
        backend: "prisma",
        tool: analytics.tool,
        elapsedMs,
        withinSla: elapsedMs < 4000
      }
    };
  }

  const result = await runRetrievalQa({
    question,
    invoiceId,
    filters,
    user,
    k: Number(limit) || RAG_TOP_K
  });

  const citations = result.hits.map((chunk) =>
    toPublicChunk(chunk, chunk.score == null ? null : Number(Number(chunk.score).toFixed(4)))
  );
  const elapsedMs = Date.now() - started;
  const noEvidence =
    citations.length === 0 || /no encontr/i.test(result.answer || "");

  return {
    mode: noEvidence ? "none" : "document",
    answer: result.answer,
    prompt: result.prompt,
    promptTemplate: result.promptTemplate,
    citations,
    sources: citations,
    consensus: result.consensus,
    analytics: null,
    noEvidence,
    elapsedMs,
    retrieval: {
      ...result.retrieval,
      candidates: result.hits.length,
      elapsedMs,
      withinSla: elapsedMs < 4000
    }
  };
}

export async function getChunkSource({ chunkId, invoiceId, invoiceCode, page, user = null }) {
  let resolvedInvoiceId = invoiceId;

  if (!chunkId && !resolvedInvoiceId && invoiceCode) {
    const invoice = await prisma.invoice.findUnique({
      where: { code: String(invoiceCode) },
      select: { id: true }
    });
    resolvedInvoiceId = invoice?.id;
  }

  const chunk = await prisma.invoiceChunk.findFirst({
    where: chunkId
      ? { id: chunkId }
      : {
          invoiceId: resolvedInvoiceId,
          page: Number(page)
        },
    include: {
      invoice: {
        select: {
          id: true,
          code: true,
          supplier: true,
          fileName: true,
          filePath: true,
          ownerId: true
        }
      }
    }
  });

  if (!chunk || !canReadInvoice(user, chunk.invoice)) {
    return null;
  }

  return toPublicChunk(chunk);
}
