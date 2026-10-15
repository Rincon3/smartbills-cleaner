import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { EMBEDDING_MODEL, VECTOR_SIZE } from "../../utils/embeddings.js";
import { RAG_PROMPT_NAME, RAG_TOP_K } from "./constants.js";
import { generateWithConsensus } from "./consensus.js";
import { formatRetrievedSources, renderCitationPrompt } from "./prompt.js";
import { InvoiceChunkRetriever, documentToHit } from "./retriever.js";

export function createRetrievalQaChain({ k = RAG_TOP_K, invoiceId = null, filters = {} } = {}) {
  const retrieve = RunnableLambda.from(async (input) => {
    const question = typeof input === "string" ? input : input.question;
    const scopedId = typeof input === "object" && input.invoiceId !== undefined ? input.invoiceId : invoiceId;
    const scopedFilters = typeof input === "object" && input.filters ? input.filters : filters;
    const retriever = new InvoiceChunkRetriever({ k, invoiceId: scopedId, filters: scopedFilters });
    const docs = await retriever.invoke(question);
    const hits = docs.map(documentToHit);
    const prompt = renderCitationPrompt({
      question,
      sources: formatRetrievedSources(hits)
    });

    return { question, hits, prompt, k };
  });

  const generate = RunnableLambda.from(async ({ question, hits, prompt, k: topK }) => {
    const consensus = await generateWithConsensus({ question, hits, prompt });
    return {
      question,
      hits,
      prompt,
      promptTemplate: RAG_PROMPT_NAME,
      answer: consensus.winner?.answer || "",
      consensus: {
        selected: consensus.winner
          ? {
              role: consensus.winner.role,
              provider: consensus.winner.provider,
              model: consensus.winner.model,
              score: consensus.winner.score
            }
          : null,
        candidates: consensus.candidates
      },
      retrieval: {
        backend: "pgvector+langchain",
        embeddingModel: EMBEDDING_MODEL,
        embeddingDim: VECTOR_SIZE,
        topK,
        chain: "RetrievalQA"
      }
    };
  });

  return RunnableSequence.from([retrieve, generate]);
}

export async function runRetrievalQa({ question, invoiceId = null, filters = {}, k = RAG_TOP_K }) {
  const chain = createRetrievalQaChain({ k, invoiceId, filters });
  return chain.invoke({ question, invoiceId, filters });
}
