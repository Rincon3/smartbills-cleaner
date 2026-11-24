# Plan vigente S5–S8

Fuente única tras Fase A y Fase B aprobadas.  
IDs Jira: claves **SBC-n** (verificar el siguiente libre). El resumen lleva el ID del Excel. El v2 solo se cita como contenido del R2.

Capacidad S5–S7: **13 SP + 3 buffer**. 1 SP ≈ 4 h. El buffer no se asigna a historias nuevas.  
S8 es un **sprint corto de cierre** (evaluación compilada + PDF TI3), sin trabajo nuevo de producto.

Cierre objetivo: **mediados de enero 2027** (puede moverse un poco). Diciembre puede retrasar S7. Cada sprint termina con un incremento presentable (columna Review).

Regla: **ninguna demo ni despliegue con datos reales antes de [US-08] Done.**

---

## Núcleo vs extras

Una sola tabla. **Núcleo:** sin esto no se defiende. **Extra:** se cae primero (columna Cae: 1 = el primero).

| Sprint | Review | Ítem | Excel | SP | Tipo | Cae |
|---|---|---|---|---|---|---|
| **S5** 9–29 nov | Demo local: búsqueda semántica Titan + tabla OCR + RAGAS antes/después. Solo seed `DEMO-VEC`, no PDFs reales en público. | [X-01] Spike Educate: Bedrock texto, S3, hosting | extra | 1 | Núcleo | |
| S5 | | [DOC-01] Evidencia Scrum S5 | TI3 §5 | 1 | Núcleo | |
| S5 | | [US-04] Titan v2 dim **1024** + reindex | US-04 | 5 | Núcleo | |
| S5 | | [US-01][US-02] Eval OCR 10–12 facturas | US-01.2, US-02.1 | 3 | Núcleo | |
| S5 | | [TK-03] RAGAS antes/después | TK-03 | 3 | Núcleo | |
| S5 | | Buffer | | 3 | — | |
| **S6** 30 nov–20 dic | Dos usuarios: A no ve facturas de B; chat sobre **sus** datos. `/uploads` cerrado. | [US-08] Aislamiento `ownerId` + cerrar `/uploads` | US-08 | 2 | Núcleo | |
| S6 | | [DOC-02] Evidencia Scrum S6 | TI3 §5 | 1 | Núcleo | |
| S6 | | [US-05] Chatbot analítica (totales / mayor gasto) | US-05 | 8 | Extra | 4 |
| S6 | | [US-12] Export CSV (sin XLSX) | US-12 | 2 | Extra | 2 |
| S6 | | Buffer | | 3 | — | |
| **S7** 21 dic–10 ene | URL de pruebas **o** Compose de producción en local + montos COP correctos. Empieza por lo que no necesita AWS. | [TK-04a] Dockerfile prod, `vite build`, secretos fuera del código | TK-04 | 2 | Núcleo | |
| S7 | | [TK-04b] Publicar (Lightsail/EC2 o Render) + HTTPS + volumen | TK-04 | 6 | Núcleo | |
| S7 | | [DOC-03] Evidencia Scrum S7 | TI3 §5 | 1 | Núcleo | |
| S7 | | [US-02] `parseMoney` COP + vencimiento | US-02 | 3 | Extra | 3 |
| S7 | | [X-02] CI unitarias en PR | extra | 1 | Extra | 1 |
| S7 | | Buffer | | 3 | — | |
| **S8** ~11–18 ene (corto) | PDF TI3 de 9 secciones + cifras de evaluación. Sin features nuevas. | [DOC-04] Evidencia Scrum S8 | TI3 §5 | 1 | Núcleo | |
| S8 | | [DOC-07] §4 servicios IA (cifras S5) | TI3 §4 | 3 | Núcleo | |
| S8 | | [DOC-10] §7 manuales (URL o Compose local) | TI3 §7 | 3 | Núcleo | |
| S8 | | [DOC-12] §9 + PDF único | TI3 §9 | 2 | Núcleo | |
| S8 | | [DOC-08] §5 Scrum compilado | TI3 §5 | 2 | Extra | 5 |
| S8 | | [DOC-09] §6 matriz pruebas | TI3 §6 | 1 | Extra | 6 |
| S8 | | [DOC-11] §8 lecciones | TI3 §8 | 1 | Extra | 7 |
| — | Fuera de S5–S8 | [US-11] Dashboard analítico | US-11 | — | Won’t | |
| — | Fuera | [DOC-05][DOC-06] §§1–3 | TI3 | 2+2 | Extra (se redactan ya, no entran a los 13) | 8 |

Comprometido: S5 **13+3** · S6 **13+3** · S7 **12+3** · S8 **9** (sprint corto).

S7: **TK-04a 2 + TK-04b 6 + US-02 3 + DOC-03 1 = 12**. [X-02] no se compromete (extra 1). `/uploads` no suma en S7: va en [US-08] S6. TK-04a (Docker, `vite build`, secretos) se hace **primero**, sin esperar AWS.

S8 comprometido (sprint corto): **DOC-04+07+10+12 = 9 SP**. DOC-08/09/11 se pliegan al PDF si hay horas; si diciembre atrasó, el PDF sale con §5/§6/§8 cortos a partir de los paquetes DOC-01…03.

---

## X-01 (S5, día 1)

Textract y embeddings **no se re-prueban**. Titan v2 ON_DEMAND ya está en `us-east-2`.

| # | Qué | Resultado |
|---|---|---|
| 1 | Bedrock **generación** de texto (`list-foundation-models` TEXT sin `embed` + perfiles, `us-east-2`) | 1 modelo ON_DEMAND o “ninguno → RAG extractivo” |
| 2 | S3: crear/borrar bucket de prueba; SSE-S3 | Sí / AccessDenied / el lab lo borra. Si no hay S3: desvío A8 |
| 3 | Lightsail o EC2: ¿la VM **sobrevive** al End Lab? | Plan A solo si sobrevive. Si no → Plan B Render |

**Bedrock desde el hosting:** Plan A = rol IAM de la VM; Plan B = clave persistente en el PaaS. Nunca keys de Vocareum. Si no hay rol ni clave persistente, Titan y el LLM quedan en **modo degradado** (SQL + RAG extractivo local; semántica solo con el lab encendido).

DoD: `docs/sprint-5/aws-educate-inventario.md` (3 filas) + `PLAN_*` en `docs/adr/001-hosting-plan-a-b.md`.

---

## US-04 Titan 1024 (sin reabrir el análisis)

Default de Titan v2. El R2 v2 pedía 1536 (Titan v1): desvío documentado.  
Antes de migrar `vector(96)`: ranking hash + `eval:ragas` → `ragas-antes.json`. Recrear columna `vector(1024)` + HNSW; no mezclar hash y Titan. Must: `energia electrica` → Enel `DEMO-VEC-05` en top-3. Plantilla: `docs/sprint-5/eval/queries-hash-vs-titan.csv`. Eval OCR: `docs/sprint-5/eval/README.md`.

---

## R2 cerrado (honesto)

Cerrado en S5 si: carga local, OCR local **medido**, validación, listado, Titan 1024, RAG con citas (S4), híbrida sin RRF, RAGAS antes/después (faithfulness 1.0 por construcción).

**Fuera (desvío):** S3, cola, Textract (no disponible), RRF, RAGAS ≥ 0.85, CSV, analítica “¿cuánto gasté?”, aislamiento (S6, antes de datos reales).

---

## Desvíos para el director

| ID | Qué | Por qué |
|---|---|---|
| Textract | OCR local | Educate: no disponible |
| S3 | Disco/volumen | X-01 lo confirma; A8 |
| Cola | OCR síncrono | A3; &lt;10 s en PDF nativo |
| Dim 1024 | No 1536 | Titan v2, no v1 |
| US-11 | Won’t S5–S8 | En v2 es Release 3; el MVP ya tiene KPI |
| US-08 | S6 | S5 cierra ENT-2; cero demos reales hasta Done |
| EP-06 | Won’t | Prioridad Baja |
| S8 corto | Docs + evaluación, sin producto nuevo | Cierre mediados de enero 2027 |

---

## CSV Jira

Verificar el siguiente **SBC-n** libre antes de importar.

| Archivo | Contenido |
|---|---|
| `docs/sprint-5/jira-s5.csv` | S5 comprometido |
| `docs/sprint-5/jira-s6-s8.csv` | S6–S7 producto + extras + S8 no lleva producto |
| `docs/sprint-5/jira-doc-ti3.csv` | Épico Documentación TI3 |

Detalle de historias, GWT y plantillas TI3: `docs/sprint-5/fase-b-documentacion-ti3.md` y `docs/sprint-5/fase2-s5-historias.md` (US-08 / US-05).
