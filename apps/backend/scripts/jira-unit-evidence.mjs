import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { run } from "node:test";
import { spec } from "node:test/reporters";
import { finished } from "node:stream/promises";
import { Transform } from "node:stream";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidenceDir = path.resolve(backendRoot, "../../docs/evidencia-jira");
const startedAt = new Date();

const files = [
  path.join(backendRoot, "src/services/ocr/extractInvoiceFields.test.js"),
  path.join(backendRoot, "src/services/ocr/ocrEngine.test.js"),
  path.join(backendRoot, "src/services/ocr/processInvoiceDocument.test.js"),
  path.join(backendRoot, "src/services/invoiceDocument.test.js")
];

const results = [];
let passed = 0;
let failed = 0;

const collector = new Transform({
  objectMode: true,
  transform(event, _enc, callback) {
    if (event.type === "test:pass") {
      passed += 1;
      results.push({
        name: event.data.name,
        file: event.data.file,
        status: "PASS",
        durationMs: event.data.details?.duration_ms
      });
    }

    if (event.type === "test:fail") {
      failed += 1;
      results.push({
        name: event.data.name,
        file: event.data.file,
        status: "FAIL",
        error: event.data.details?.error?.message || "Fallo"
      });
    }

    callback(null, event);
  }
});

const stream = run({ files, timeout: 60000 })
  .compose(collector)
  .compose(new spec());

stream.pipe(process.stdout);
await finished(stream);

const endedAt = new Date();
const payload = {
  story: "Visualizar/eliminar documentos + OCR real de facturas PDF",
  executedAt: startedAt.toISOString(),
  finishedAt: endedAt.toISOString(),
  environment: process.platform,
  node: process.version,
  totals: { passed, failed, total: passed + failed },
  result: failed === 0 ? "PASSED" : "FAILED",
  tests: results
};

await mkdir(evidenceDir, { recursive: true });
await writeFile(path.join(evidenceDir, "resultado-unitarias.json"), JSON.stringify(payload, null, 2));

const rows = results
  .map(
    (testCase) => `<tr class="${testCase.status.toLowerCase()}">
      <td>${testCase.status}</td>
      <td>${testCase.name}</td>
      <td>${path.basename(testCase.file || "")}</td>
      <td>${testCase.durationMs ? `${Number(testCase.durationMs).toFixed(1)} ms` : "-"}</td>
    </tr>`
  )
  .join("");

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Evidencia Jira - pruebas unitarias SmartBills</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; background: #f8fafc; }
    h1 { margin-bottom: 8px; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-weight: 700; }
    .ok { background: #dcfce7; color: #166534; }
    .ko { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background: #0f172a; color: #fff; }
    tr.pass td:first-child { color: #166534; font-weight: 700; }
    tr.fail td:first-child { color: #991b1b; font-weight: 700; }
    .meta { margin: 16px 0 24px; }
  </style>
</head>
<body>
  <p>SmartBills Cleaner · evidencia para Jira</p>
  <h1>Pruebas unitarias OCR e identificacion de facturas</h1>
  <p class="badge ${failed === 0 ? "ok" : "ko"}">${payload.result}: ${passed}/${payload.totals.total} pasaron</p>
  <div class="meta">
    <div>Historia: ${payload.story}</div>
    <div>Ejecutado: ${payload.executedAt}</div>
    <div>Node: ${payload.node} · ${payload.environment}</div>
  </div>
  <table>
    <thead>
      <tr><th>Estado</th><th>Caso</th><th>Archivo</th><th>Duracion</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

await writeFile(path.join(evidenceDir, "reporte-pruebas-unitarias.html"), html);

if (failed > 0) {
  process.exitCode = 1;
}
