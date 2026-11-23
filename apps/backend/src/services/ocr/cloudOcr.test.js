import test from "node:test";
import assert from "node:assert/strict";
import {
  azureDocumentIntelligenceConfigured,
  cloudOcrOrder,
  documentAiConfigured,
  pagesFromAzure,
  pagesFromDocumentAi,
  pagesFromTextract,
  textractConfigured,
  tryCloudOcr
} from "./cloudOcr.js";

test("sin claves no activa Azure, Document AI ni Textract", () => {
  assert.equal(azureDocumentIntelligenceConfigured(), false);
  assert.equal(documentAiConfigured(), false);
  assert.equal(textractConfigured(), false);
  assert.deepEqual(cloudOcrOrder(), ["azure", "documentai", "textract"]);
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

test("arma páginas desde Azure Document Intelligence con NIT y total", () => {
  const pages = pagesFromAzure({
    analyzeResult: {
      pages: [{ pageNumber: 1, lines: [{ content: "Factura de servicios" }] }],
      documents: [
        {
          fields: {
            VendorName: { content: "Enel Colombia" },
            VendorTaxId: { content: "860063875-6" },
            InvoiceTotal: { content: "380.800", valueCurrency: { amount: 380800 } }
          }
        }
      ]
    }
  });
  assert.equal(pages[0].engine, "azure-document-intelligence");
  assert.match(pages[0].text, /NIT: 860063875-6/);
  assert.match(pages[0].text, /Total: 380.800/);
  assert.match(pages[0].text, /Enel Colombia/);
  assert.match(pages[0].text, /Factura de servicios/);
});

test("Azure sin páginas usa el content plano", () => {
  const pages = pagesFromAzure({
    analyzeResult: { content: "NIT 900.123.456-7 Total 249.900" }
  });
  assert.equal(pages.length, 1);
  assert.match(pages[0].text, /249.900/);
});
