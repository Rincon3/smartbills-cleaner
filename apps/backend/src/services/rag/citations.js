import { tokenize } from "../../utils/embeddings.js";
import { buildCitationLabel } from "../invoiceDocument.js";

export const CITATION_PATTERN = /\[Factura ([^\],]+), pág\. (\d+)\]/g;

export function extractCitations(answer) {
  return [...String(answer || "").matchAll(CITATION_PATTERN)].map((match) => ({
    code: match[1].trim(),
    page: Number(match[2]),
    citation: match[0]
  }));
}

export function allowedCitationKeys(hits) {
  return new Set(
    (hits || []).map((hit) => `${hit.invoice?.code || hit.invoiceCode}|${hit.page}`)
  );
}

export function citationKey(code, page) {
  return `${String(code).trim()}|${Number(page)}`;
}

export function extractEvidenceLine(question, chunk) {
  const terms = tokenize(question);
  const lines = String(chunk.text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const matched = lines.find((line) =>
    terms.some((term) =>
      line
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(term)
    )
  );

  return matched || lines[0] || "";
}

export function generateGroundedAnswer(question, hits, { maxSentences = 2 } = {}) {
  if (!hits?.length) {
    return "No encontré evidencia verificable en las facturas indexadas para responder esa pregunta.";
  }

  return hits
    .slice(0, maxSentences)
    .map((hit) => {
      const evidence = extractEvidenceLine(question, hit);
      const code = hit.invoice?.code || hit.invoiceCode;
      return `${evidence} ${buildCitationLabel(code, hit.page)}`.trim();
    })
    .join(" ");
}

export function verifyAnswerCitations(answer, hits) {
  const allowed = allowedCitationKeys(hits);
  const verified = [];
  const sanitized = String(answer || "").replace(CITATION_PATTERN, (match, code, page) => {
    const key = citationKey(code, page);
    if (!allowed.has(key)) {
      return "";
    }

    verified.push({ code: code.trim(), page: Number(page), citation: match });
    return match;
  });

  let nextAnswer = sanitized.replace(/\s{2,}/g, " ").trim();
  const lacksEvidence = /no encontr/i.test(nextAnswer);

  if (!verified.length && hits.length && !lacksEvidence) {
    const code = hits[0].invoice?.code || hits[0].invoiceCode;
    nextAnswer = `${nextAnswer} ${buildCitationLabel(code, hits[0].page)}`.trim();
    verified.push({
      code,
      page: hits[0].page,
      citation: buildCitationLabel(code, hits[0].page)
    });
  }

  return { answer: nextAnswer, verified };
}
