import { cosineSimilarity, embedText, tokenize } from "../../utils/embeddings.js";
import { citationKey, extractCitations } from "./citations.js";

function contextKeys(contexts) {
  return new Set(
    (contexts || []).map((item) => citationKey(item.invoiceCode || item.invoice?.code, item.page))
  );
}

export function faithfulness({ answer, contexts }) {
  const citations = extractCitations(answer);
  if (!citations.length) {
    return /no encontr/i.test(answer) ? 1 : 0;
  }

  const allowed = contextKeys(contexts);
  const supported = citations.filter((item) => allowed.has(citationKey(item.code, item.page)));
  return supported.length / citations.length;
}

export function contextPrecision({ contexts, relevantCodes = [] }) {
  if (!contexts?.length) {
    return 0;
  }

  const expected = new Set(relevantCodes);
  const hits = contexts.filter((item) => expected.has(item.invoiceCode || item.invoice?.code));
  return hits.length / contexts.length;
}

export function contextRecall({ contexts, relevantCodes = [] }) {
  if (!relevantCodes.length) {
    return 1;
  }

  const retrieved = new Set((contexts || []).map((item) => item.invoiceCode || item.invoice?.code));
  const found = relevantCodes.filter((code) => retrieved.has(code));
  return found.length / relevantCodes.length;
}

export function answerRelevancy({ question, answer }) {
  if (!answer) {
    return 0;
  }

  return cosineSimilarity(embedText(question), embedText(answer));
}

export function answerCorrectness({ answer, groundTruth }) {
  if (!groundTruth) {
    return answerRelevancy({ question: groundTruth || "", answer });
  }

  const expected = tokenize(groundTruth, { dropStopwords: true });
  const got = new Set(tokenize(answer, { dropStopwords: true }));
  if (!expected.length) {
    return 0;
  }

  const overlap = expected.filter((token) => got.has(token)).length;
  return overlap / expected.length;
}

export function ragasScores(sample) {
  const scores = {
    faithfulness: faithfulness(sample),
    context_precision: contextPrecision(sample),
    context_recall: contextRecall(sample),
    answer_relevancy: answerRelevancy(sample),
    answer_correctness: sample.groundTruth ? answerCorrectness(sample) : null
  };

  const parts = [scores.faithfulness, scores.context_precision, scores.context_recall, scores.answer_relevancy].filter(
    (value) => Number.isFinite(value)
  );
  scores.ragas = parts.reduce((sum, value) => sum + value, 0) / parts.length;
  return Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [key, value == null ? null : Number(value.toFixed(4))])
  );
}
