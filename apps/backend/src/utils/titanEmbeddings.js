import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import {
  EMBEDDING_MODEL,
  HASH_EMBEDDING_MODEL,
  HASH_VECTOR_SIZE,
  VECTOR_SIZE,
  embedText
} from "./embeddings.js";

export class EmbeddingUnavailableError extends Error {
  constructor(cause) {
    super(cause?.message || "Bedrock embeddings no disponibles");
    this.name = "EmbeddingUnavailableError";
    this.cause = cause;
  }
}

export function isEmbeddingUnavailable(error) {
  if (!error) {
    return false;
  }

  if (error instanceof EmbeddingUnavailableError) {
    return true;
  }

  const name = String(error.name || error.Code || "");
  const status = error.$metadata?.httpStatusCode;
  return (
    name === "ExpiredTokenException" ||
    name === "ExpiredToken" ||
    name === "UnrecognizedClientException" ||
    name === "AccessDeniedException" ||
    name === "CredentialsProviderError" ||
    status === 401 ||
    status === 403
  );
}

let client;

function getClient() {
  if (!client) {
    client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2"
    });
  }

  return client;
}

export function isHashBaseline() {
  return process.env.EMBEDDING_BASELINE === "hash";
}

export async function embedQuery(text) {
  if (isHashBaseline()) {
    return {
      embedding: embedText(text),
      embeddingModel: HASH_EMBEDDING_MODEL,
      embeddingDim: HASH_VECTOR_SIZE
    };
  }

  return {
    embedding: await embedForRetrieval(text),
    embeddingModel: process.env.EMBEDDING_MODEL || EMBEDDING_MODEL,
    embeddingDim: VECTOR_SIZE
  };
}

export async function embedForRetrieval(text) {
  const inputText = String(text || "").trim() || "factura";

  try {
    const response = await getClient().send(
      new InvokeModelCommand({
        modelId: process.env.EMBEDDING_MODEL || EMBEDDING_MODEL,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          inputText: inputText.slice(0, 50000),
          dimensions: VECTOR_SIZE,
          normalize: true
        })
      })
    );
    const payload = JSON.parse(Buffer.from(response.body).toString("utf8"));
    const embedding = payload.embedding;
    if (!Array.isArray(embedding) || embedding.length !== VECTOR_SIZE) {
      throw new EmbeddingUnavailableError(new Error("Titan devolvió una dimensión distinta a 1024"));
    }

    return embedding.map((value) => Number(value || 0));
  } catch (error) {
    throw error instanceof EmbeddingUnavailableError ? error : new EmbeddingUnavailableError(error);
  }
}
