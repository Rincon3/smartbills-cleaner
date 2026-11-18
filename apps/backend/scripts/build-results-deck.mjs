import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidenceDir = path.resolve(backendRoot, "../../docs/sprint-4/evidencia");
const outFile = path.resolve(backendRoot, "../../docs/sprint-4/presentacion-resultados.html");

const readJson = async (name) => JSON.parse(await readFile(path.join(evidenceDir, name), "utf8"));
const perf = await readJson("metricas-rendimiento.json");
const sys = await readJson("metricas-sistema.json");
const rawRagas = await readFile(path.join(evidenceDir, "ragas-resultado.json"), "utf8");
const ragas = JSON.parse(rawRagas.slice(rawRagas.indexOf("{")));

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmt = (v) => Number(v).toLocaleString("es-CO", { maximumFractionDigits: 1 });
const fmt2 = (v) => Number(v).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SLA = perf.environment.slaMs;

const rest = perf.endpoints.filter((row) => row.group !== "RAG" && row.group !== "Auth");
const rag = perf.endpoints.filter((row) => row.group === "RAG");
const login = perf.endpoints.find((row) => row.group === "Auth");
const ragP95 = Math.max(...rag.map((row) => row.p95Ms));
const restP95 = Math.max(...rest.map((row) => row.p95Ms));

const latencyAll = [...rest, ...rag, login];
const latencyMax = Math.max(...latencyAll.map((row) => row.p95Ms));
const latencyRows = latencyAll
  .map((row) => {
    const pct = Math.max(1.5, (row.p95Ms / latencyMax) * 100);
    const times = Math.round(SLA / row.p95Ms);
    return `<div class="lat">
      <span class="lat-name" title="${esc(row.name)}">${esc(row.name)}</span>
      <div class="lat-track"><i style="width:${pct.toFixed(2)}%"></i></div>
      <span class="lat-val">${fmt(row.p95Ms)} ms</span>
      <span class="lat-x">${times}× bajo SLA</span>
    </div>`;
  })
  .join("");

const areaBars = Object.entries(sys.tests.byArea)
  .map(([area, n]) => {
    const pct = (n / Math.max(...Object.values(sys.tests.byArea))) * 100;
    return `<div class="lat"><span class="lat-name">${esc(area.replace(/_/g, " "))}</span>
      <div class="lat-track"><i class="g" style="width:${pct}%"></i></div><span class="lat-val">${n} PASS</span></div>`;
  })
  .join("");

const metric = (label, value, note) => {
  const weak = value < 0.5;
  return `<div class="gauge ${weak ? "weak" : ""}">
    <div class="ring" style="--p:${Math.round(value * 100)}"><b>${value}</b></div>
    <strong>${label}</strong><small>${note}</small></div>`;
};

const ragasCases = ragas.cases
  .map((c) => `<tr><td>${esc(c.id)}</td><td>${c.context_precision}</td><td>${c.answer_relevancy}</td><td><b>${c.ragas}</b></td></tr>`)
  .join("");

const slides = [
  `<section class="slide cover">
    <p class="tag">Sprint 4 · Resultados</p>
    <h1>SmartBills Cleaner<br/>estado actual medido</h1>
    <p class="sub">Pruebas, rendimiento y calidad del RAG sobre la API real en Docker</p>
    <div class="kpis">
      <div class="kpi"><b>${sys.tests.pass}/${sys.tests.total}</b><span>pruebas unitarias</span></div>
      <div class="kpi"><b>${perf.summary.endpointsWithinSla}/${perf.summary.endpointsMeasured}</b><span>endpoints &lt; 4 s</span></div>
      <div class="kpi"><b>${fmt(perf.summary.worstP95Ms)} ms</b><span>peor p95</span></div>
      <div class="kpi"><b>${ragas.average.ragas}</b><span>RAGAS promedio</span></div>
    </div>
    <p class="foot">${esc(new Date(perf.generatedAt).toLocaleDateString("es-CO", { dateStyle: "long" }))} · Node ${esc(perf.environment.node)}</p>
  </section>`,

  `<section class="slide">
    <h2>Qué se midió y cómo</h2>
    <div class="grid3">
      <div class="card"><h3>Entorno</h3><p>Docker Compose: API Express, PostgreSQL 15 + pgvector, frontend Vite. Un usuario, <code>localhost</code>.</p></div>
      <div class="card"><h3>Datos</h3><p>${sys.data.invoices} facturas, ${sys.data.chunks} chunks, embeddings <code>${esc(sys.data.embeddingModel)}</code> de ${sys.data.dim} dimensiones.</p></div>
      <div class="card"><h3>Método</h3><p>${perf.environment.iterationsPerEndpoint} iteraciones por endpoint tras calentamiento; p50, p95 y máximo. SLA del sprint: &lt; ${SLA / 1000} s.</p></div>
    </div>
    <p class="note">Las facturas subidas para medir OCR se eliminaron; la tabla de escala vectorial fue temporal.</p>
  </section>`,

  `<section class="slide">
    <h2>Pruebas unitarias: ${sys.tests.pass}/${sys.tests.total} en ${sys.tests.durationMs} ms</h2>
    <div class="chart">${areaBars}</div>
    <p class="note">Cubren OCR y extracción de campos colombianos, citas, búsqueda híbrida, pgvector, prompt, consenso y métricas RAGAS. Sin pruebas E2E ni de frontend todavía.</p>
  </section>`,

  `<section class="slide">
    <h2>Latencia de la API (p95)</h2>
    <p class="sub">SLA del sprint: ${SLA} ms. El peor p95 usa solo el ${fmt((perf.summary.worstP95Ms / SLA) * 100)} % del límite (barras relativas al endpoint más lento).</p>
    <div class="chart">${latencyRows}</div>
    <p class="note">Listado, búsquedas y consultas RAG: p95 de ${fmt(Math.min(...[...rest, ...rag].map((r) => r.p95Ms)))}–${fmt(Math.max(restP95, ragP95))} ms. El login es el más lento por el hash bcrypt.</p>
  </section>`,

  `<section class="slide">
    <h2>Escala, concurrencia y OCR</h2>
    <div class="grid3">
      <div class="card"><h3>pgvector HNSW</h3>
        <p class="big">${fmt2(sys.vectorScale.hnswMeanMs)} ms</p>
        <p>media con ${sys.vectorScale.rows.toLocaleString("es-CO")} vectores. Sin índice: ${fmt2(sys.vectorScale.seqMeanMs)} ms.</p></div>
      <div class="card"><h3>${perf.concurrency.parallel} en paralelo</h3>
        <p class="big">${fmt(perf.concurrency.throughputPerSec)}/s</p>
        <p>búsquedas semánticas, p95 ${fmt(perf.concurrency.p95Ms)} ms, ${perf.concurrency.errors} errores.</p></div>
      <div class="card"><h3>OCR</h3>
        <p class="big">${fmt(perf.ocr.p50Ms)} / ${perf.ocrImage ? fmt(perf.ocrImage.p50Ms) : "—"} ms</p>
        <p>PDF nativo / imagen con Tesseract. Extrae ${esc(perf.ocr.detail?.supplier)} y NIT ${esc(perf.ocr.detail?.taxId)}.</p></div>
    </div>
    <p class="note">Vectores sintéticos para la prueba de escala; la imagen OCR es un render limpio, no un escaneo ruidoso.</p>
  </section>`,

  `<section class="slide">
    <h2>Calidad del RAG (RAGAS local, Top-${5})</h2>
    <div class="gauges">
      ${metric("Faithfulness", ragas.average.faithfulness, "respuestas apoyadas en citas")}
      ${metric("Context recall", ragas.average.context_recall, "la evidencia correcta entra")}
      ${metric("Context precision", ragas.average.context_precision, "hay fragmentos de relleno")}
      ${metric("Answer relevancy", ragas.average.answer_relevancy, "no siempre da el monto")}
    </div>
    <table><thead><tr><th>Caso</th><th>Precision</th><th>Relevancy</th><th>RAGAS</th></tr></thead><tbody>${ragasCases}</tbody></table>
  </section>`,

  `<section class="slide">
    <h2>Conclusión y siguientes pasos</h2>
    <div class="grid2">
      <div class="card good"><h3>Lo que está demostrado</h3>
        <ul><li>Flujo completo funcional: carga, OCR, indexación vectorial, búsqueda híbrida y consultas con citas.</li>
        <li>Todas las pruebas pasan y el SLA de 4 s se cumple con amplio margen.</li>
        <li>Sin claves de nube nada se rompe: cae a OCR y generación locales.</li>
        <li>Sin evidencia, el sistema lo dice (caso Madrid).</li></ul></div>
      <div class="card warnc"><h3>Lo que falta</h3>
        <ul><li>Subir precision y relevancy: reordenar el Top-5 y probar generación con Bedrock.</li>
        <li>Medir con más datos reales y escaneos ruidosos.</li>
        <li>Medir Document AI / Textract con credenciales.</li>
        <li>Pruebas E2E de frontend.</li></ul></div>
    </div>
  </section>`
].join("\n");

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SmartBills Cleaner · Resultados Sprint 4</title>
<style>
  :root { --bg:#f4f7f5; --ink:#16322f; --muted:#56706c; --line:#d5e2df; --primary:#0f8b7d; --soft:#dff5f1; --accent:#f59f00; --warn:#fff3d6; --good:#e7f8eb; }
  * { box-sizing:border-box; }
  html, body { margin:0; height:100%; background:var(--bg); color:var(--ink); font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; }
  .deck { height:100vh; overflow:hidden; position:relative; }
  .slide { position:absolute; inset:0; padding:48px clamp(24px,6vw,96px) 72px; display:none; flex-direction:column; justify-content:center; gap:14px; animation:in .25s ease; }
  .slide.active { display:flex; }
  @keyframes in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  h1 { font-size:clamp(2rem,5vw,3.4rem); line-height:1.1; margin:0; }
  h2 { font-size:clamp(1.5rem,3vw,2.2rem); margin:0; }
  h3 { margin:0 0 6px; font-size:1.05rem; }
  p, li { color:var(--muted); font-size:1.02rem; line-height:1.5; margin:0; }
  .tag { display:inline-block; align-self:flex-start; background:var(--soft); color:var(--primary); font-weight:700; font-size:.8rem; padding:4px 12px; border-radius:99px; }
  .sub { font-size:1.1rem; }
  .note { font-size:.9rem; border-left:3px solid var(--accent); padding-left:12px; }
  .foot { font-size:.85rem; margin-top:12px; }
  .kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; margin-top:18px; }
  .kpi { background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px; }
  .kpi b { display:block; font-size:2rem; color:var(--primary); }
  .kpi span { font-size:.85rem; color:var(--muted); }
  .grid3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:14px; }
  .grid2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:16px; }
  .card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px; }
  .card.good { background:var(--good); } .card.warnc { background:var(--warn); }
  .card ul { margin:6px 0 0; padding-left:18px; display:grid; gap:6px; }
  .big { font-size:2.1rem; font-weight:800; color:var(--primary); margin:4px 0; }
  code { background:#eef6f4; padding:1px 6px; border-radius:6px; font-size:.88em; }
  .chart { display:grid; gap:7px; }
  .lat { display:grid; grid-template-columns:minmax(220px,42%) 1fr 78px 108px; gap:12px; align-items:center; font-size:.88rem; }
  .lat-x { font-size:.76rem; color:var(--muted); text-align:right; }
  .lat-name { color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lat-track { height:14px; background:#e6efed; border-radius:99px; overflow:hidden; }
  .lat-track i { display:block; height:100%; background:var(--primary); border-radius:99px; }
  .lat-track i.g { background:#2f9e5a; }
  .lat-val { text-align:right; font-weight:700; color:var(--ink); }
  .gauges { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; }
  .gauge { background:#fff; border:1px solid var(--line); border-radius:16px; padding:16px; text-align:center; display:grid; gap:6px; justify-items:center; }
  .ring { --c:var(--primary); width:96px; height:96px; border-radius:50%; display:grid; place-items:center;
    background:conic-gradient(var(--c) calc(var(--p) * 1%), #e6efed 0); }
  .gauge.weak .ring { --c:#d98e04; }
  .ring b { width:74px; height:74px; border-radius:50%; background:#fff; display:grid; place-items:center; font-size:1.15rem; }
  .gauge small { color:var(--muted); font-size:.78rem; }
  table { width:100%; border-collapse:collapse; background:#fff; font-size:.88rem; }
  th, td { border:1px solid var(--line); padding:7px 10px; text-align:left; }
  th { background:var(--ink); color:#fff; }
  .nav { position:fixed; left:0; right:0; bottom:0; display:flex; align-items:center; gap:12px; padding:12px clamp(24px,6vw,96px); background:#fff; border-top:1px solid var(--line); }
  .nav button { border:1px solid var(--line); background:var(--soft); color:var(--primary); font-weight:700; border-radius:10px; padding:8px 16px; cursor:pointer; }
  .nav button:disabled { opacity:.4; cursor:default; }
  .bar { flex:1; height:6px; background:#e6efed; border-radius:99px; overflow:hidden; }
  .bar i { display:block; height:100%; width:0; background:var(--primary); transition:width .25s; }
  .count { font-size:.85rem; color:var(--muted); min-width:48px; text-align:right; }
  @media print {
    .deck { height:auto; overflow:visible; } .nav { display:none; }
    .slide { position:static; display:flex !important; min-height:100vh; page-break-after:always; animation:none; }
  }
</style>
</head>
<body>
<div class="deck" id="deck">
${slides}
</div>
<nav class="nav">
  <button id="prev">← Anterior</button>
  <div class="bar"><i id="progress"></i></div>
  <span class="count" id="count"></span>
  <button id="next">Siguiente →</button>
</nav>
<script>
  const slides = [...document.querySelectorAll(".slide")];
  let current = Number(location.hash.replace("#", "")) - 1 || 0;
  const show = (i) => {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, n) => s.classList.toggle("active", n === current));
    document.getElementById("progress").style.width = ((current + 1) / slides.length) * 100 + "%";
    document.getElementById("count").textContent = current + 1 + " / " + slides.length;
    document.getElementById("prev").disabled = current === 0;
    document.getElementById("next").disabled = current === slides.length - 1;
    history.replaceState(null, "", "#" + (current + 1));
  };
  document.getElementById("prev").onclick = () => show(current - 1);
  document.getElementById("next").onclick = () => show(current + 1);
  document.addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(current + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(current - 1); }
    if (e.key === "Home") show(0);
    if (e.key === "End") show(slides.length - 1);
  });
  show(current);
</script>
</body>
</html>
`;

await writeFile(outFile, html);
console.log(`Presentación generada: ${path.relative(process.cwd(), outFile)}`);
