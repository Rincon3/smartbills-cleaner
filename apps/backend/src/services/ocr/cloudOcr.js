import { createSign } from "crypto";
import { readFile } from "fs/promises";

const CLOUD_TIMEOUT_MS = 20000;
const TEXTRACT_SYNC_MAX_BYTES = 5 * 1024 * 1024;
const AZURE_MAX_BYTES = 4 * 1024 * 1024;
const AZURE_API_VERSION = "2024-11-30";
const AZURE_LEGACY_API_VERSION = "2023-07-31";

export function documentAiConfigured() {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT &&
      process.env.DOCUMENT_AI_PROCESSOR_ID &&
      (process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_APPLICATION_CREDENTIALS) &&
      (process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

export function textractConfigured() {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export function azureDocumentIntelligenceConfigured() {
  return Boolean(azureEndpoint() && azureKey());
}

function azureEndpoint() {
  return String(
    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ||
      process.env.AZURE_FORM_RECOGNIZER_ENDPOINT ||
      ""
  ).replace(/\/+$/, "");
}

function azureKey() {
  return String(
    process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_FORM_RECOGNIZER_KEY || ""
  ).trim();
}

function azureModel() {
  return String(process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || "prebuilt-invoice").trim();
}

export function cloudOcrOrder() {
  const raw = String(process.env.OCR_CLOUD_ORDER || "azure,documentai,textract")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return raw.length ? raw : ["azure", "documentai", "textract"];
}

function textFromAnchor(fullText, anchor) {
  if (!anchor?.textSegments?.length || !fullText) {
    return "";
  }

  return anchor.textSegments
    .map((segment) =>
      fullText.slice(Number(segment.startIndex || 0), Number(segment.endIndex || fullText.length))
    )
    .join("")
    .trim();
}

export function pagesFromDocumentAi(payload) {
  const document = payload?.document || payload || {};
  const fullText = String(document.text || "");
  const pages = Array.isArray(document.pages) ? document.pages : [];

  if (!pages.length) {
    return fullText
      ? [{ page: 1, section: "Página 1", text: fullText.trim(), engine: "document-ai" }]
      : [];
  }

  return pages.map((page, index) => ({
    page: index + 1,
    section: `Página ${index + 1}`,
    text: textFromAnchor(fullText, page.layout?.textAnchor) || fullText,
    engine: "document-ai"
  }));
}

export function pagesFromTextract(payload) {
  const blocks = payload?.Blocks || [];
  const pages = [];
  let current = 1;
  let lines = [];

  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) {
      pages.push({
        page: current,
        section: `Página ${current}`,
        text,
        engine: "textract"
      });
    }
    lines = [];
  };

  for (const block of blocks) {
    if (block.BlockType === "PAGE" && lines.length) {
      flush();
      current += 1;
    }
    if (block.BlockType === "LINE" && block.Text) {
      lines.push(block.Text);
    }
  }
  flush();
  return pages;
}

function azureFieldText(field) {
  if (!field) {
    return "";
  }
  if (field.content) {
    return String(field.content).trim();
  }
  if (field.valueString) {
    return String(field.valueString).trim();
  }
  if (field.valueDate) {
    return String(field.valueDate).trim();
  }
  if (field.valueCurrency?.amount != null) {
    return String(field.valueCurrency.amount);
  }
  if (field.valueNumber != null) {
    return String(field.valueNumber);
  }
  return "";
}

function azureStructuredLines(analyzeResult) {
  const fields = analyzeResult?.documents?.[0]?.fields || {};
  const rows = [
    ["Proveedor", azureFieldText(fields.VendorName)],
    ["NIT", azureFieldText(fields.VendorTaxId)],
    ["Factura", azureFieldText(fields.InvoiceId)],
    ["Fecha", azureFieldText(fields.InvoiceDate)],
    ["Fecha de vencimiento", azureFieldText(fields.DueDate)],
    ["Subtotal", azureFieldText(fields.SubTotal)],
    ["IVA", azureFieldText(fields.TotalTax)],
    ["Total", azureFieldText(fields.InvoiceTotal) || azureFieldText(fields.AmountDue)]
  ];
  return rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`);
}

export function pagesFromAzure(payload) {
  const analyzeResult = payload?.analyzeResult || payload || {};
  const structured = azureStructuredLines(analyzeResult);
  const pages = Array.isArray(analyzeResult.pages) ? analyzeResult.pages : [];

  const fromPages = pages
    .map((page) => {
      const lines = (page.lines || []).map((line) => line.content || line.text).filter(Boolean);
      return {
        page: Number(page.pageNumber || page.page || 1),
        section: `Página ${page.pageNumber || page.page || 1}`,
        text: lines.join("\n").trim(),
        engine: "azure-document-intelligence"
      };
    })
    .filter((page) => page.text);

  if (!fromPages.length && analyzeResult.content) {
    fromPages.push({
      page: 1,
      section: "Página 1",
      text: String(analyzeResult.content).trim(),
      engine: "azure-document-intelligence"
    });
  }

  if (!fromPages.length && structured.length) {
    return [
      {
        page: 1,
        section: "Página 1",
        text: structured.join("\n"),
        engine: "azure-document-intelligence"
      }
    ];
  }

  if (structured.length && fromPages[0]) {
    fromPages[0] = {
      ...fromPages[0],
      text: `${structured.join("\n")}\n${fromPages[0].text}`.trim()
    };
  }

  return fromPages;
}

async function loadGoogleCredentials() {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    return null;
  }

  const raw = JSON.parse(await readFile(credentialsPath, "utf8"));
  return {
    clientEmail: raw.client_email,
    privateKey: String(raw.private_key || "").replace(/\\n/g, "\n")
  };
}

async function googleAccessToken() {
  const credentials = await loadGoogleCredentials();
  if (!credentials?.clientEmail || !credentials?.privateKey) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: credentials.clientEmail,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  ).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const assertion = `${header}.${payload}.${signer.sign(credentials.privateKey, "base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }),
    signal: AbortSignal.timeout(CLOUD_TIMEOUT_MS)
  });

  if (!response.ok) {
    return null;
  }

  const body = await response.json();
  return body.access_token || null;
}

async function extractWithDocumentAi(filePath, mimeType) {
  if (!documentAiConfigured()) {
    return null;
  }

  const token = await googleAccessToken();
  if (!token) {
    return null;
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.DOCUMENT_AI_LOCATION || "us";
  const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;
  const bytes = await readFile(filePath);
  const url = `https://${location}-documentai.googleapis.com/v1/projects/${project}/locations/${location}/processors/${processorId}:process`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      rawDocument: {
        content: bytes.toString("base64"),
        mimeType: mimeType || "application/pdf"
      }
    }),
    signal: AbortSignal.timeout(CLOUD_TIMEOUT_MS)
  });

  if (!response.ok) {
    return null;
  }

  const pages = pagesFromDocumentAi(await response.json());
  if (!pages.length) {
    return null;
  }

  return { engine: "document-ai", pageCount: pages.length, pages };
}

async function extractWithTextract(filePath, mimeType) {
  if (!textractConfigured()) {
    return null;
  }

  const bytes = await readFile(filePath);
  if (bytes.length > TEXTRACT_SYNC_MAX_BYTES) {
    return null;
  }

  const { TextractClient, DetectDocumentTextCommand } = await import("@aws-sdk/client-textract");
  const client = new TextractClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1"
  });
  const result = await client.send(
    new DetectDocumentTextCommand({
      Document: { Bytes: bytes }
    })
  );
  const pages = pagesFromTextract(result);
  if (!pages.length) {
    return null;
  }

  return { engine: "textract", pageCount: pages.length, pages, mimeType };
}

function azureAnalyzeUrls(model) {
  const endpoint = azureEndpoint();
  return [
    `${endpoint}/documentintelligence/documentModels/${model}:analyze?api-version=${AZURE_API_VERSION}&locale=es`,
    `${endpoint}/formrecognizer/documentModels/${model}:analyze?api-version=${AZURE_LEGACY_API_VERSION}`
  ];
}

async function pollAzureOperation(operationUrl, key, startedAt) {
  while (Date.now() - startedAt < CLOUD_TIMEOUT_MS) {
    const remaining = CLOUD_TIMEOUT_MS - (Date.now() - startedAt);
    const response = await fetch(operationUrl, {
      headers: { "Ocp-Apim-Subscription-Key": key },
      signal: AbortSignal.timeout(Math.max(1000, remaining))
    });
    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    if (body.status === "succeeded") {
      return body;
    }
    if (body.status === "failed") {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return null;
}

async function extractWithAzure(filePath, mimeType) {
  if (!azureDocumentIntelligenceConfigured()) {
    return null;
  }

  const bytes = await readFile(filePath);
  if (bytes.length > AZURE_MAX_BYTES) {
    return null;
  }

  const key = azureKey();
  const startedAt = Date.now();
  const payload = JSON.stringify({
    base64Source: bytes.toString("base64")
  });

  for (const url of azureAnalyzeUrls(azureModel())) {
    const remaining = CLOUD_TIMEOUT_MS - (Date.now() - startedAt);
    if (remaining < 1000) {
      return null;
    }

    const started = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/json"
      },
      body: payload,
      signal: AbortSignal.timeout(remaining)
    });

    if (started.status !== 202) {
      continue;
    }

    const operationUrl = started.headers.get("operation-location");
    if (!operationUrl) {
      continue;
    }

    const result = await pollAzureOperation(operationUrl, key, startedAt);
    const pages = pagesFromAzure(result);
    if (pages.length) {
      return {
        engine: "azure-document-intelligence",
        pageCount: pages.length,
        pages,
        mimeType
      };
    }
  }

  return null;
}

const cloudExtractors = {
  azure: extractWithAzure,
  documentai: extractWithDocumentAi,
  textract: extractWithTextract
};

export async function tryCloudOcr({ filePath, mimeType }) {
  for (const name of cloudOcrOrder()) {
    const extract = cloudExtractors[name];
    if (!extract) {
      continue;
    }

    try {
      const result = await extract(filePath, mimeType);
      if (result?.pages?.some((page) => String(page.text || "").trim().length >= 40)) {
        return result;
      }
    } catch (error) {
      console.warn(`OCR nube ${name} omitido:`, error.message || error);
    }
  }

  return null;
}
