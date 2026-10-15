import { queryInvoices } from "../src/services/queryService.js";
import { RAG_EVAL_CASES } from "../src/services/rag/evalCases.js";
import { ragasScores } from "../src/services/rag/ragasMetrics.js";
import { prisma } from "../src/config/prisma.js";

const rows = [];

for (const sample of RAG_EVAL_CASES) {
  const result = await queryInvoices({ question: sample.question });
  const scores = ragasScores({
    question: sample.question,
    answer: result.answer,
    contexts: result.sources,
    relevantCodes: sample.relevantCodes,
    groundTruth: sample.groundTruth
  });

  rows.push({
    id: sample.id,
    question: sample.question,
    answer: result.answer,
    topK: result.retrieval?.topK,
    consensus: result.consensus?.selected,
    ...scores
  });
}

const numericKeys = ["faithfulness", "context_precision", "context_recall", "answer_relevancy", "ragas"];
const average = Object.fromEntries(
  numericKeys.map((key) => [
    key,
    Number((rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length).toFixed(4))
  ])
);

console.log(JSON.stringify({ average, cases: rows }, null, 2));

await prisma.$disconnect();
