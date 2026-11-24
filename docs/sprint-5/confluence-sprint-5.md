# Sprint 5 — SmartBills Cleaner (DOC-01 / SBC-67)

Página para pegar en Confluence. Rama `feature/s4-metricas`. Repo: https://github.com/Rincon3/smartbills-cleaner  
Calendario del plan: 9–29 nov 2026 (**por confirmar** en Jira). Commits de producto: 2026-11-06.  
Claves **por confirmar** si el tablero difiere: X-01=SBC-66, DOC-01=SBC-67, US-04=SBC-68, OCR=SBC-69, RAGAS=SBC-70.

---

## 1. Objetivo y resultados

Objetivo: cerrar el diferencial de R2 medible en local — Titan 1024, OCR etiquetado, RAGAS antes/después, decisión de hosting — sin demo ni despliegue con datos reales (US-08 es S6).

Capacidad: 13 SP + 3 buffer. 1 SP ≈ 4 h.

| Jira | Historia | SP | Estado en git | Commit | Fecha |
|---|---|---:|---|---|---|
| SBC-66 | X-01 spike Educate + PLAN_A_EC2 | 1 | Done | [`7e9f0dd`](https://github.com/Rincon3/smartbills-cleaner/commit/7e9f0dde38969683443c93585ddca79993a0b008) | 2026-11-06 |
| SBC-68 | US-04 Titan v2 1024 + reindex | 5 | Done | [`02f2bb7`](https://github.com/Rincon3/smartbills-cleaner/commit/02f2bb7dab345a2fb5bb38426f4255570880879e) | 2026-11-06 |
| SBC-69 | Eval OCR línea base v0 | 3 | Done | [`2ea614d`](https://github.com/Rincon3/smartbills-cleaner/commit/2ea614d633281eff12bfed6074fcb5b961e0ae6a) | 2026-11-06 |
| SBC-70 | TK-03 RAGAS hash vs Titan | 3 | Done | [`cd5cc91`](https://github.com/Rincon3/smartbills-cleaner/commit/cd5cc91090092f3e0a6e4d781fd3000d7783abca) | 2026-11-06 |
| SBC-67 | DOC-01 este paquete | 1 | Done | este commit | 2026-11-06 |

Velocidad en git: **13 / 13 SP**. Buffer usado: **0 de 3**.  
Tests backend en US-04: 27 pass.

---

## 2. Review (guion 5 minutos)

Orden de demostración. Solo seed `DEMO-VEC`. No abrir PDF reales.

1. Compromiso 13 SP y regla: nada de datos reales en público hasta US-08.
2. `/app/invoices` → `energia electrica` sin filtro de proveedor. Hash: Enel (`DEMO-VEC-05`) **4.º**. Titan 1024: **1.º**. Modo `sql+pgvector`.
3. Tabla `docs/sprint-5/eval/queries-hash-vs-titan.csv`.
4. OCR v0: global **0.33**; NIT y total **1.00**; proveedor, fecha, subtotal e IVA **0**. Texto nativo correcto; fallan las reglas. Un proveedor, solo nativos. PDFs fuera del repo.
5. RAGAS **0.680 → 0.688**. No afirmar mejora. Meta 0.85 no es criterio. Faithfulness 1.0 por construcción (citas).
6. Hosting: **PLAN_A_EC2** (t3.small, instance profile). Lightsail no tiene rol IAM. Textract no disponible. S5 no publica URL.

Qué decir de las limitaciones: la OCR no generaliza; RAGAS son 5 casos extractivos; costo USD/mes del t3.small sigue pendiente; S7 cae en fiestas.

---

## 3. Decisiones técnicas

### 3.1 Titan v2 en 1024 (no 1536 ni 512)

- **Contexto.** El R2 v2 pedía 1536 (Titan v1). En Educate está `amazon.titan-embed-text-v2:0`. La columna era `vector(96)` hash.
- **Decisión.** Dimensión **1024**, `normalize=true`. Recrear columna + HNSW; no CAST 96→1024.
- **Alternativas.** 1536 (v1, no es el modelo disponible). 512 (más barato, peor resolución; no era el default del v2 ni el acuerdo del plan). ONNX (fuera de S5).
- **Consecuencias.** Un solo espacio vectorial. Reindex obligatorio. Desvío 1536→1024 documentado para el director.

### 3.2 Modo degradado si Bedrock falla

- **Contexto.** Educate y tokens pueden caducar. Mezclar hash 96 en una columna 1024 rompe pgvector.
- **Decisión.** Si el embed falla: búsqueda `degraded` (SQL + léxico); no se escribe el vector. Indexación omite el chunk Titan y registra el error.
- **Alternativas.** Fallar el request 500. Escribir hash en 1024 (prohibido). Reintentos infinitos.
- **Consecuencias.** Lista usable sin Bedrock; ranking semántico solo con Titan vivo.

### 3.3 PLAN_A_EC2

- **Contexto.** Hace falta Docker, Tesseract, pgvector, HTTPS y Bedrock sin keys de sesión Vocareum.
- **Decisión.** **t3.small** us-east-2, Compose, **instance profile**. Respaldo **PLAN_B_RENDER**.
- **Alternativas.** Lightsail (sin rol IAM en la VM). App Runner (altas cerradas). Lambda/Vercel (sin Tesseract).
- **Consecuencias.** TK-04 implementa Plan A. RAM real y USD/mes: **pendiente**. S5 no despliega.

### 3.4 Textract no disponible

- **Contexto.** Excel TK-01 asumía Textract.
- **Decisión.** OCR local (`pdfjs` / Tesseract). No re-probar Textract en X-01.
- **Alternativas.** Document AI (opcional, no medido como must). Esperar cuenta de pago.
- **Consecuencias.** Desvío aceptado. Precisión se mide sobre el pipeline local, sin tunear.

### 3.5 OCR medido sin ajustar reglas

- **Contexto.** US-01/02 pedían ≥90 % como meta, no AC. El lote disponible era EMCALI nativo.
- **Decisión.** Gold a mano; pred = pipeline actual; informe **línea base v0**. Cero cambios a `extractInvoiceFields`.
- **Alternativas.** Tunear contra el gold (sesga la tesis). Esperar 4 proveedores y escaneos (no había lote).
- **Consecuencias.** Global 0.33. Hallazgo para US-02 (S7): fecha no parseada no debe ser “hoy”.

---

## 4. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|---|---|---|---|---|
| Credenciales AWS en el hosting (keys en disco o en git) | Media | Alto | Instance profile en EC2; `.env` y PDFs fuera de git; scan de staged | Abierto (TK-04) |
| Reglas de extracción frágiles (proveedor pie de software, fecha=hoy, IVA inventado) | Alta | Alto | Medido v0; no tunear en S5; hallazgo US-02 | Abierto |
| Muestra OCR de un solo proveedor / solo nativos | Cierta | Medio | Declarar no generalización; ampliar lote en S8 si hay PDFs anonimizados | Aceptado S5 |
| Falta de tiempo (13 SP + docs TI3) | Media | Alto | Buffer 3 SP no asignado; extras se caen por columna Cae | Abierto |
| S7 en fiestas (21 dic–10 ene) | Alta | Alto | TK-04a primero (Docker/secretos, sin esperar AWS); S8 corto | Abierto |
| Demo con facturas reales antes de US-08 | Media | Alto | Regla del plan: cero datos reales en público hasta Done | Mitigado en S5 |
| Educate corta sesión / Bedrock 403 | Media | Medio | Modo degradado; no mezclar dimensiones | Mitigado en código |

---

## 5. Página aparte — Definition of Done (reutilizable)

*Aprobar en Confluence y reutilizar S6–S8. Derivada de lo que sí se hizo en S5, no de un checklist ideal.*

Una historia no se marca Done hasta que:

1. **Pruebas.** `npm test --workspace backend` en verde si tocó backend (S5: 27).
2. **Commit con clave Jira** en el mensaje (`SBC-n …`) sobre `feature/s4-metricas` (o la rama del sprint).
3. **Evidencia en repo:** CSV, informe o ADR enlazado desde el comentario de Jira.
4. **Sin secretos.** No `.env`, no keys, no ID de cuenta, no PDF identificables. Scan de `git diff --staged` antes de commit.
5. **Comentario de cierre en Jira** (máx. 5 líneas): qué se midió, enlace de commit, qué queda fuera.
6. **Desvíos** (dimensión, Textract, muestra) escritos en plan o informe, no callados.
7. **Metas numéricas** (OCR 90 %, RAGAS 0.85) se reportan; no bloquean Done si el AC era “medir”.

Fuera de esta DoD: cobertura Istanbul, E2E, deploy a producción, tunear extractores contra el gold.

---

## 6. Backlog actualizado

Fuente: `docs/sprint-5/plan-vigente-s5-s8.md`. No duplicar el tablero.

- **S5:** X-01, US-04, OCR, RAGAS y DOC-01 en Done en git. Buffer usado: 0 de 3.
- **S6 (30 nov–20 dic):** primero **US-08** (aislamiento + cerrar `/uploads`). Luego DOC-02. Extras: US-05 (cae 4), US-12 (cae 2). Cero demos reales hasta US-08 Done.
- **S7:** TK-04a antes que TK-04b. US-02 extra (fecha vacía + parseMoney COP). X-02 no comprometido. Riesgo fiestas.
- **S8 corto:** docs TI3 + cifras; sin producto nuevo. US-11 Won’t.

**completar yo — Jira:** pegar captura del sprint S5 y el filtro del backlog S6 (p. ej. `Sprint = S6 ORDER BY Rank`). No adjuntar CSV de importación.

Desvíos vigentes: Textract, dim 1024, S3 no es must de S5, US-11 Won’t, US-08 aplazado a S6, muestra OCR estrecha, RAGAS 0.85 meta.

---

## 7. Velocidad, burndown, daily, retro

### Velocidad

Comprometida: 13 SP. Entregada en git: **13 / 13**. Buffer usado: **0 de 3**.

### Burndown

Jira no tiene burndown clásico por SP. Captura `evidencia/jira-s5-burndown.png`: 8 finalizadas en 7 días (donut del tablero amplio, no de los 13 SP). La velocidad auditable es la tabla de commits de §1.

### Notas tipo daily

No hay notas daily en git. No se reconstruyen.

### Retro corta

Transcrita de `evidencia/confluence-s5.png` (no inventada). Texto completo en `docs/sprint-5/evidencia-sprint.md` §7.

1. Qué funcionó: medir antes de afirmar (hash vs Titan, OCR v0, RAGAS); X-01 al inicio; un commit por historia con clave Jira.
2. Qué cambiar: CSV con claves distintas a las reales; importación a Jira; muestra OCR de un proveedor.
3. Acción S6: no está completa en la captura; el plan vigente pone US-08 primero.
