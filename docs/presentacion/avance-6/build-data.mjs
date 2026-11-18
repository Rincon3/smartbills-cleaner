#!/usr/bin/env node
/**
 * Lee CSV/JSON de evidencia y emite constantes para presentacion.html.
 * No lee valores de facturas (NIT, montos, nombres) hacia el HTML.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const HERE = dirname(fileURLToPath(import.meta.url));

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        quoted = !quoted;
      } else if (ch === "," && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

function rankNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const rankingCsv = readFileSync(resolve(ROOT, "docs/sprint-5/eval/queries-hash-vs-titan.csv"), "utf8");
const ranking = parseCsv(rankingCsv).map((row) => ({
  id: row.id,
  q: row.question,
  target: row.target_code === "(ninguno)" ? null : row.target_code,
  hash: rankNumber(row.hash_rank_target),
  titan: rankNumber(row.titan_rank_target)
}));

const ocrJson = execFileSync(
  process.execPath,
  [
    resolve(ROOT, "docs/sprint-5/eval/compare-ocr.mjs"),
    resolve(ROOT, "docs/sprint-5/eval/ocr-gold.csv"),
    resolve(ROOT, "docs/sprint-5/eval/ocr-pred.csv")
  ],
  { encoding: "utf8", cwd: ROOT }
);
const ocrReport = JSON.parse(ocrJson);
const fieldOrder = ["supplier", "nit", "issue_date", "subtotal", "vat", "total"];
const ocr = {
  global: ocrReport.overallPrimary,
  labeled: fieldOrder.reduce((sum, field) => sum + ocrReport.byField[field].labeled, 0),
  correct: fieldOrder.reduce((sum, field) => sum + ocrReport.byField[field].correct, 0),
  files: ocrReport.files,
  missingPredictions: ocrReport.missingPredictions,
  meetsR2: ocrReport.meetsR2,
  fields: fieldOrder.map((field) => ({
    key: field,
    label: ocrReport.byField[field].label,
    labeled: ocrReport.byField[field].labeled,
    correct: ocrReport.byField[field].correct,
    acc: ocrReport.byField[field].acc
  }))
};

const antes = JSON.parse(readFileSync(resolve(ROOT, "docs/sprint-5/eval/ragas-antes.json"), "utf8"));
const despues = JSON.parse(readFileSync(resolve(ROOT, "docs/sprint-5/eval/ragas-despues.json"), "utf8"));
const ragas = {
  metrics: ["faithfulness", "context_precision", "context_recall", "answer_relevancy", "ragas"],
  labels: ["Faithfulness", "Context precision", "Context recall", "Answer relevancy", "RAGAS"],
  antes: {
    faithfulness: antes.average.faithfulness,
    context_precision: antes.average.context_precision,
    context_recall: antes.average.context_recall,
    answer_relevancy: antes.average.answer_relevancy,
    ragas: antes.average.ragas,
    provider: antes.cases[0]?.consensus?.provider ?? "local"
  },
  despues: {
    faithfulness: despues.average.faithfulness,
    context_precision: despues.average.context_precision,
    context_recall: despues.average.context_recall,
    answer_relevancy: despues.average.answer_relevancy,
    ragas: despues.average.ragas,
    provider: despues.cases[0]?.consensus?.provider ?? "local"
  }
};

const CHARTS = { ranking, ocr, ragas };
const json = JSON.stringify(CHARTS, null, 2);
writeFileSync(resolve(HERE, "charts-data.json"), json);

const htmlPath = resolve(HERE, "presentacion.html");
try {
  const html = readFileSync(htmlPath, "utf8");
  const start = html.indexOf("/* CHARTS_START */");
  const end = html.indexOf("/* CHARTS_END */");
  if (start !== -1 && end !== -1 && end > start) {
    const next = `${html.slice(0, start)}/* CHARTS_START */\nconst CHARTS = ${json};\n/* CHARTS_END */${html.slice(end + "/* CHARTS_END */".length)}`;
    writeFileSync(htmlPath, next);
    console.error("Inyectado en presentacion.html");
  } else {
    console.error("presentacion.html sin marcadores CHARTS_START/END; solo charts-data.json");
  }
} catch {
  console.error("presentacion.html aún no existe; escrito charts-data.json");
}

console.error("OCR global", ocr.global, "NIT", ocr.fields.find((f) => f.key === "nit").acc, "total", ocr.fields.find((f) => f.key === "total").acc);
console.error("RAGAS", ragas.antes.ragas, "→", ragas.despues.ragas);
console.error("Ranking filas", ranking.length, "Q01", ranking[0]);
