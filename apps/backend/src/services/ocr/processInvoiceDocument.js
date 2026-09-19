import { extractInvoiceFields, mergeExtractedFields } from "./extractInvoiceFields.js";
import { extractDocumentPages, serializeOcrText } from "./ocrEngine.js";

async function extractWithLlm(ocrText) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extrae datos de facturas. Devuelve JSON con supplier, taxId, issueDate (YYYY-MM-DD), subtotal, vat, total, documentNumber. No inventes valores que no esten en el texto."
        },
        {
          role: "user",
          content: ocrText.slice(0, 12000)
        }
      ]
    })
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function processInvoiceDocument({ filePath, mimeType }) {
  const extracted = await extractDocumentPages({ filePath, mimeType });
  const ocrRawText = serializeOcrText(extracted.pages);
  const readableText = extracted.pages.map((page) => page.text).join("\n");
  const ruleResult = extractInvoiceFields(readableText);
  let llmResult = null;

  try {
    llmResult = await extractWithLlm(readableText);
  } catch {
    llmResult = null;
  }

  const fields = mergeExtractedFields(ruleResult, llmResult);
  const hasText = extracted.pages.some((page) => String(page.text || "").trim().length > 20);
  const status = !hasText || fields.missingCore ? "ERROR" : "PROCESSED";

  return {
    ...fields,
    status,
    ocrEngine: extracted.engine,
    ocrRawText,
    pageCount: extracted.pageCount,
    pages: extracted.pages,
    averageConfidence: hasText ? fields.averageConfidence : 0.15
  };
}
