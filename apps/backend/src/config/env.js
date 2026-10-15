import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-me",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
  bedrockBaseModel: process.env.BEDROCK_BASE_MODEL || "amazon.nova-lite-v1:0",
  bedrockAdjustedModel: process.env.BEDROCK_ADJUSTED_MODEL || "amazon.nova-pro-v1:0",
  ragTopK: Number(process.env.RAG_TOP_K || 5),
  ocrCloudOrder: process.env.OCR_CLOUD_ORDER || "documentai,textract"
};
