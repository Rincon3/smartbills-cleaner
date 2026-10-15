# Backlog Sprint 4 · copiar a Jira

Fuente: código verificado en `apps/backend` y `apps/frontend`.
**No se actualizó Jira desde aquí.** Pegar descripción, criterios y SP; luego cambiar estado.

Estimación: 1 SP ≈ 4 h. Responsable: Miguel.

---

## Cerrar como Done (código ya entregado)

### SBC-15 — Vectorización y BD vectorial
- **Tipo:** Historia · **Prio:** Must · **SP:** 5 · **Estado sugerido:** Done
- **Historia:** Como sistema, quiero vectorizar cada factura procesada para búsquedas semánticas.
- **Criterios:** embeddings en pgvector `vector(96)` con `embeddingModel` y `embeddingDim`; indexación al subir/editar, sin paso extra en UI; seed DEMO-VEC-01..06.
- **Notas Jira:** quitar “JSON local / evaluar pgvector”. Stack real: PostgreSQL + extensión `vector`, HNSW, modelo `hashed-bow-96-v2` (no SBERT).

### SBC-29 — Implementación RAG
- **Tipo:** Historia · **Prio:** Must · **SP:** 5 · **Estado:** Done
- **Historia:** Como usuario, quiero respuestas ancladas a fragmentos de factura.
- **Criterios:** LangChain RetrievalQA (retriever + cadena); Top-K=5; español, breve, citas `[Factura X, pág. Y]`; consenso modelo base vs ajustado; si no hay Bedrock/OpenAI, respuesta local; si fallan APIs, el flujo continúa.
- **Subtareas Done:** SBC-30 RetrievalQA · SBC-31 few-shot · SBC-32 RAGAS (`npm run eval:ragas`).

### SBC-25 — Consultas RAG inteligente
- **Tipo:** Historia · **Prio:** Must · **SP:** 5 · **Estado:** Done
- **Historia:** Como usuario, quiero buscar facturas por texto, proveedor, fechas y montos.
- **Criterios:** filtros SQL primero; si hay texto, `ORDER BY` semántico pgvector; UI búsqueda avanzada; latencia reportada y objetivo &lt; 4 s (`GET /api/invoices/search`).

### SBC-17 — Consultas en lenguaje natural
- **Tipo:** Historia · **Prio:** Must · **SP:** 3 · **Estado:** Done
- **Historia:** Como usuario, quiero preguntar en español y ver de dónde salió cada dato.
- **Criterios:** respuesta citada; clic al fragmento; vacío “sin evidencia”; Top-5 visible; demo &lt; 4 s.

### SBC-23 / SBC-24 — Citas
- **Estado:** Done (código S3/S4)
- **Criterios:** `chunk_source = factura_id:página`; citas inventadas se descartan.

---

## Actualizar descripción (no reabrir como trabajo nuevo)

### SBC-8 — OCR
- **Estado:** Done parcial / dejar comentario
- **Texto a pegar:** Camino feliz = pdftotext/pdf.js → Tesseract. Document AI y Textract son **opcionales**: solo si hay claves; si fallan o no hay callback, se omite el ramal y sigue Tesseract. **No** hay SQS. `OCR_CLOUD_ORDER=documentai,textract`.
- **No marcar Done de Textract/SQS.** Subtareas SBC-9/SBC-10: Textract cableado sin clave = no se llama; SQS sigue pendiente (Won’t S4).

---

## Dejar en backlog (Should / Could / Won’t)

| ID | Resumen a poner en Jira | SP | Prio | Sprint |
|---|---|---|---|---|
| **SBC-53** | Documentar stack real S4 (pgvector, RAG, OCR local + nubes opcionales, Vite). 1–2 páginas. | 2 | Should | S4 cierre / S5 |
| **SBC-47** | Componente de análisis: KPI en COP, gráficos con datos reales, quitar CTAs rotos del dashboard. | 5 | Should | S5 |
| **SBC-7** | Soft-delete + log de auditoría (hoy DELETE físico). | 3 | Could | S5 |
| **SBC-43** | Obligaciones de tránsito: **reescribir criterios** (estados, plazos, rol). Sin eso no estimar en firme. | 8 | Won’t S4 | R3 |
| Spike HF-ONNX | Embedding multilingual pequeño. No LLM HF en el back. | 2 | Could | S5 |
| Spike Textract vs Document AI | Misma muestra de 15 PDF; precisión NIT/total/fecha. No encadenar ambas APIs en cada upload. | 2 | Could | S5 |

---

## Orden MoSCoW del Product Backlog (pegar en descripción del epic o filtro)

1. Must cerrado S4: 15, 29 (+30/31/32), 25, 17, 23, 24  
2. Should siguiente: 53, 47  
3. Could: 7, spikes  
4. Won’t S4: 43, S3/S3 Next.js, S3 SQS, S3  

Capacidad S4 (tope 20 SP): 15+29+25+17 ≈ trabajo ya hecho; 53 (2 SP) es el único Must/Should corto que falta para documentar.
