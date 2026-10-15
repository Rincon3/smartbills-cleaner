import test from "node:test";
import assert from "node:assert/strict";
import {
  cloudOcrOrder,
  documentAiConfigured,
  pagesFromDocumentAi,
  pagesFromTextract,
  textractConfigured,
  tryCloudOcr
} from "./cloudOcr.js";

test("sin claves no activa Document AI ni Textract", () => {
  assert.equal(documentAiConfigured(), false);
  assert.equal(textractConfigured(), false);
  assert.deepEqual(cloudOcrOrder(), ["documentai", "textract"]);
});

test("tryCloudOcr no lanza y sigue el flujo si no hay APIs", async () => {
  const result = await tryCloudOcr({
    filePath: "/tmp/missing-invoice.pdf",
    mimeType: "application/pdf"
  });
  assert.equal(result, null);
});

test("arma páginas desde la respuesta de Document AI", () => {
  const pages = pagesFromDocumentAi({
    document: {
      text: "Factura Enel NIT 860",
      pages: [{ layout: { textAnchor: { textSegments: [{ startIndex: 0, endIndex: 21 }] } } }]
    }
  });
  assert.equal(pages[0].engine, "document-ai");
  assert.match(pages[0].text, /Enel/);
});

test("arma páginas desde bloques de Textract", () => {
  const pages = pagesFromTextract({
    Blocks: [
      { BlockType: "PAGE" },
      { BlockType: "LINE", Text: "Total 380.800" }
    ]
  });
  assert.equal(pages[0].engine, "textract");
  assert.match(pages[0].text, /380/);
});
