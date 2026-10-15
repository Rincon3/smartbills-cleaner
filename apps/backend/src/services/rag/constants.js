export const RAG_TOP_K = Number(process.env.RAG_TOP_K || 5) || 5;
export const MIN_RETRIEVAL_SCORE = 0.22;
export const RAG_PROMPT_NAME = "RAG_CITATION_FEWSHOT_ES";

export const DEFAULT_BASE_MODEL = "amazon.nova-lite-v1:0";
export const DEFAULT_ADJUSTED_MODEL = "amazon.nova-pro-v1:0";
