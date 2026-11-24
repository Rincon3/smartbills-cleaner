import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(backendRoot, "../../docs/sprint-4/evidencia");
const API = process.env.BENCH_API_URL || "http://localhost:4000/api";
const ITERATIONS = Number(process.env.BENCH_ITERATIONS || 20);
const OCR_RUNS = Number(process.env.BENCH_OCR_RUNS || 3);
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY || 10);
const SLA_MS = 4000;

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function stats(samples, errors = 0) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const round = (value) => Number(value.toFixed(1));
  return {
    n: sorted.length,
    errors,
    minMs: round(sorted[0] ?? 0),
    meanMs: round(sorted.length ? sum / sorted.length : 0),
    p50Ms: round(percentile(sorted, 50)),
    p95Ms: round(percentile(sorted, 95)),
    maxMs: round(sorted[sorted.length - 1] ?? 0),
    withinSla: sorted.length > 0 && percentile(sorted, 95) < SLA_MS
  };
}

let token = "";

async function call(method, route, body, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const started = performance.now();
  const response = await fetch(`${API}${route}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const elapsed = performance.now() - started;
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { ok: response.ok, status: response.status, elapsed, data };
}

async function measure(name, fn, iterations = ITERATIONS) {
  const samples = [];
  let errors = 0;
  let detail = null;

  await fn().catch(() => null); // warm-up, no cuenta

  for (let i = 0; i < iterations; i += 1) {
    try {
      const result = await fn();
      if (!result.ok) {
        errors += 1;
      } else {
        samples.push(result.elapsed);
        detail = detail || result.data;
      }
    } catch {
      errors += 1;
    }
  }

  console.log(`  ${name.padEnd(46)} p50=${stats(samples, errors).p50Ms}ms p95=${stats(samples, errors).p95Ms}ms err=${errors}`);
  return { name, ...stats(samples, errors), sample: detail };
}

async function main() {
  const startedAt = new Date();
  console.log(`Benchmark contra ${API} (${ITERATIONS} iteraciones por endpoint)\n`);

  const login = await call("POST", "/auth/login", {
    email: process.env.BENCH_EMAIL || "admin@smartbills.local",
    password: process.env.BENCH_PASSWORD || "Admin123!"
  });
  if (!login.ok) {
    throw new Error(`Login falló (${login.status}). ¿Está arriba el backend y el seed?`);
  }
  token = login.data.token;

  const endpoints = [];

  console.log("Endpoints REST");
  const loginStats = await measure("POST /auth/login", () =>
    call("POST", "/auth/login", { email: "admin@smartbills.local", password: "Admin123!" })
  );
  endpoints.push({ group: "Auth", ...loginStats });

  endpoints.push({ group: "Facturas", ...(await measure("GET /invoices (listado)", () => call("GET", "/invoices"))) });
  endpoints.push({
    group: "Facturas",
    ...(await measure("GET /dashboard/summary", () => call("GET", "/dashboard/summary")))
  });
  endpoints.push({
    group: "Búsqueda",
    ...(await measure("GET /invoices/search (solo filtros SQL)", () =>
      call("GET", "/invoices/search?supplier=Enel&minTotal=1000")
    ))
  });
  endpoints.push({
    group: "Búsqueda",
    ...(await measure("GET /invoices/search (texto + pgvector)", () =>
      call("GET", `/invoices/search?q=${encodeURIComponent("energia electrica Enel")}`)
    ))
  });
  endpoints.push({
    group: "Búsqueda",
    ...(await measure("GET /invoices/search (híbrida: filtros + texto)", () =>
      call("GET", `/invoices/search?q=${encodeURIComponent("telefonia plan")}&minTotal=1000&from=2020-01-01`)
    ))
  });

  console.log("\nConsultas RAG (POST /query)");
  const questions = [
    "Cuanto pague de energia electrica con Enel?",
    "Cual es el NIT de Aguas de la Sabana?",
    "Hay alguna factura de papeleria o utiles de oficina?",
    "Cuanto cuesta el plan de telefonia de Claro?",
    "Cual es el canon de arriendo de un local en Madrid?"
  ];
  const ragRows = [];
  for (const question of questions) {
    const row = await measure(`RAG: ${question.slice(0, 38)}…`, () => call("POST", "/query", { question }), 10);
    ragRows.push({
      group: "RAG",
      ...row,
      noEvidence: row.sample?.noEvidence ?? null,
      citations: row.sample?.citations?.length ?? 0,
      consensus: row.sample?.consensus?.selected ?? null
    });
  }
  endpoints.push(...ragRows);

  console.log(`\nConcurrencia (${CONCURRENCY} búsquedas semánticas simultáneas)`);
  const concurrentSamples = [];
  let concurrentErrors = 0;
  const wallStart = performance.now();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      const result = await call("GET", `/invoices/search?q=${encodeURIComponent("factura energia")}`);
      if (result.ok) concurrentSamples.push(result.elapsed);
      else concurrentErrors += 1;
    })
  );
  const wallMs = performance.now() - wallStart;
  const concurrency = {
    parallel: CONCURRENCY,
    wallMs: Number(wallMs.toFixed(1)),
    throughputPerSec: Number((CONCURRENCY / (wallMs / 1000)).toFixed(1)),
    ...stats(concurrentSamples, concurrentErrors)
  };
  console.log(`  wall=${concurrency.wallMs}ms throughput=${concurrency.throughputPerSec}/s p95=${concurrency.p95Ms}ms`);

  console.log(`\nOCR / carga de documento (${OCR_RUNS} subidas del PDF de muestra)`);
  const pdfPath = path.join(backendRoot, "src/services/ocr/fixtures/sample-invoice.pdf");
  const pdfBuffer = await readFile(pdfPath);
  const ocrSamples = [];
  let ocrErrors = 0;
  let ocrDetail = null;
  const createdIds = [];

  for (let i = 0; i < OCR_RUNS; i += 1) {
    const form = new FormData();
    form.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), `bench-${Date.now()}-${i}.pdf`);
    const result = await call("POST", "/invoices/upload", form);
    if (result.ok) {
      ocrSamples.push(result.elapsed);
      createdIds.push(result.data.id);
      ocrDetail = ocrDetail || {
        pageCount: result.data.pageCount,
        status: result.data.status,
        supplier: result.data.supplier,
        taxId: result.data.taxId,
        total: result.data.total,
        fields: result.data.fields?.length ?? 0
      };
    } else {
      ocrErrors += 1;
    }
  }

  const ocr = { ...stats(ocrSamples, ocrErrors), detail: ocrDetail };
  console.log(`  p50=${ocr.p50Ms}ms max=${ocr.maxMs}ms err=${ocrErrors}`);

  let cleaned = 0;
  for (const id of createdIds) {
    const removed = await call("DELETE", `/invoices/${id}`);
    if (removed.ok || removed.status === 204) cleaned += 1;
  }
  console.log(`  limpieza: ${cleaned}/${createdIds.length} facturas de prueba eliminadas`);

  // OCR por imagen (Tesseract): costo real cuando no hay texto nativo en el PDF.
  let ocrImage = null;
  if (process.env.BENCH_IMAGE) {
    console.log(`\nOCR sobre imagen escaneada (Tesseract) — ${process.env.BENCH_IMAGE}`);
    const imageBuffer = await readFile(process.env.BENCH_IMAGE);
    const imageSamples = [];
    let imageErrors = 0;
    let imageDetail = null;
    const imageIds = [];
    const runs = Number(process.env.BENCH_IMAGE_RUNS || 3);

    for (let i = 0; i < runs; i += 1) {
      const form = new FormData();
      form.append("file", new Blob([imageBuffer], { type: "image/png" }), `bench-img-${Date.now()}-${i}.png`);
      const result = await call("POST", "/invoices/upload", form);
      if (result.ok) {
        imageSamples.push(result.elapsed);
        imageIds.push(result.data.id);
        imageDetail = imageDetail || {
          status: result.data.status,
          supplier: result.data.supplier,
          taxId: result.data.taxId,
          total: result.data.total,
          fields: result.data.fields?.length ?? 0,
          confidence: result.data.ocrAverageConfidence ?? null
        };
      } else {
        imageErrors += 1;
      }
    }

    for (const id of imageIds) {
      await call("DELETE", `/invoices/${id}`);
    }
    ocrImage = { ...stats(imageSamples, imageErrors), imageKB: Math.round(imageBuffer.length / 1024), detail: imageDetail };
    console.log(`  p50=${ocrImage.p50Ms}ms max=${ocrImage.maxMs}ms err=${imageErrors} (${ocrImage.imageKB} KB)`);
  }

  const allSamples = endpoints.filter((row) => row.group !== "Auth" || true);
  const result = {
    generatedAt: new Date().toISOString(),
    durationSec: Number(((Date.now() - startedAt.getTime()) / 1000).toFixed(1)),
    environment: {
      api: API,
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      iterationsPerEndpoint: ITERATIONS,
      slaMs: SLA_MS
    },
    summary: {
      endpointsMeasured: allSamples.length,
      endpointsWithinSla: allSamples.filter((row) => row.withinSla).length,
      totalErrors: allSamples.reduce((acc, row) => acc + row.errors, 0) + ocrErrors + concurrentErrors,
      worstP95Ms: Math.max(...allSamples.map((row) => row.p95Ms))
    },
    endpoints: allSamples.map(({ sample, ...rest }) => rest),
    concurrency,
    ocr,
    ocrImage
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "metricas-rendimiento.json"), JSON.stringify(result, null, 2));
  console.log(`\nGuardado en docs/sprint-4/evidencia/metricas-rendimiento.json`);
  console.log(
    `Resumen: ${result.summary.endpointsWithinSla}/${result.summary.endpointsMeasured} endpoints con p95 < ${SLA_MS} ms · errores: ${result.summary.totalErrors}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
