import { cosineSimilarity, embedText } from "../../utils/embeddings.js";
import { allowedCitationKeys, citationKey, extractCitations, verifyAnswerCitations } from "./citations.js";
import { generateCandidate } from "./generators.js";

export function scoreCandidate(candidate, question, hits) {
  const originalCitations = extractCitations(candidate.text);
  const allowed = allowedCitationKeys(hits);
  const supported = originalCitations.filter((item) => allowed.has(citationKey(item.code, item.page)));
  const faithfulness = originalCitations.length
    ? supported.length / originalCitations.length
    : /no encontr/i.test(candidate.text)
      ? 1
      : 0.35;
  const checked = verifyAnswerCitations(candidate.text, hits);
  const relevancy = cosineSimilarity(embedText(question), embedText(checked.answer));
  const brevity = Math.max(0, 1 - Math.max(checked.answer.length - 280, 0) / 400);

  return {
    ...candidate,
    answer: checked.answer,
    verified: checked.verified,
    score: Number((faithfulness * 0.5 + relevancy * 0.3 + brevity * 0.2).toFixed(4))
  };
}

export function selectConsensus(scored) {
  return [...scored].sort((left, right) => right.score - left.score)[0] || null;
}

export async function generateWithConsensus({ question, hits, prompt }) {
  const raw = await Promise.all([
    generateCandidate({ role: "base", question, hits, prompt }),
    generateCandidate({ role: "adjusted", question, hits, prompt })
  ]);

  const scored = raw.map((candidate) => scoreCandidate(candidate, question, hits));
  const winner = selectConsensus(scored);

  return {
    winner,
    candidates: scored.map((item) => ({
      role: item.role,
      provider: item.provider,
      model: item.model,
      score: item.score
    }))
  };
}
