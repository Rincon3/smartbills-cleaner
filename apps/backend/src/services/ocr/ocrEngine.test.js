import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "url";
import { extractDocumentPages, parseOcrPages, serializeOcrText } from "./ocrEngine.js";

test("serializa y recupera paginas OCR", () => {
  const raw = serializeOcrText([
    { page: 1, text: "NIT: 900.123.456-7" },
    { page: 2, text: "Total a pagar: 1000" }
  ]);
  const pages = parseOcrPages(raw);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].page, 1);
  assert.match(pages[1].text, /Total a pagar/);
});

test("parseOcrPages retorna vacio si no hay texto", () => {
  assert.deepEqual(parseOcrPages(""), []);
});

test("extrae texto real de un PDF de factura de prueba", async () => {
  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures/sample-invoice.pdf");
  const result = await extractDocumentPages({ filePath, mimeType: "application/pdf" });
  assert.ok(result.pageCount >= 1);
  const text = result.pages.map((page) => page.text).join(" ");
  assert.match(text, /NIT/i);
  assert.match(text, /FV-88421/);
  assert.match(text, /Editorial Andes/i);
});
