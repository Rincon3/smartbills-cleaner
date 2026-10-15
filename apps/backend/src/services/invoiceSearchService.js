import { prisma } from "../config/prisma.js";
import { embedText } from "../utils/embeddings.js";
import { searchSimilarChunks } from "./vectorStore.js";

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalDate(value, endOfDay = false) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay && String(value).length <= 10) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export function parseSearchFilters(input = {}) {
  return {
    q: String(input.q || input.question || "").trim(),
    supplier: String(input.supplier || "").trim(),
    status: String(input.status || "").trim(),
    from: optionalDate(input.from),
    to: optionalDate(input.to, true),
    minTotal: optionalNumber(input.minTotal),
    maxTotal: optionalNumber(input.maxTotal)
  };
}

export function buildInvoiceWhere(filters) {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.supplier
      ? {
          supplier: {
            contains: filters.supplier,
            mode: "insensitive"
          }
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          issueDate: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {})
          }
        }
      : {}),
    ...(filters.minTotal != null || filters.maxTotal != null
      ? {
          total: {
            ...(filters.minTotal != null ? { gte: filters.minTotal } : {}),
            ...(filters.maxTotal != null ? { lte: filters.maxTotal } : {})
          }
        }
      : {})
  };
}

export function collapseChunksToInvoices(invoices, chunks) {
  const byId = new Map(
    invoices.map((invoice) => [
      invoice.id,
      {
        ...invoice,
        score: 0,
        matchPage: null,
        matchSection: null,
        matchText: null
      }
    ])
  );

  for (const chunk of chunks) {
    const row = byId.get(chunk.invoiceId);
    if (!row) {
      continue;
    }

    const score = Number(chunk.semantic || chunk.score || 0);
    if (score >= Number(row.score || 0)) {
      row.score = Number(score.toFixed(4));
      row.matchPage = chunk.page;
      row.matchSection = chunk.section;
      row.matchText = String(chunk.text || "").slice(0, 220);
    }
  }

  return [...byId.values()].sort((left, right) => Number(right.score || 0) - Number(left.score || 0));
}

export async function searchInvoicesHybrid(rawFilters = {}) {
  const started = Date.now();
  const filters = parseSearchFilters(rawFilters);
  const where = buildInvoiceWhere(filters);

  const invoices = await prisma.invoice.findMany({
    where,
    include: { fields: true },
    orderBy: { issueDate: "desc" }
  });

  if (!invoices.length) {
    return {
      invoices: [],
      elapsedMs: Date.now() - started,
      mode: filters.q ? "sql+pgvector" : "sql",
      filters
    };
  }

  if (!filters.q) {
    return {
      invoices: invoices.map((invoice) => ({ ...invoice, score: null })),
      elapsedMs: Date.now() - started,
      mode: "sql",
      filters
    };
  }

  const chunks = await searchSimilarChunks({
    embedding: embedText(filters.q),
    invoiceIds: invoices.map((invoice) => invoice.id),
    limit: Math.min(64, Math.max(16, invoices.length * 3))
  });

  return {
    invoices: collapseChunksToInvoices(invoices, chunks),
    elapsedMs: Date.now() - started,
    mode: "sql+pgvector",
    filters
  };
}
