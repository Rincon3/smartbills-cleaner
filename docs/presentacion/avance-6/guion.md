# Avance 6 — Fase 1: inventario y guion

Release 2 · sprints 3, 4 y 5 · 15 minutos  
HTML (Fase 2) **no** se construye hasta aprobar esta fase.  
Demo: solo seed `DEMO-VEC`. Sin PDF reales, nombres, cédulas ni cuenta AWS.

Claves S5 **por confirmar** en Jira si el tablero difiere: X-01=`SBC-66`, DOC-01=`SBC-67`, US-04=`SBC-68`, OCR=`SBC-69`, RAGAS=`SBC-70`.

Repo: https://github.com/Rincon3/smartbills-cleaner · rama `feature/s4-metricas`

---

## a) Inventario de evidencias

### Sprint 3 — ingesta, OCR local, CRUD, citas

| Qué | Evidencia | Nota |
|---|---|---|
| Goal | `docs/presentacion/index.html` §1 | “Flujo central de ingesta y extracción” |
| SBC-3 extraer + validar campos | commit `6ef3e09` · tests OCR · modal editor | 12/12 unitarias en `docs/evidencia-jira/resultado-unitarias.json` (2026-09-18) |
| SBC-8 OCR PDF | `6ef3e09` · motor pdftotext/pdf.js/Tesseract | Textract/SQS **no** en S3 |
| SBC-4/5/6 ver y borrar | `a4d5f6f` · capturas listado/eliminar | `docs/evidencia-jira/jira-02-invoices-listado.png`, `jira-04-eliminar-documento.png` |
| SBC-22/24 citas página | `84cc7f2` · `chunk_source` | Unitaria “construye identificadores de fragmento y cita” |
| Review S3 en Jira | `14bcfbc` · `docs/presentacion/img/jira-tablero-estado.png` | Tablero **histórico**; no es el S5 |
| SP S3 | **por confirmar** en Jira | Repo no guarda el compromiso de planning S3 |

**Falta:** burndown/velocidad S3; SP oficiales; captura actualizada (las de `img/jira-*` son S3).

### Sprint 4 — pgvector, RAG, híbrida, perf

| Qué | Evidencia |
|---|---|
| SBC-15 vector(96) hash | `03e9e11` · `docs/sprint-4/jira-backlog.md` · SP 5 |
| SBC-29/30/31/32 RAG + RAGAS | `28a4e37` · SP 5+2+2+2 en informe |
| SBC-25 búsqueda híbrida | `32f6dc8` · SP 5 |
| SBC-17 DoD consultas NL | `43deec1` · SP 3 |
| SBC-8 nube opcional | `1e924f9` · **ajustado**: cableado, sin claves no llama |
| SBC-53 docs S4 | `05478ab`, `b9c8ef9` (2026-10-15) · SP 2 |
| Informe historias | `docs/sprint-4/informe-sprint-4.html` |
| Unitarias S4 | 24/24 en ese informe (Oct 2026) |
| Unitarias **ahora** | 27/27 (S5 añadió Titan) · corrida 2026-11-06 en sesión US-04 |
| Perf | `docs/sprint-4/evidencia/metricas-rendimiento.json` · p95 peor 91,9 ms · 11/11 &lt; 4 s · `informe-metricas-rendimiento.html` |
| RAGAS S4 | Informe ~0,69; JSON `docs/sprint-4/evidencia/ragas-resultado.json` |
| Capturas UI | `docs/sprint-4/capturas/s4-01-busqueda-hibrida.png` (`energia electrica`), `s4-02-busqueda-enel-filtro.png`, `s4-03-consulta-rag-citas.png`, `s4-04-sin-evidencia.png`, `s4-01b-resultados.png` |

**Falta:** captura Jira S4 Done; burndown S4.  
**Cuidado:** `docs/presentacion/img/app-ocr-factura-real.png` es factura real → **no usar** en Avance 6.

### Sprint 5 — Titan, OCR medido, RAGAS, hosting

| Qué | SP | Commit | Fecha | Enlace |
|---|---:|---|---|---|
| SBC-66 X-01 PLAN_A_EC2 | 1 | `7e9f0dd` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/7e9f0dde38969683443c93585ddca79993a0b008 |
| SBC-68 US-04 Titan 1024 | 5 | `02f2bb7` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/02f2bb7dab345a2fb5bb38426f4255570880879e |
| SBC-70 TK-03 RAGAS | 3 | `cd5cc91` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/cd5cc91090092f3e0a6e4d781fd3000d7783abca |
| SBC-69 OCR v0 | 3 | `2ea614d` | 2026-11-06 | https://github.com/Rincon3/smartbills-cleaner/commit/2ea614d633281eff12bfed6074fcb5b961e0ae6a |
| SBC-67 DOC-01 | 1 | — | — | **pendiente** (no hay commit) |

Otros archivos S5:

- ADR: `docs/adr/001-hosting-plan-a-b.md` (en `7e9f0dd`)
- Inventario AWS: `docs/sprint-5/aws-educate-inventario.md` (cuenta **no** publicada)
- Hash vs Titan: `docs/sprint-5/eval/queries-hash-vs-titan.csv` (16 consultas; Q01 hash 4 / Titan 1)
- OCR: `informe-ocr.md`, `ocr-gold.csv`, `ocr-pred.csv`, `compare-ocr.mjs`
- RAGAS: `ragas-antes.json` 0,6797 · `ragas-despues.json` 0,6883 · `informe-ragas.md`
- Confluence borrador: `docs/sprint-5/confluence-sprint-5.md` (sin commit)
- Plan: `docs/sprint-5/plan-vigente-s5-s8.md` (sin commit)

**Falta S5:** commit DOC-01; captura Jira S5; velocidad/burndown/daily/retro (**completar yo**); captura UI Titan (la `s4-01` es híbrida S4, ranking hash).

### Qué no está

| Ítem | Estado |
|---|---|
| URL en la nube | No implementado. Plan TK-04 S7 |
| E2E (Playwright/Cypress) | No hay en el repo |
| CI GitHub Actions | No hay workflow |
| RRF, cola SQS, chatbot analítica US-05 | No implementados |
| Burndown/velocidad Jira S3–S5 | Sin archivo |

---

## b) Matriz historia vs criterios

Leyenda: **Cumplido** · **Ajustado** (con justificación) · **Pendiente**.

### S3

| Historia | Criterio | Estado | Evidencia |
|---|---|---|---|
| SBC-3 | Extrae proveedor, NIT, fecha, subtotal, IVA, total; se puede corregir | **Cumplido** (sobre PDF de muestra / reglas) | tests `extractInvoiceFields` · `6ef3e09` |
| SBC-3 | Campos no hallados = “No detectado” | **Cumplido** | mismo test “marca error si falta NIT y total” |
| SBC-8 | OCR de PDF operativo | **Ajustado** | Motor local. Textract/SQS no. Justificación: Educate sin Textract; SQS Won’t (`1e924f9`, inventario X-01) |
| SBC-4/5/6 | Ver documento autenticado y borrar con confirmación | **Cumplido** | `a4d5f6f` · capturas evidencia-jira |
| SBC-22/24 | Cita `chunk_source` factura:página; no inventar cita | **Cumplido** | `84cc7f2` · test citas · consenso descarta cita inventada (S4 test, misma regla) |

SP S3: **por confirmar**.

### S4

| Historia | Criterio | Estado | Evidencia |
|---|---|---|---|
| SBC-15 | pgvector, modelo y dim, indexar al guardar, seed DEMO-VEC-01..06 | **Cumplido** *en S4* (entonces dim 96 hash) | `03e9e11` · informe S4. *Hoy* la columna es 1024 Titan (S5) |
| SBC-29/30 | RetrievalQA, Top-K=5, citas, consenso, fallback local | **Cumplido** | `28a4e37` · tests prompt/consensus |
| SBC-31 | Prompt ES, few-shot, formato cita | **Cumplido** | `rag/prompt.test.js` |
| SBC-32 | Script RAGAS 5 casos | **Cumplido** (medir, no ≥0,85) | `eval:ragas` · informe ~0,69 |
| SBC-25 | Filtros SQL + ranking semántico + UI + &lt;4 s | **Cumplido** | capturas s4-01/02 · perf p95 búsqueda 5,1 ms |
| SBC-17 | Citas clicables, vacío, Top-5, &lt;4 s | **Cumplido** | `43deec1` · s4-03 · s4-04 Madrid |
| SBC-8 nube | Document AI/Textract si hay claves; si no, no bloquea | **Ajustado** | Cableado opcional `1e924f9`. No hay corrida real con Textract (Educate: no disponible) |
| SBC-53 | Documentar stack | **Cumplido** | `05478ab` `b9c8ef9` |

### S5

| Historia | Criterio | Estado | Evidencia |
|---|---|---|---|
| SBC-66 éxito | 3 filas inventario + PLAN_* | **Cumplido** | inventario + ADR `7e9f0dd` |
| SBC-66 error | ExpiredToken/AccessDenied anotados, no inventar | **Cumplido** | inventario: Textract No; Lightsail sin rol IAM |
| SBC-68 éxito | Tabla hash vs Titan 16 consultas + modelo/dim | **Cumplido** | `queries-hash-vs-titan.csv` · modelo `amazon.titan-embed-text-v2:0` dim 1024 |
| SBC-68 error | No mezclar dims si Bedrock falla | **Cumplido** | modo `degraded` en `invoiceSearchService.js` `02f2bb7` |
| SBC-68 meta Enel top-3 | **No es AC** | Medido: Q01 Titan **1.º** (hash 4.º) | CSV Q01 |
| SBC-69 éxito | Precisión global y por campo | **Ajustado** | Medido 13 nativos / 1 proveedor (plan pedía mixto). Informe v0. AC era *medir*, no ≥90 % |
| SBC-69 error | file_name sin pred listados; no inventar | **Cumplido** | compare: `missingPredictions: 0` |
| SBC-69 permiso | Sin PDF/CSV identificables en git | **Cumplido** | `.gitignore` example2/examples · pred sin cédulas |
| SBC-69 meta ≥90 % | **No es AC** | No cumple (0,33) | `informe-ocr.md` |
| SBC-70 éxito | Dos corridas + delta + nota faithfulness | **Cumplido** | `informe-ragas.md` |
| SBC-70 error | Sin Bedrock, generador local y se reporta | **Cumplido** | JSON: `provider: local` |
| SBC-70 meta 0,85 | **No es AC** | 0,6883 | informe |
| SBC-67 éxito | evidencia-sprint + burndown/retro | **Pendiente** | Borradores locales; sin commit; burndown en blanco |

---

## c) Observaciones anteriores y qué pasó

Una sola tabla. Nada “cerrado” sin evidencia.

| Observación | Estado | Qué pasó | Evidencia / plan |
|---|---|---|---|
| Formalizar ajustes del Release Plan | **Ajustada** | Plan vigente S5–S8 + tabla estilo v2 lista para Jira Versions | `docs/sprint-5/release-plan-actualizado.md` **sin commit**. Captura Jira RP: **pendiente** (pegar Fix version = Release 2 según §3 de ese archivo) |
| Cerrar compromisos R2 | **Ajustada** | Cerrado honesto: carga, OCR medido, validación, listado, Titan 1024, RAG citado, híbrida, RAGAS. Fuera: S3-must, cola, Textract, RRF, RAGAS 0,85, CSV, analítica, aislamiento | `plan-vigente` §R2. No hay acta de director: **por confirmar** |
| S3 / cola SQS | **Ajustada** | Won’t. OCR síncrono | `jira-backlog.md` S4; `1e924f9` “No hay SQS” |
| Textract / Document AI | **Ajustada** | Textract no en Educate. Document AI/Textract opcionales; sin claves no se llaman | inventario X-01 · `cloudOcr.test.js` |
| Medir precisión de extracción | **Cerrada** | Línea base v0, 13 PDF, 6 campos | `informe-ocr.md` `2ea614d` |
| Pruebas E2E | **Pendiente** | No hay suite E2E | Plan: no está en S5–S8 núcleo. S7 extra X-02 es CI unitarias, no E2E |
| Proveedores cloud reales (URL) | **Pendiente** | Decisión PLAN_A_EC2; **no hay despliegue** | ADR. Plan TK-04 S7 |
| Ampliar dataset de ranking | **Cerrada** | 16 consultas hash vs Titan (antes 4 de demo RAG) | `queries-hash-vs-titan.csv` |
| Context Precision | **Cerrada** (medida, no “mejorada”) | 0,44 hash y 0,44 Titan | `informe-ragas.md` |
| Answer Relevancy | **Cerrada** (medida, no “subida a umbral”) | 0,279 → 0,313; baja por generador extractivo | mismo informe |
| Conjunto eval estable S4 vs S5 | **Ajustada** | Mismas 5 preguntas (`evalCases.js`). Corpus creció (más facturas locales). JSON S4 en git Oct-15 ya muestra ragas 0,6883 y vacío Madrid; S5-hash 0,6797 citó ruido. No afirmar que el JSON S4 sea “antes Titan” | `evalCases.js` · tres JSON |
| Flujo Jira → Git → prueba → Done | **Ajustada** | S5: commit con `SBC-n`, tests 27, comentario Jira propuesto. Vínculo ticket↔commit en tablero: **por confirmar** (captura tuya) | `02f2bb7` mensaje `SBC-68…` |
| Demo del componente inteligente | **Cerrada** en local S4; **actualizar** ranking S5 | Capturas S4 RAG + híbrida. Falta captura Titan top-1 Enel | `docs/sprint-4/capturas/` |

---

## d) Guion 15 minutos

Tiempos = techo. Una línea = una diapositiva. Pie de evidencia obligatorio en Fase 2.

### Portada, agenda, punto de partida (1,5 min)

| # | Diapositiva | Evidencia | Notas del orador |
|---|---|---|---|
| 1 | Portada: Avance 6, R2, S3–S5, 15 min, solo `DEMO-VEC` | — | No abrir PDF reales. Claves S5 por confirmar. |
| 2 | Agenda (10 bloques de este guion) | Este archivo | “Primero prácticas y flujo; luego demo; al final plan S6/S7.” |
| 3 | Punto de partida S3: ingesta OCR + CRUD + citas ya operativos | `index.html` S3 · `6ef3e09` | S2 5/5 cerrado. S3 dejó el flujo de factura. Hash 96 era la línea base, no SBERT. |

### Sprint goals y planning S3–S5 (1,5)

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 4 | Goals: S3 ingesta · S4 vector+RAG · S5 medir Titan/OCR/RAGAS + decidir nube | Informes S4/S5 · plan-vigente | Capacidad S5 13+3. Calendario 9–29 nov **por confirmar**. |
| 5 | Compromiso S5 en una fila: 1+5+3+3+1 | plan-vigente | DOC-01 aún sin commit. Buffer 3 no asignado. |

### Prácticas ágiles y seguimiento (2)

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 6 | Prácticas usadas = las de la propuesta: Scrum (PO=Dev=estudiante), Jira, incrementos por sprint, DoD con prueba | `index.html` retro · commits `SBC-n` | No inventar dailies. Burndown: **completar yo**. |
| 7 | Avance vs cronograma: R2 producto en local S3–S5; nube es S7 | plan-vigente · ADR | Rúbrica pide despliegue: decir **no hay URL**; hay decisión y spike, no Lightsail en producción. |
| 8 | HU: Excel ID en el resumen, clave Jira en el commit | jira-s5.csv · `02f2bb7` | “No reabrimos SBC-25/17; Titan mejora el ranking del endpoint que ya existía.” |

### Flujo Jira → Git → prueba → Done, con SBC-68 (1)

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 9 | Ticket US-04 → 27 tests → commit `SBC-68` → push `feature/s4-metricas` | `02f2bb7` · suite backend | Mostrar mensaje de commit. Captura Jira con enlace al commit: **tú la pegas**. |
| 10 | Done = AC de *medir* ranking + degraded; meta Enel no es AC (igual se cumplió) | CSV Q01 | Si el tablero no muestra el vínculo, es pendiente de captura, no de código. |

### Arquitectura implementada y decisiones (1)

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 11 | Stack real: React/Vite, Express, Prisma, Postgres+pgvector, OCR local, Bedrock Titan para embed | informe S4 · schema | No mencionar SQS, RRF, Comprehend, SBERT, CI. Nova Lite existe en inventario; la demo RAG es **local extractiva**. |
| 12 | Decisiones: 1024 no 1536; degraded; PLAN_A_EC2 no Lightsail | ADR + US-04 | Instance profile vs keys. Textract fuera. |

### Demo del componente inteligente (3)

| # | Diapositiva | Evidencia | Notas / paso |
|---|---|---|---|
| 13 | Qué es el componente: búsqueda híbrida + RAG citado Top-5 | s4-01, s4-03 | Login `admin@smartbills.local`. Solo DEMO-VEC. |
| 14 | **Vivo:** Facturas → `energia electrica` sin proveedor | CSV Q01; plan B: captura nueva | Esperado Titan: `DEMO-VEC-05` 1.º, modo `sql+pgvector`. Decir: hash era 4.º. |
| 15 | **Vivo:** Consultas → `Cuanto pague de energia electrica con Enel?` | s4-03 | Citas `[Factura DEMO-VEC-05, pág. n]`. Top-5 visible. |
| 16 | **Vivo:** `Cual es el canon de arriendo de un local en Madrid?` | s4-04 | Vacío; no inventa. Si hash antiguo citaba ruido, Titan debe ir a “sin evidencia”. |
| 17 | Plan B si Bedrock 403: modo `degraded` + capturas S4 | código degraded | No improvisar con PDF reales. |

### Criterios de aceptación y pruebas (2)

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 18 | Matriz S3–S5 compacta: cumplido / ajustado / pendiente | §b de este guion | No marcar OCR ≥90 ni RAGAS 0,85 como Done. DOC-01 pendiente. |
| 19 | Pruebas: 12/12 (S3) → 24/24 (S4) → **27/27** (S5) · perf p95 91,9 ms | JSON unitarias · metricas-rendimiento.json | “27 incluye Titan test. Perf es local Oct-15, no la nube.” |

### IA, métricas y decisiones (1)

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 20 | Ranking 16 queries: Enel 4→1; OCR v0 0,33 (NIT/total 1,00); RAGAS 0,680→0,688 sin afirmar mejora | CSV · informes OCR/RAGAS | Faithfulness 1,0 por citas. Muestra OCR: un proveedor, nativos. |

### Release 2, desvíos, nube, observaciones (1,5)

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 21 | R2 cerrado honesto + desvíos (Textract, cola, dim, S3-must) | plan-vigente §R2 | Director: **por confirmar** si ya vio la tabla. |
| 22 | Observaciones: una tabla, no lista de faltantes | §c | E2E y URL nube: pendiente con plan. Precisión y ranking: cerradas. |

### Retro, Release Plan y S6/S7 (1,5) — *plan, no hecho*

| # | Diapositiva | Evidencia | Notas |
|---|---|---|---|
| 23 | Retro S5: **completar yo** (1 ok / 1 cambiar / 1 acción) | confluence §7 | Preguntas ya escritas. No inventar. |
| 24 | RP S6: US-08 primero. S7: TK-04a luego URL PLAN_A_EC2. Etiqueta **plan** | plan-vigente | “La rúbrica de nube se cierra en S7, no hoy.” |

---

## e) Capturas que debes tomar

Carpeta prevista Fase 2: `docs/presentacion/avance-6/assets/`.  
No fotografiar facturas reales ni IDs de cuenta.

| Archivo | Qué debe verse |
|---|---|
| `jira-s5-tablero.png` | Sprint S5 con SBC-66/68/69/70 Done (y SBC-67 si aplica) |
| `jira-s5-velocidad.png` | Report velocidad S5 (o S3–S5 si existe) |
| `jira-s5-burndown.png` | Burndown S5; si Jira no tiene, foto de la tabla semanal llena |
| `jira-sbc-68-commit.png` | Historia SBC-68 con enlace al commit `02f2bb7` |
| `confluence-s5.png` | Página Confluence DOC-01 (aunque sea borrador pegado) |
| `github-s5-commits.png` | `feature/s4-metricas`: `7e9f0dd` `02f2bb7` `cd5cc91` `2ea614d` |
| `jira-release-plan.png` | Jira Releases con `Release 2` y las issues de `docs/sprint-5/release-plan-actualizado.md` §3 |
| `jira-product-backlog.png` | Backlog S6+ (US-08 arriba); no CSV de importación |
| `demo-01-login.png` | Login seed, sin datos personales |
| `demo-02-titan-enel.png` | Búsqueda `energia electrica`, **sin** proveedor; 1.ª fila `DEMO-VEC-05`; modo `sql+pgvector` |
| `demo-03-rag-enel.png` | Consultas Enel con cita DEMO-VEC-05 |
| `demo-04-madrid-vacio.png` | Madrid → sin evidencia |

Las S4 (`docs/sprint-4/capturas/s4-0*.png`) sirven de plan B si Bedrock falla. **No** uses `app-ocr-factura-real.png`.

### Guion vivo de la demo (paso a paso)

1. `http://localhost:5173/login` → `admin@smartbills.local` / `Admin123!`
2. Invoices → Palabra clave `energia electrica` → Buscar (proveedor vacío). Esperado: `DEMO-VEC-05` Enel primero, relevancia &gt; 0, modo `sql+pgvector`.
3. Consultas → `Cuanto pague de energia electrica con Enel?` Esperado: respuesta con `[Factura DEMO-VEC-05, pág. …]`, Top-5, latencia marcada.
4. Consultas → `Cual es el canon de arriendo de un local en Madrid?` Esperado: panel sin evidencia, sin inventar code.
5. Si modo `degraded` o Enel no es top-1: pasar a capturas `demo-02` / `s4-01` y decirlo.

---

## Lista de diapositivas (conteo)

24 diapositivas · 15 min. Fase 2: HTML 16:9, teclado, tecla N, SVG desde CSV/JSON, `assets/` con marcadores si falta la foto.
