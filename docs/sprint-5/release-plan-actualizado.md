# Release Plan actualizado (Avance 6)

No se creó antes un Release Plan de Jira: el archivo `docs/presentacion/img/release-plan.jpg` es el **v2 original** (`SBC_ProductBacklog_v2`, sem. 9–27). Este documento lo **copia en la misma estructura** y lo actualiza con lo entregado en S3–S5.

Fuente de IDs de trabajo: Excel **original** (US-01 = carga, US-05 = consultas NL, US-08 = roles).  
Entre paréntesis, el ID del **v2** cuando el tablero de Jira se cargó con esa hoja.

Para pegar en **Jira → Releases / Versions**: crea o edita las versiones `Release 1`, `Release 2`, `Release 3` y arrastra las issues de la sección 3.

---

## 1. Tabla estilo v2 (semanas · release · objetivo · historias · incremento · hito)

| Semanas | Release | Objetivo | Épicas / historias (original · v2) | Incremento entregable | Hito |
|---|---|---|---|---|---|
| Sem 1–8 | **R1** | Auth, usuarios, shell de la app | S2: SBC-34, 41, 38, 48, 52 | Login JWT, roles, UI base | Ya presentado (Avances previos) |
| Sem 9–10 · S3 | **R2** | Carga y OCR **local** (no S3/cola/Textract) | US-01 carga · US-02 extraer · SBC-3, 8, 4, 5, 6 *(v2: US-05 S3, TK-07 cola, US-06 Textract → desvío)* | PDF a disco; OCR pdftotext/pdf.js/Tesseract; ver/borrar; campos editables | Sprint Review S3 |
| Sem 11–12 · S3/S5 | **R2** | Validación + listado; **medir** precisión | US-02 validar · SBC-25 listado · SBC-69 eval OCR *(v2: US-07, US-08 listado+CSV)* | Formulario con confianza; listado con filtros. **CSV no.** Precisión **medida** 0,33 (meta 90 % no es AC) | Review S3 + cierre S5 |
| Sem 13–14 · S4/S5 | **R2** | Vectorización + embedding semántico | US-04 Titan · TK pgvector · SBC-15 luego SBC-68 *(v2: US-09 Titan, TK-08 pgvector)* | pgvector HNSW; reindex Titan v2 **dim 1024** (no 1536) | Review S4/S5 |
| Sem 15–16 · S4/S5 | **R2** | NLP, híbrida, RAGAS, ranking | US-05 NL · US-07 ranking · TK-03 RAGAS · SBC-17, 25, 29–32, 70 *(v2: US-10 NLP, US-11 híbrida, TK-09 RAGAS)* | Consultas con citas; búsqueda SQL+pgvector; RAGAS **medido** 0,68 (meta 0,85 no es AC); Enel 4.º→1.º | **R2 · Demo Momento 2 = Avance 6** |
| Sem 17–20 · S6 | **R3** | Aislamiento y extras | US-08 ownerId · DOC-02 · US-05 analítica extra · US-12 CSV extra | Solo mis facturas; `/uploads` cerrado. Chat analítica y CSV **si caben** | Review S6 |
| Sem 21–24 · S7 | **R3** | Publicar URL de pruebas | TK-04a/b · US-02 parseMoney extra · DOC-03 | PLAN_A_EC2 (t3.small, instance profile). No Lightsail | Review S7 |
| Sem 25–27 · S8 | **R3** | Docs TI3 y cierre | DOC-04, 07, 10, 12 | PDF 9 secciones; cifras S5; sin producto nuevo | Entrega final |

---

## 2. Incremento R2: original v2 vs ahora

| Criterio v2 («Incremento entregable») | Estado Avance 6 | Cómo se cumple / desvío | Issues a colgar en **Release 2** |
|---|---|---|---|
| Subida a S3 | **Desvío** | Disco local (`storageProvider=LOCAL`) | SBC-3, SBC-8 (carga/OCR local). **No** inventar un ticket S3 Done |
| Cola de jobs con retry | **Desvío** | OCR síncrono | — (Won’t) |
| OCR iniciado y polling | **Ajustado** | OCR síncrono local; sin Textract | SBC-8 |
| Campos ≥ 90 % precisión | **Ajustado** | **Medido** 33 % global; NIT y total 100 %; no se tunearon reglas | SBC-69 · US-01/US-02 eval |
| Formulario de validación + confianza | **Hecho** | Editor de campos | SBC-3 |
| Listado con filtros | **Hecho** | SQL + semántico | SBC-25 · SBC-4 |
| Export CSV | **Fuera de R2** | Pasa a R3 extra (US-12) | no adjuntar a R2 |
| pgvector configurado | **Hecho** | HNSW cosine | SBC-15 |
| Vectores post-OCR | **Hecho** | Index al guardar; Titan 1024 | SBC-15, SBC-68 · US-04 |
| Consultas NLP respondiendo | **Hecho** | `/api/query` + Consultas | SBC-17 |
| NLP con citación | **Hecho** | `[Factura CODE, pág. n]` | SBC-22, 23, 24, 29 |
| Búsqueda híbrida | **Hecho** | `GET /invoices/search` | SBC-25 · US-07 |
| RAGAS faithfulness ≥ 0,85 | **Ajustado** | Faithfulness 1,0 por citas; ragas 0,68; 0,85 es **meta no AC** | SBC-32, SBC-70 · TK-03 |
| Demo R2 Momento 2 | **Este avance** | Ranking Titan + OCR medido + RAGAS | Avance 6 |

**R2 se cierra en local** (carga, OCR medido, validación, listado, Titan, RAG citado, híbrida, RAGAS medido).  
**No entra en R2:** S3, cola, Textract, CSV, URL en la nube, aislamiento US-08.

---

## 3. Qué adjuntar en Jira → Product releases

En cada versión: **Release date** = fecha del Avance (R2 ≈ 2026-11-06 o la del review). Start date **por confirmar** con tu calendario de sprints.

### Release 1 (ya entregada — no reabrir)

| Jira | Qué era |
|---|---|
| SBC-34, SBC-41, SBC-38, SBC-48, SBC-52 | Cierre S2 (5/5), según `docs/presentacion/index.html` |

### Release 2 — **estas son las desarrolladas a colgar** (S3+S4+S5)

Copia esta lista al release **Release 2**:

| Jira | Excel / alias | Sprint | Para el release |
|---|---|---|---|
| **SBC-3** | US-02 extraer/validar | S3 | Done |
| **SBC-4** | ver documento | S3 | Done |
| **SBC-5** | (visor / archivo) | S3 | Done |
| **SBC-6** | eliminar con confirmación | S3 | Done |
| **SBC-8** | US-01 OCR | S3+S4 | Done **ajustado** (local; Textract opcional no usado) |
| **SBC-22** | citas página | S3 | Done |
| **SBC-23** | chunk_source | S3/S4 | Done |
| **SBC-24** | citas sanitizadas | S3/S4 | Done |
| **SBC-15** | pgvector (hash 96 en su día) | S4 | Done (luego sustituido por Titan en SBC-68) |
| **SBC-25** | US-07 / v2 US-11 híbrida | S4 | Done |
| **SBC-17** | US-05 NL (Excel original) | S4 | Done |
| **SBC-29** | RAG | S4 | Done |
| **SBC-30** | RetrievalQA | S4 | Done (subtarea) |
| **SBC-31** | few-shot | S4 | Done (subtarea) |
| **SBC-32** | TK-03 primera RAGAS | S4 | Done (subtarea) |
| **SBC-53** | docs stack S4 | S4 | Done |
| **SBC-66** | X-01 hosting | S5 | Done |
| **SBC-68** | US-04 Titan 1024 | S5 | Done |
| **SBC-69** | US-01.2 / US-02.1 eval OCR | S5 | Done (medido) |
| **SBC-70** | TK-03 RAGAS antes/después | S5 | Done |
| **SBC-67** | DOC-01 | S5 | Done — súbela a Release 2 |

Si el tablero tiene tickets **v2** (US-05 Upload S3, TK-07 cola, US-06 Textract): **no los pongas Done**. Déjalos en R3 o Won’t con comentario de desvío.

### Release 3 — no desarrolladas (no las marques Released)

| Jira / Excel | Qué | Sprint plan |
|---|---|---|
| US-08 · (clave Jira S6, **por confirmar**) | Aislamiento ownerId | S6 |
| US-05 analítica (si es el ticket de “cuánto gasté”) | Extra | S6 |
| US-12 CSV | Extra | S6 |
| TK-04a / TK-04b | Docker + URL EC2 | S7 |
| US-02 parseMoney + vencimiento | Extra | S7 |
| US-11 dashboard analítico | Won’t S5–S8 | — |
| DOC-02…12 | TI3 | S6–S8 |

---

## 4. Cómo cargarlo en Jira (pasos)

1. **Issues → Releases** (o Project settings → Versions).
2. Crea `Release 2` si no existe. Description: pega el párrafo de «R2 se cierra en local» de la §2.
3. En cada issue de la tabla R2: **Fix versions = Release 2**.
4. No uses **Release 2** en US-08, TK-04, CSV, S3, cola.
5. Captura el tablero de versiones → `docs/presentacion/avance-6/assets/jira-release-plan.png` (Fase 2 del Avance 6).

---

## 5. Desvíos que deben verse en la versión R2 (comentario)

- Textract / cola / S3-must → local.  
- Titan **1024** (v2), no 1536.  
- Precisión OCR y RAGAS **se miden**, no se promete 90 % / 0,85.  
- CSV y nube → R3.  
- US-08 → S6, antes de cualquier demo con datos reales.
