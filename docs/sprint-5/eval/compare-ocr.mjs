#!/usr/bin/env node
/**
 * Compara gold vs predicción OCR. No toca la app.
 * Uso: node docs/sprint-5/eval/compare-ocr.mjs gold.csv pred.csv
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FIELDS = [
  ["supplier", "Proveedor"],
  ["nit", "NIT"],
  ["issue_date", "Fecha emisión"],
  ["subtotal", "Subtotal"],
  ["vat", "IVA"],
  ["total", "Total"]
];

const OPTIONAL = [
  ["due_date", "Vencimiento"],
  ["invoice_number", "Número"]
];

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(Boolean);
  const headers = splitRow(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitRow(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

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

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function money(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "No detectado" || raw === "No identificado") {
    return null;
  }
  const normalized = raw.replace(/\s/g, "").replace(/\$/g, "");
  if (/\.\d{3}(,\d{1,2})?$/.test(normalized) || /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(normalized)) {
    return Number(normalized.replace(/\./g, "").replace(",", "."));
  }
  if (/,\d{1,2}$/.test(normalized) && !normalized.includes(".")) {
    return Number(normalized.replace(",", "."));
  }
  const amount = Number(normalized.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function dateIso(value) {
  const raw = String(value || "").trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const latin = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (latin) {
    const year = latin[3].length === 2 ? `20${latin[3]}` : latin[3];
    return `${year}-${latin[2].padStart(2, "0")}-${latin[1].padStart(2, "0")}`;
  }
  return raw.toLowerCase();
}

function normText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/s\.?\s*a\.?/g, " ")
    .replace(/e\.?\s*s\.?\s*p\.?/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchField(field, gold, pred) {
  if (field === "nit") {
    const g = digits(gold);
    const p = digits(pred);
    if (!g) {
      return null;
    }
    return g === p;
  }
  if (field === "issue_date" || field === "due_date") {
    if (!String(gold || "").trim()) {
      return null;
    }
    return dateIso(gold) === dateIso(pred);
  }
  if (field === "subtotal" || field === "vat" || field === "total") {
    const g = money(gold);
    const p = money(pred);
    if (g == null) {
      return null;
    }
    if (p == null) {
      return false;
    }
    return Math.abs(g - p) <= 1;
  }
  if (!String(gold || "").trim()) {
    return null;
  }
  const g = normText(gold);
  const p = normText(pred);
  return Boolean(p) && (p === g || p.includes(g) || g.includes(p));
}

function value(row, field, side) {
  return row[`${field}_${side}`] ?? row[`${field}${side === "gold" ? "_gold" : "_pred"}`] ?? "";
}

const goldPath = resolve(process.argv[2] || "docs/sprint-5/eval/ocr-gold.csv");
const predPath = resolve(process.argv[3] || "docs/sprint-5/eval/ocr-pred.csv");
const gold = parseCsv(readFileSync(goldPath, "utf8"));
const pred = parseCsv(readFileSync(predPath, "utf8"));
const predByFile = new Map(pred.map((row) => [row.file_name, row]));

const perField = {};
for (const [field] of [...FIELDS, ...OPTIONAL]) {
  perField[field] = { labeled: 0, correct: 0 };
}

const rows = [];
for (const item of gold) {
  if (!item.file_name || item.notes?.startsWith("EJEMPLO")) {
    continue;
  }
  const predicted = predByFile.get(item.file_name);
  if (!predicted) {
    rows.push({ file: item.file_name, error: "sin predicción" });
    continue;
  }
  const result = { file: item.file_name, source_type: item.source_type };
  for (const [field] of [...FIELDS, ...OPTIONAL]) {
    const ok = matchField(field, value(item, field, "gold"), value(predicted, field, "pred"));
    result[field] = ok === null ? "n/a" : ok ? "ok" : "fail";
    if (ok !== null) {
      perField[field].labeled += 1;
      if (ok) {
        perField[field].correct += 1;
      }
    }
  }
  rows.push(result);
}

const primary = FIELDS.map(([field, label]) => {
  const { labeled, correct } = perField[field];
  const acc = labeled ? correct / labeled : null;
  return { field, label, labeled, correct, acc };
});
const overallLabeled = primary.reduce((sum, item) => sum + item.labeled, 0);
const overallCorrect = primary.reduce((sum, item) => sum + item.correct, 0);

const report = {
  files: rows.filter((row) => !row.error).length,
  missingPredictions: rows.filter((row) => row.error).length,
  overallPrimary: overallLabeled ? Number((overallCorrect / overallLabeled).toFixed(4)) : null,
  thresholdR2: 0.9,
  meetsR2: overallLabeled ? overallCorrect / overallLabeled >= 0.9 : false,
  byField: Object.fromEntries(
    [...FIELDS, ...OPTIONAL].map(([field, label]) => {
      const { labeled, correct } = perField[field];
      return [
        field,
        {
          label,
          labeled,
          correct,
          acc: labeled ? Number((correct / labeled).toFixed(4)) : null
        }
      ];
    })
  ),
  byFile: rows
};

console.log(JSON.stringify(report, null, 2));
console.error(
  `\nPrecisión global (6 campos R2): ${report.overallPrimary ?? "n/d"} · umbral 0.90 · ${
    report.meetsR2 ? "CUMPLE" : "NO CUMPLE (se reporta, no se promete)"
  }`
);
