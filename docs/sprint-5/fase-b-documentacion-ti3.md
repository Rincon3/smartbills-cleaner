# Fase B — Documentación final TI3 (9 secciones)

**Plan de sprints, núcleo/extras y fechas:** `docs/sprint-5/plan-vigente-s5-s8.md` (fuente vigente). Este archivo es el mapa de las 9 secciones y el detalle de historias DOC.

Fuente de estructura: `Documentación Proyecto.pdf` (Trabajo Integrador 3, Univalle).  
Plantillas en `docs/sprint-5/eval/`. IDs: clave Jira **SBC-n**. El resumen lleva el ID del Excel.

---

## 1. Mapa sección → evidencia → hueco

| § | Entregable (PDF) | Existe (repo / Jira / docs) | Falta | SP | Sprint |
|---|---|---|---|---|---|
| 1 | Nombre, equipo, roles Scrum, asesor, duración | README; tesis 1 persona (PO+Dev); tutor = SM (auditoría) | Ficha 1 página con nombres reales y fechas S1–S8 | 1 (dentro de DOC-05) | **Ya** / S5 |
| 2 | Problema, contexto, justificación IA, objetivos | Anteproyecto PDF; `docs/output/marco_teorico_smartbills_cleaner.md`; instrumento usuarios | Objetivos numerados 1:1 con el anteproyecto; justificación IA actualizada (servicios preentrenados, no modelo propio) | 2 (DOC-05) | **Ya** / S5 |
| 3 | Arquitectura, SBPMN, despliegue, stack, UI, integración IA, seguridad | `docs/auditoria/auditoria-tecnica-reunion-director.md`; `docs/presentacion/img/arquitectura-semestre1.jpg`; Compose; `docs/abstraccion_ihc_smartbills.md` | BPMN si no está firmado; **diagrama de despliegue real** (S7); mockups vs pantallas actuales; párrafo seguridad (`/uploads`, JWT 12 h) | 2 (DOC-06) | Borrador **ya**; cierre S7 |
| 4 | Tipo de modelo, dataset, entrenamiento, métricas, CV, ética | OCR/Titan/RAG en código; RAGAS 5 casos; 14 facturas / 26 chunks | Protocolo honesto (abajo); gold 10–12; tabla hash vs Titan; ética/sesgo; **no hay entrenamiento ni CV** | 3 (DOC-07) + trabajo S5 US-04/OCR/RAGAS | S5 mide, S8 redacta |
| 5 | Backlog, HU, DoD, sprints, **velocidad**, **burndown**, dailies, retro, review | Backlogs S4/S5; capturas tablero `docs/presentacion/img/jira-*`; Excel | Velocidades S1–S4 si Jira las tiene; **S5+ hay que capturar desde ahora**; burndown; notas retro/review | 1 SP **cada** sprint (DOC-01…04) + 2 SP compilado S8 (DOC-08) | S5–S8 |
| 6 | Plan de pruebas, cobertura, matriz requisito-prueba, resultados, usuarios | 24/24 unitarias; `docs/evidencia-jira/resultado-unitarias.json`; perf S4; entrevistas diseñadas (`instrumento_*.md`) | Matriz US/TK → test; % cobertura (hoy no hay Istanbul); resultados entrevistas **si** se aplicaron | 2 (DOC-09) | S6–S7 |
| 7 | Ambientes, manuales instalación/usuario/técnico, capturas/video | README corto; Docker Compose; capturas S4 y `docs/presentacion/img/app-ocr-factura-real.png` | Manuales; ambientes (local / pruebas nube); video; capturas **post US-08 y post TK-04** | 3 (DOC-10) | **S8** (URL o Compose local) |
| 8 | Dificultades, cambios de plan, fortalezas/debilidades, mejoras, aprendizajes | Auditoría; este plan de desvíos | Redacción reflexiva con evidencias de retros | 1 (DOC-11) | S8 |
| 9 | Repo, datasets, bibliografía, licencias, pitch | GitHub `Rincon3/smartbills-cleaner`; biblio del marco teórico; presentaciones HTML | Dataset etiquetado (anexo, anonimizado); licencia (no hay LICENSE); PDF/video final | 2 (DOC-12) | S8 |

**Verificado:** las rutas de la columna “Existe”.  
**Supuesto:** que Jira tiene historial de S1–S4 exportable; que el BPMN del v2 SP1 se llegó a aprobar (no está en este repo).

---

## 2. Lo que no se reconstruye al final

| Dato | ¿Lo tienes hoy? | Capturar desde S5 |
|---|---|---|
| Velocidad S1–S4 | **No verificado en repo.** Buscar en Jira reports (completed SP / sprint) | Si no hay: tabla “no registrado; S5 es el primer sprint medido” |
| Velocidad S5–S8 | No | DOC-01…04, plantilla `eval/sprint-evidence.template.md` |
| Burndown | No en repo | Captura Jira o tabla semanal de la plantilla |
| Dailies | No | 3 notas/sprint (fecha + 2 líneas). No hace falta standup diario literal en tesista único |
| Review | Parcial (informes S4 HTML) | Link Jira + 5 líneas de incremento |
| Retro | No | 1 funcionó / 1 cambiar / 1 acción |
| Matriz requisito-prueba | No | Una fila por historia Done del sprint |
| Cobertura de líneas | No | Opcional; si no hay tiempo, reportar “24 tests / áreas” de `metricas-sistema.json` |

### Plantilla mínima (ya creada)

Copiar `docs/sprint-5/eval/sprint-evidence.template.md` a `docs/sprint-N/evidencia-sprint.md` el **día 1**.  
DoD de DOC-0N: ese archivo lleno + captura burndown.

---

## 3. Sección 4 — cumplirla con servicios preentrenados

**Por validar con el profesor asesor.**

No hay entrenamiento ni validación cruzada. El proyecto **usa servicios y modelos ya entrenados**:

| Pieza | Qué es | “Dataset / train / CV” equivalente |
|---|---|---|
| OCR | pdftotext / pdf.js / Tesseract (`spa+eng`); Textract **no disponible** | Dataset = 10–12 facturas **etiquetadas por ti**. Métrica = precisión por campo. No hay k-fold: el extractor es reglas, no se ajusta a un fold |
| Embeddings | Titan Text Embeddings v2 1024 (API). Hash 96 = línea base | Evaluación de recuperación: 16 consultas, top-3/top-5, hash vs Titan |
| Generación RAG | Extractivo local; LLM Bedrock **si** X-01 da un modelo de texto | RAGAS propio, mismas 5 (o más) preguntas **antes y después** de Titan |
| Campos | Regex + heurística (`extractInvoiceFields.js`) | Misma tabla OCR; `parseMoney` COP se declara como sesgo conocido |

**Protocolo (sustituye entrenamiento + CV):**

1. Congelar el extractor (no tunear sobre el gold).
2. Etiquetar 10–12 facturas **después** de definir el CSV, no al revés.
3. Partir 8 train-like / 4 hold-out **solo para reportar** (no se reentrena). Si el asesor dice que sin train no hay split, se reporta las 12 como test único.
4. Precisión por campo y global; umbral R2 0.90 se **reporta**, no se persigue con parches ad hoc.
5. RAG: `eval:ragas` antes/después; faithfulness se explica a 1.0 por construcción (las citas no soportadas se eliminan **antes** de puntuar).
6. Ética: PII (NIT, direcciones, NICs); sesgo a facturas de grandes ESP colombianas; PDF nativo sobre-representado vs foto de celular; montos COP mal parseados sesgan totales.

### Pregunta para el asesor

> Profesor, la plantilla del TI3 §4 pide dataset, entrenamiento, métricas y validación cruzada. SmartBills Cleaner no entrena un modelo: usa Tesseract/PDF nativo para OCR, Amazon Titan Embed Text v2 para vectores y un RAG extractivo (LLM de Bedrock solo si la cuenta Educate lo permite). ¿Acepta que sustituya entrenamiento y k-fold por un protocolo de evaluación: (1) 10–12 facturas reales etiquetadas y precisión por campo, (2) 16 consultas de recuperación hash vs Titan, (3) RAGAS propio antes/después dejando explícito que faithfulness = 1.0 porque filtramos citas, y (4) un apartado de sesgo y PII? Si exige CV o un modelo entrenado por mí, no me cabe en el Sprint 5 y tendría que recortar el cierre del Release 2.

---

## 4. Qué puedes redactar ya (sin código)

| Sección | Avance ahora | Esperar a |
|---|---|---|
| §1 ficha | Sí | Fechas finales de S8 |
| §2 problema/objetivos/IA | Sí (actualizar marco: OCR ya no es “simulado”) | — |
| §3 C4/stack/seguridad actual | Sí | Diagrama de despliegue (S7) |
| §4 protocolo + ética (sin cifras) | Sí | Cifras S5 |
| §5 backlog + DoD histórico | Sí | Velocidades S5+ |
| §6 plan de pruebas + 24 unitarias S4 | Sí | Matriz S5–S7; usuarios si aplicas entrevistas |
| §7 | Índice de manuales | URL S7, capturas post-US-08 |
| §8 desvíos ya conocidos | Sí | Retro S8 |
| §9 biblio, repo, esta plantilla de dataset | Sí | CSV gold anonimizado, pitch |

---

## 5. Épico “Documentación TI3” — historias

DoD común: archivo en `docs/ti3/` o Confluence; sin secretos; IDs Excel en títulos; no mezclar IDs v2.

Capacidad: la captura de 1 SP va **al inicio** de cada sprint. El resto no pisa el Must técnico.

### DOC-01 — Paquete evidencia S5 · 1 SP · S5 · Must académico

Historia: Como tesista, quiero registrar compromiso, burndown y retro del S5 el mismo sprint, para no reconstruir la sección 5 al final.

GWT: Given el planning, when termina el día 1, then existe `docs/sprint-5/evidencia-sprint.md` con la tabla de compromiso. Given el cierre, when hago review/retro, then velocidad, burndown y 3 notas daily están pegados.

DoD: plantilla llena; captura Jira; matriz de las 4 historias técnicas S5.

### DOC-02 — Paquete evidencia S6 · 1 SP · S6

Igual, carpeta `docs/sprint-6/`. Incluye fila US-08 → pruebas de aislamiento.

### DOC-03 — Paquete evidencia S7 · 1 SP · S7

Incluye TK-04 → checklist HTTPS, secretos, persistencia.

### DOC-04 — Paquete evidencia S8 · 1 SP · S8

Cierre: velocidad final y lecciones para §8.

### DOC-05 — TI3 §§1–2 · 2 SP · S5 (en paralelo, recortable a 1)

Historia: ficha del proyecto + contexto/justificación/objetivos alineados al anteproyecto y al stack real (Node, no Django).

DoD: 4–6 páginas. Roles: PO+Dev = estudiante; SM = tutor. Duración = S1–S8 con fechas.

**Se puede escribir ya.**

### DOC-06 — TI3 §3 arquitectura · 2 SP · borrador S5, freeze S7

DoD: diagrama componentes (puede ser el de la auditoría); stack real; mockup vs UI; estrategia IA (OCR local + Titan + RAG); seguridad (lo que hay y lo que espera a US-08/TK-04). Freeze del **despliegue** en S7.

### DOC-07 — TI3 §4 modelo/servicio IA · 3 SP · S8 (núcleo del cierre)

Depende de S5 (Titan, OCR gold, RAGAS antes/después).

DoD: protocolo aprobado o “pendiente de asesor”; tablas de precisión; tabla 16 consultas; párrafo faithfulness 1.0; ética. **No** finge entrenamiento.

### DOC-08 — TI3 §5 Scrum compilado · 2 SP · S8

DoD: una tabla de velocidades S1–S8 (S1–S4: Jira o “no registrado”); burndowns; DoD; responsabilidades.

### DOC-09 — TI3 §6 pruebas · 2 SP · S6–S7

DoD: plan (unitarias / eval OCR / RAGAS / perf S4); matriz requisito-prueba; resultados. Cobertura de líneas: “no medida” si no hay tiempo (Should).

### DOC-10 — TI3 §7 despliegue y manuales · 3 SP · S8 (núcleo; URL o Compose local)

DoD: ambientes; install Compose; manual de usuario (carga, validar, consultar, límites); manual técnico; capturas o video de la URL de pruebas. **Prohibido** usar facturas reales en capturas si US-08 no está Done.

### DOC-11 — TI3 §8 lecciones · 1 SP · S8

DoD: desvíos R2 + US-11 + Educate; 5 lecciones con evidencia.

### DOC-12 — TI3 §9 anexos + PDF único · 2 SP · S8

DoD: repo, dataset gold anonimizado, biblio, licencia MIT o “uso académico”, PDF TI3 unificado, pitch.

---

## 6. Reparto

La tabla núcleo/extras y las capacidades están en `docs/sprint-5/plan-vigente-s5-s8.md`. S8 es sprint corto de cierre (PDF TI3 + cifras), sin producto nuevo. DOC-05/06 se redactan ya y no entran a los 13.

---

## 7. RAGAS en S5 (no solo informe)

1. Baseline: `npm run eval:ragas` con hash → `docs/sprint-5/eval/ragas-antes.json`.
2. Titan indexado: misma suite → `ragas-despues.json`.
3. Tabla: métrica / antes / después / Δ.
4. Párrafo obligatorio: faithfulness = 1.0 porque `verifyAnswerCitations` elimina citas no recuperadas **antes** de puntuar. No se reporta como calidad del generador. context_precision y answer_relevancy son las que pueden subir con Titan.
5. Umbral v2 0.85: **no es criterio de Done**. Done = dos corridas + explicación.

---

## Verificado vs supuesto (Fase B)

**Verificado:** las 9 secciones del PDF; evidencia listada con ruta; 24 tests; RAGAS 0.69 / faithfulness 1.0; 14 facturas / 26 chunks; plantillas creadas en `docs/sprint-5/eval/`.  
**Supuesto:** SP de redacción; que el asesor acepte el protocolo §4; velocidades S1–S4 en Jira; cierre a mediados de enero 2027.
