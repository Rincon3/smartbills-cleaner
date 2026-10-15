import { DEFAULT_ADJUSTED_MODEL, DEFAULT_BASE_MODEL } from "./constants.js";
import { generateGroundedAnswer } from "./citations.js";

export function bedrockEnabled() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
      process.env.BEDROCK_AWS_ACCESS_KEY_ID ||
      process.env.AWS_BEARER_TOKEN_BEDROCK
  );
}

export function openaiEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function modelContent(message) {
  if (!message) {
    return "";
  }

  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part === "string" ? part : part.text || ""))
      .join(" ")
      .trim();
  }

  return String(message.content || "").trim();
}

export async function invokeBedrock({ prompt, model, role }) {
  const { ChatBedrockConverse } = await import("@langchain/aws");
  const llm = new ChatBedrockConverse({
    model,
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    temperature: role === "base" ? 0 : 0.1,
    maxTokens: role === "base" ? 220 : 360
  });
  const result = await llm.invoke(prompt);
  return modelContent(result);
}

export async function invokeOpenAi(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 280,
      messages: [
        {
          role: "system",
          content: "Responde en español, breve y solo con evidencia citada [Factura X, pág. Y]."
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

export async function generateCandidate({ role, question, hits, prompt }) {
  const baseModel = process.env.BEDROCK_BASE_MODEL || DEFAULT_BASE_MODEL;
  const adjustedModel = process.env.BEDROCK_ADJUSTED_MODEL || DEFAULT_ADJUSTED_MODEL;

  try {
    if (bedrockEnabled()) {
      const model = role === "adjusted" ? adjustedModel : baseModel;
      const text = await invokeBedrock({ prompt, model, role });
      if (text) {
        return { role, provider: "bedrock", model, text };
      }
    }

    if (role === "adjusted" && openaiEnabled()) {
      const text = await invokeOpenAi(prompt);
      if (text) {
        return {
          role,
          provider: "openai",
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          text
        };
      }
    }
  } catch (error) {
    console.warn(`RAG ${role} generator failed`, error.message);
  }

  return {
    role,
    provider: "local",
    model: role === "adjusted" ? "grounded-top3" : "grounded-top1",
    text: generateGroundedAnswer(question, hits, { maxSentences: role === "adjusted" ? 2 : 1 })
  };
}
