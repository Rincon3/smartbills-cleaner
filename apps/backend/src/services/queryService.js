import { prisma } from "../config/prisma.js";
import { cosineSimilarity, embedText, tokenize } from "../utils/embeddings.js";
import { buildCitationLabel } from "./invoiceDocument.js";
import { formatRetrievedSources, renderCitationPrompt } from "./ragPrompt.js";

const CITATION_PATTERN = /\[Factura ([^\],]+), pág\. (\d+)\]/g;

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

function extractEvidenceLine(question, chunk) {
  const terms = tokenize(question);
  const lines = chunk.text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const matched = lines.find((line) =>
    terms.some((term) => line.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term))
  );

  return matched || lines[0];
}

function generateGroundedAnswer(question, hits) {
  if (!hits.length) {
    return "No encontre evidencia verificable en las facturas indexadas para responder esa pregunta.";
  }

  const sentences = hits.slice(0, 3).map((hit) => {
    const evidence = extractEvidenceLine(question, hit);
    return `${evidence} ${buildCitationLabel(hit.invoice.code, hit.page)}`;
  });

  return sentences.join(" ");
}

function allowedCitationKeys(hits) {
  return new Set(hits.map((hit) => `${hit.invoice.code}|${hit.page}`));
}

function verifyAnswerCitations(answer, hits) {
  const allowed = allowedCitationKeys(hits);
  const verified = [];
  const sanitized = answer.replace(CITATION_PATTERN, (match, code, page) => {
    const key = `${code.trim()}|${Number(page)}`;
    if (!allowed.has(key)) {
      return "";
    }

    verified.push({ code: code.trim(), page: Number(page), citation: match });
    return match;
  });

  let nextAnswer = sanitized.replace(/\s{2,}/g, " ").trim();

  if (!verified.length && hits.length) {
    const fallback = hits
      .slice(0, 2)
      .map((hit) => buildCitationLabel(hit.invoice.code, hit.page))
      .join(" ");
    nextAnswer = `${nextAnswer} ${fallback}`.trim();
  }

  return nextAnswer;
}

async function generateWithOptionalLlm(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "Responde solo con evidencia citada. Usa el formato [Factura X, pág. Y]."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim() || null;
}

export async function queryInvoices({ question, invoiceId = null, limit = 4 }) {
  const queryEmbedding = embedText(question);
  const chunks = await prisma.invoiceChunk.findMany({
    where: invoiceId ? { invoiceId } : {},
    include: {
      invoice: {
        select: {
          id: true,
          code: true,
          supplier: true,
          fileName: true
        }
      }
    }
  });

  const questionTokens = tokenize(question);

  const ranked = chunks
    .map((chunk) => {
      const haystack = tokenize(`${chunk.invoice.code} ${chunk.invoice.supplier} ${chunk.section} ${chunk.text}`);
      const overlap = questionTokens.filter((token) => haystack.includes(token)).length;
      const lexical = overlap / Math.max(questionTokens.length, 1);
      const semantic = cosineSimilarity(queryEmbedding, chunk.embedding || []);
      return {
        ...chunk,
        score: semantic * 0.65 + lexical * 0.35
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .filter((chunk) => chunk.score > 0.05);

  const prompt = renderCitationPrompt({
    question,
    sources: ranked.length ? formatRetrievedSources(ranked) : "Sin fragmentos recuperados."
  });

  const llmAnswer = await generateWithOptionalLlm(prompt);
  const rawAnswer = llmAnswer || generateGroundedAnswer(question, ranked);
  const answer = verifyAnswerCitations(rawAnswer, ranked);

  const citations = ranked.map((chunk) => toPublicChunk(chunk, Number(chunk.score.toFixed(4))));

  return {
    answer,
    prompt,
    promptTemplate: "CITATION_PROMPT_TEMPLATE",
    citations,
    sources: citations
  };
}

export async function getChunkSource({ chunkId, invoiceId, invoiceCode, page }) {
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
          filePath: true
        }
      }
    }
  });

  if (!chunk) {
    return null;
  }

  return toPublicChunk(chunk);
}
