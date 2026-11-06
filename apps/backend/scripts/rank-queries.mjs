import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { searchInvoicesHybrid } from "../src/services/invoiceSearchService.js";
import { prisma } from "../src/config/prisma.js";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), "../../.env") });

const side = process.argv[2] === "titan" ? "titan" : "hash";
if (side === "hash") {
  process.env.EMBEDDING_BASELINE = "hash";
}
const csvPath = resolve(
  process.cwd(),
  process.argv[3] || "../../docs/sprint-5/eval/queries-hash-vs-titan.csv"
);

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
  return out;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const raw = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const lines = raw.trim().split(/\r?\n/);
const headers = splitRow(lines[0]);
const rows = lines.slice(1).map((line) => {
  const cells = splitRow(line);
  return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
});

for (const row of rows) {
  const result = await searchInvoicesHybrid({ q: row.question });
  const codes = (result.invoices || [])
    .filter((invoice) => invoice.score != null)
    .map((invoice) => invoice.code);
  const top3 = codes.slice(0, 3).join("|");
  const top5 = codes.slice(0, 5).join("|");
  const target = row.target_code;
  const rank =
    !target || target === "(ninguno)"
      ? codes[0] || "vacio"
      : codes.indexOf(target) === -1
        ? "no aparece"
        : String(codes.indexOf(target) + 1);

  if (side === "hash") {
    row.hash_top3 = top3;
    row.hash_top5 = top5;
    row.hash_rank_target = rank;
  } else {
    row.titan_top3 = top3;
    row.titan_top5 = top5;
    row.titan_rank_target = rank;
  }

  console.error(`${row.id} mode=${result.mode} rank=${rank} top3=${top3}`);
}

const out = [
  headers.join(","),
  ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
].join("\n");

writeFileSync(csvPath, `${out}\n`);
await prisma.$disconnect();
