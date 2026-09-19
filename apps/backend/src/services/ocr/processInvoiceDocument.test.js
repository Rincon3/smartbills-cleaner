import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "url";
import { processInvoiceDocument } from "./processInvoiceDocument.js";

test("procesa PDF de muestra y extrae datos requeridos de la factura", async () => {
  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures/sample-invoice.pdf");
  const result = await processInvoiceDocument({ filePath, mimeType: "application/pdf" });

  assert.equal(result.status, "PROCESSED");
  assert.equal(result.documentNumber, "FV-88421");
  assert.equal(result.taxId, "900.123.456-7");
  assert.equal(result.total, 1190000);
  assert.match(result.supplier, /Editorial Andes/i);
  assert.ok(result.pageCount >= 1);
  assert.ok(result.ocrEngine);
  assert.match(result.ocrRawText, /NIT/);
});
