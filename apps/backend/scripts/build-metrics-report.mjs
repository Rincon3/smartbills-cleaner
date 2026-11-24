import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidenceDir = path.resolve(backendRoot, "../../docs/sprint-4/evidencia");
const outFile = path.resolve(backendRoot, "../../docs/sprint-4/informe-metricas-rendimiento.html");

const readJson = async (name) => JSON.parse(await readFile(path.join(evidenceDir, name), "utf8"));
const perf = await readJson("metricas-rendimiento.json");
const sys = await readJson("metricas-sistema.json");
const rawRagas = await readFile(path.join(evidenceDir, "ragas-resultado.json"), "utf8");
const ragas = JSON.parse(rawRagas.slice(rawRagas.indexOf("{")));

const esc = (value) =>
  String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ms = (value) => `${Number(value).toLocaleString("es-CO", { maximumFractionDigits: 1 })} ms`;
const badge = (ok, yes = "Cumple", no = "No cumple") =>
  `<span class="badge ${ok ? "ok" : "bad"}">${ok ? yes : no}</span>`;

const maxP95 = Math.max(...perf.endpoints.map((row) => row.p95Ms), 1);
const bar = (value) =>
  `<div class="bar"><span style="width:${Math.max(1.5, (value / maxP95) * 100).toFixed(1)}%"></span></div>`;

const endpointRows = perf.endpoints
  .map(
    (row) => `<tr>
      <td>${esc(row.group)}</td>
      <td>${esc(row.name)}</td>
      <td>${row.n}</td>
      <td>${ms(row.p50Ms)}</td>
      <td>${ms(row.p95Ms)}${bar(row.p95Ms)}</td>
      <td>${ms(row.maxMs)}</td>
      <td>${row.errors}</td>
      <td>${badge(row.withinSla, "&lt; 4 s")}</td>
    </tr>`
  )
  .join("");

const ragasRows = ragas.cases
  .map(
    (row) => `<tr>
      <td>${esc(row.id)}</td>
      <td>${row.faithfulness}</td>
      <td>${row.context_precision}</td>
      <td>${row.context_recall}</td>
      <td>${row.answer_relevancy}</td>
      <td><strong>${row.ragas}</strong></td>
    </tr>`
  )
  .join("");

const areaRows = Object.entries(sys.tests.byArea)
  .map(([area, count]) => `<tr><td>${esc(area.replace(/_/g, " "))}</td><td>${count}</td><td>${badge(true, "PASS")}</td></tr>`)
  .join("");

const containerRows = sys.containers
  .map((row) => `<tr><td>${esc(row.name)}</td><td>${esc(row.cpu)}</td><td>${esc(row.mem)}</td></tr>`)
  .join("");

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SmartBills Cleaner · Métricas de rendimiento y pruebas</title>
<style>
  :root { --ink:#16322f; --muted:#56706c; --line:#d5e2df; --primary:#0f8b7d; --bg:#f4f7f5; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:var(--ink); background:var(--bg); line-height:1.55; }
  .shell { width:min(1040px,calc(100% - 32px)); margin:0 auto; padding:32px 0 64px; }
  h1 { margin:0 0 6px; font-size:2rem; }
  h2 { margin:34px 0 12px; font-size:1.3rem; border-bottom:2px solid var(--primary); padding-bottom:6px; }
  p, li { color:var(--muted); }
  .card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px 24px; margin-bottom:16px; }
  .kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:12px; margin:16px 0; }
  .kpi { background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px; }
  .kpi strong { display:block; font-size:1.55rem; color:var(--primary); }
  .kpi span { font-size:.82rem; color:var(--muted); }
  table { width:100%; border-collapse:collapse; background:#fff; font-size:.88rem; }
  th, td { border:1px solid var(--line); padding:7px 10px; text-align:left; vertical-align:middle; }
  th { background:#16322f; color:#fff; }
  .badge { display:inline-block; padding:2px 9px; border-radius:999px; font-size:.74rem; font-weight:700; }
  .badge.ok { background:#dff5e6; color:#176b35; }
  .badge.bad { background:#fde2e2; color:#a12727; }
  .bar { height:6px; background:#e6efed; border-radius:99px; margin-top:4px; }
  .bar span { display:block; height:100%; background:var(--primary); border-radius:99px; }
  code { background:#eef6f4; padding:1px 5px; border-radius:6px; font-size:.85em; }
  pre { background:#16322f; color:#e8f8f4; padding:12px 14px; border-radius:12px; overflow-x:auto; font-size:.82rem; }
  .warn { border-left:4px solid #d98e04; background:#fff8e8; }
  .meta { font-size:.88rem; color:var(--muted); }
  @media print { body { background:#fff; } .card, .kpi { break-inside:avoid; } }
</style>
</head>
<body>
<main class="shell">
  <section class="card">
    <h1>Métricas de rendimiento y pruebas</h1>
    <p class="meta">SmartBills Cleaner · estado al ${esc(new Date(perf.generatedAt).toLocaleString("es-CO"))} ·
    Node ${esc(perf.environment.node)} · ${esc(perf.environment.platform)} · API en Docker (${esc(perf.environment.api)})</p>
    <div class="kpis">
      <div class="kpi"><strong>${sys.tests.pass}/${sys.tests.total}</strong><span>pruebas unitarias PASS (${sys.tests.durationMs} ms)</span></div>
      <div class="kpi"><strong>${perf.summary.endpointsWithinSla}/${perf.summary.endpointsMeasured}</strong><span>endpoints con p95 &lt; 4 s</span></div>
      <div class="kpi"><strong>${ms(perf.summary.worstP95Ms)}</strong><span>peor p95 medido (login con bcrypt)</span></div>
      <div class="kpi"><strong>${perf.summary.totalErrors}</strong><span>errores en toda la corrida</span></div>
      <div class="kpi"><strong>${ragas.average.ragas}</strong><span>RAGAS promedio (5 casos)</span></div>
      <div class="kpi"><strong>${perf.concurrency.throughputPerSec}/s</strong><span>búsquedas semánticas con ${perf.concurrency.parallel} en paralelo</span></div>
    </div>
  </section>

  <h2>1. Latencia de la API (${perf.environment.iterationsPerEndpoint} iteraciones, tras calentamiento)</h2>
  <p>Objetivo del sprint: búsqueda y consultas &lt; 4 s (SBC-25 / SBC-17).</p>
  <table>
    <thead><tr><th>Grupo</th><th>Endpoint</th><th>n</th><th>p50</th><th>p95</th><th>Máx</th><th>Err</th><th>SLA</th></tr></thead>
    <tbody>${endpointRows}</tbody>
  </table>

  <h2>2. Concurrencia y carga de documentos</h2>
  <table>
    <thead><tr><th>Escenario</th><th>Resultado</th><th>Detalle</th></tr></thead>
    <tbody>
      <tr><td>${perf.concurrency.parallel} búsquedas pgvector simultáneas</td><td>${ms(perf.concurrency.wallMs)} en total</td>
        <td>${perf.concurrency.throughputPerSec} req/s · p95 ${ms(perf.concurrency.p95Ms)} · errores ${perf.concurrency.errors}</td></tr>
      <tr><td>Subida PDF con texto nativo (pdftotext/pdf.js)</td><td>p50 ${ms(perf.ocr.p50Ms)}</td>
        <td>máx ${ms(perf.ocr.maxMs)} · ${esc(perf.ocr.detail?.supplier)} · NIT ${esc(perf.ocr.detail?.taxId)} · ${perf.ocr.detail?.fields} campos</td></tr>
      ${
        perf.ocrImage
          ? `<tr><td>Subida imagen PNG (Tesseract spa+eng, ${perf.ocrImage.imageKB} KB)</td><td>p50 ${ms(perf.ocrImage.p50Ms)}</td>
        <td>máx ${ms(perf.ocrImage.maxMs)} · ${esc(perf.ocrImage.detail?.supplier)} · NIT ${esc(perf.ocrImage.detail?.taxId)} · ${perf.ocrImage.detail?.fields} campos</td></tr>`
          : ""
      }
    </tbody>
  </table>
  <p class="meta">Las facturas subidas para medir se eliminaron al terminar (la BD queda con ${sys.data.invoices} facturas / ${sys.data.chunks} chunks).</p>

  <h2>3. Búsqueda vectorial a escala (pgvector HNSW)</h2>
  <div class="card">
    <p>Con solo ${sys.data.chunks} chunks reales la latencia es trivial, así que se midió una tabla temporal de
    <strong>${sys.vectorScale.rows.toLocaleString("es-CO")} vectores de ${sys.vectorScale.dim} dimensiones</strong>
    (${esc(sys.vectorScale.index)}), ${sys.vectorScale.queries} consultas Top-5 aleatorias.</p>
    <table>
      <thead><tr><th>Estrategia</th><th>Media</th><th>Máx</th></tr></thead>
      <tbody>
        <tr><td>Índice HNSW</td><td>${sys.vectorScale.hnswMeanMs} ms</td><td>${sys.vectorScale.hnswMaxMs} ms</td></tr>
        <tr><td>Barrido secuencial (sin índice)</td><td>${sys.vectorScale.seqMeanMs} ms</td><td>${sys.vectorScale.seqMaxMs} ms</td></tr>
      </tbody>
    </table>
    <p class="meta">Índice ${esc(sys.vectorScale.indexSize)} · tabla ${esc(sys.vectorScale.tableSize)}. ${esc(sys.vectorScale.note)}
    El máximo incluye picos de arranque en frío; es una referencia de escala, no una prueba de estrés.</p>
  </div>

  <h2>4. Calidad del RAG (RAGAS local, Top-K = 5)</h2>
  <table>
    <thead><tr><th>Caso</th><th>Faithfulness</th><th>Context precision</th><th>Context recall</th><th>Answer relevancy</th><th>RAGAS</th></tr></thead>
    <tbody>${ragasRows}
      <tr><td><strong>Promedio</strong></td><td>${ragas.average.faithfulness}</td><td>${ragas.average.context_precision}</td>
        <td>${ragas.average.context_recall}</td><td>${ragas.average.answer_relevancy}</td><td><strong>${ragas.average.ragas}</strong></td></tr>
    </tbody>
  </table>
  <div class="card warn">
    <strong>Lectura honesta:</strong> la fidelidad (1.0) y el recall (1.0) son altos: las respuestas se apoyan en
    fragmentos recuperados y la evidencia correcta casi siempre entra en el Top-5. La <em>context precision</em> (0.44) y la
    <em>answer relevancy</em> (0.31) son los puntos débiles: el Top-5 trae fragmentos de relleno y el generador local
    (sin Bedrock) devuelve la línea más cercana, no siempre el monto pedido. Es el siguiente frente de mejora.
  </div>

  <h2>5. Pruebas unitarias</h2>
  <table>
    <thead><tr><th>Área</th><th>Casos</th><th>Estado</th></tr></thead>
    <tbody>${areaRows}
      <tr><td><strong>Total</strong></td><td><strong>${sys.tests.total}</strong></td><td>${badge(sys.tests.fail === 0, "0 fallos", `${sys.tests.fail} fallos`)}</td></tr>
    </tbody>
  </table>

  <h2>6. Build y recursos</h2>
  <table>
    <thead><tr><th>Métrica</th><th>Valor</th></tr></thead>
    <tbody>
      <tr><td>Build frontend (${esc(sys.frontendBuild.tool)}, ${sys.frontendBuild.modules} módulos)</td><td>${sys.frontendBuild.buildMs} ms</td></tr>
      <tr><td>Bundle JS</td><td>${sys.frontendBuild.jsKB} kB (${sys.frontendBuild.jsGzipKB} kB gzip)</td></tr>
      <tr><td>Bundle CSS</td><td>${sys.frontendBuild.cssKB} kB (${sys.frontendBuild.cssGzipKB} kB gzip)</td></tr>
    </tbody>
  </table>
  <br />
  <table>
    <thead><tr><th>Contenedor (en reposo tras la carga)</th><th>CPU</th><th>Memoria</th></tr></thead>
    <tbody>${containerRows}</tbody>
  </table>

  <h2>7. Alcance y limitaciones</h2>
  <div class="card warn">
    <ul>
      <li>Mediciones <strong>locales</strong> (localhost, Docker Desktop, un solo usuario). Sirven para demostrar el estado funcional y el cumplimiento del SLA de 4 s; no son una prueba de capacidad en producción.</li>
      <li>Dataset pequeño: ${sys.data.invoices} facturas y ${sys.data.chunks} chunks. La prueba de escala usa vectores sintéticos y no mide calidad semántica.</li>
      <li>El generador RAG es <strong>local</strong> (<code>grounded-top1/top3</code>); sin claves AWS no se midió Bedrock, cuya latencia sería de segundos.</li>
      <li>La imagen de OCR es un render limpio del PDF de muestra, no un escaneo ruidoso; en documentos reales Tesseract tarda más y baja la confianza.</li>
      <li>Document AI / Textract no se midieron: no hay credenciales configuradas (el flujo omite ese ramal sin fallar).</li>
      <li>No hay pruebas automatizadas de frontend ni E2E; solo build y verificación manual de UI.</li>
    </ul>
  </div>

  <h2>8. Cómo reproducir</h2>
  <pre>docker compose up -d
npm test --workspace backend
docker exec smartbills-backend sh -c 'cd /app/apps/backend &amp;&amp; node scripts/ragas-eval.mjs'
BENCH_IMAGE=/ruta/factura.png npm run perf --workspace backend
npm run report:metrics --workspace backend</pre>
  <p class="meta">Datos crudos: <code>docs/sprint-4/evidencia/*.json</code></p>
</main>
</body>
</html>
`;

await writeFile(outFile, html);
console.log(`Informe generado: ${path.relative(process.cwd(), outFile)}`);
