import dotenv from "dotenv";

dotenv.config();

export function assertProductionSecrets(processEnv = process.env) {
  if (processEnv.NODE_ENV !== "production") {
    return;
  }

  const secret = String(processEnv.JWT_SECRET || "").trim();
  if (!secret || secret === "change-me") {
    throw new Error("JWT_SECRET must be set to a non-default value when NODE_ENV=production");
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-me",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2",
  bedrockBaseModel: process.env.BEDROCK_BASE_MODEL || "amazon.nova-lite-v1:0",
  bedrockAdjustedModel: process.env.BEDROCK_ADJUSTED_MODEL || "amazon.nova-lite-v1:0",
  ragTopK: Number(process.env.RAG_TOP_K || 3),
  minRetrievalScore: Number(process.env.MIN_RETRIEVAL_SCORE || 0.32),
  ocrCloudOrder: process.env.OCR_CLOUD_ORDER || "docintel,azure,documentai,textract"
};
