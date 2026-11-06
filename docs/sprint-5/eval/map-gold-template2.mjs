#!/usr/bin/env node
/**
 * Mapea el gold canónico (ocr-gold.template2.csv) al formato de compare-ocr.mjs.
 *
 * Canónico: docs/sprint-5/eval/ocr-gold.template2.csv
 * Derivado: docs/sprint-5/eval/ocr-gold.csv
 *
 * Uso:
 *   node docs/sprint-5/eval/map-gold-template2.mjs
 *   node docs/sprint-5/eval/compare-ocr.mjs docs/sprint-5/eval/ocr-gold.csv docs/sprint-5/eval/ocr-pred.csv
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(here, process.argv[2] || "ocr-gold.template2.csv");
const dstPath = resolve(here, process.argv[3] || "ocr-gold.csv");

const MAP = {
  archivo: "file_name",
  tipo: "source_type",
  proveedor: "supplier_gold",
  nit: "nit_gold",
  fecha: "issue_date_gold",
  subtotal: "subtotal_gold",
  iva: "vat_gold",
  total: "total_gold",
  notas: "notes"
};

const OUT_HEADERS = [
  "file_name",
  "source_type",
  "supplier_gold",
  "nit_gold",
  "issue_date_gold",
  "due_date_gold",
  "subtotal_gold",
  "vat_gold",
  "total_gold",
  "invoice_number_gold",
  "notes"
];

function splitRow(line) {
  const out = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((item) => item.trim());
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const raw = readFileSync(srcPath, "utf8").replace(/^\uFEFF/, "");
const lines = raw.trim().split(/\r?\n/).filter(Boolean);
const headers = splitRow(lines[0]);
const rows = lines.slice(1).map((line) => {
  const cells = splitRow(line);
  const src = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  const dst = {
    due_date_gold: "",
    invoice_number_gold: ""
  };
  for (const [from, to] of Object.entries(MAP)) {
    dst[to] = src[from] ?? "";
  }
  return dst;
});

const out = [
  OUT_HEADERS.join(","),
  ...rows.map((row) => OUT_HEADERS.map((header) => csvEscape(row[header])).join(","))
].join("\n");

writeFileSync(dstPath, `${out}\n`);
console.error(`canónico ${srcPath} → ${dstPath} (${rows.length} filas)`);
