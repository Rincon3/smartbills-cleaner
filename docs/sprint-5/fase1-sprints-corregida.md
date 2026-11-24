# Sprints S5–S8 corregidos + Fase 2 (S5 y S6)

Fuente de verdad: `SmartBillsCleaner_ProductBacklog.xlsx` (confirmado en el chat previo).
`SBC_ProductBacklog_v2.xlsx` **no** se usa: IDs distintos (allí US-05 = Upload S3). Ver §0.
Ajustes A1–A13: borrador interno, pendientes del director.

Capacidad elegida: **16 SP / sprint = 13 comprometidos + 3 de buffer**.
El buffer **no** se asigna a historias nuevas. Si una historia se infla, se recorta alcance, no se come el buffer.

1 SP ≈ 4 h. Una persona, 3 semanas.

---

## 0. Excel vigente vs v2

El mensaje traía ambas rutas. Se mantiene el Excel **original** porque la Fase 1 aprobada usa US-01=carga, US-05=consultas NL, US-08=roles.

| | `SmartBillsCleaner_ProductBacklog.xlsx` | `SBC_ProductBacklog_v2.xlsx` |
|---|---|---|
| Hojas | Product Backlog, Sprint Overview, Leyenda | Product Backlog, **Release Plan**, Sprint Config, Leyenda |
| US-05 | Chat NL (“mayor gasto en Q1”) | **Upload a S3** |
| US-08 | Roles y facturas privadas | Listado con filtros y CSV |
| Sprints | 4 sprints de 2 semanas, 100 % del producto | 13 sprints / 27 semanas / 3 releases |
| SP | No hay columna | Escala 1–10 “dificultad” ≠ Fibonacci |
| CI/CD | No aparece | TK-10 en Release 3 |

Si Jira está cargado con el v2, **no pegues estos IDs encima**. Avísame y se remapea.

---

## 1. Capacidad y criticidad

**Por qué 16, no 13 ni 18.** Trece como total dejaría S5 en 10 comprometidos y partiría el chatbot. Dieciocho es lo que entregaste en el S4 académico concentrado; S5 mezcla spike de cuenta + seguridad + NLP y no es comparable. Dieciséis con tres de buffer es el techo honesto.

**MoSCoW (inconsistencia resuelta).** Prefiero **bajar US-11 y US-12 a Should**, no inflar Must.

| ID | Excel | Aquí | Por qué |
|---|---|---|---|
| US-01…US-07, TK-01…TK-03 | Alta | Must de producto | Núcleo OCR + vectores + NL |
| **US-08** (aislamiento) | Media | **Must de defensa** | Sin `ownerId` el chatbot de US-05 filtra mal y US-08 criterio 3 no se cumple |
| **TK-04** | Media | **Must de defensa** | `/uploads` es público; no se defiende un sistema de facturas así. El Excel lo pone en el incremento S3 |
| **US-11, US-12** | Media | **Should** | Incremento Excel S3, no el diferencial del anteproyecto (OCR+NL+citas). Entran en S6 **si** US-04 cierra |
| US-09 refresh/reset | Media | Should / Won’t reset | JWT 12 h se documenta (A6). Reset email = EP-06 adyacente |
| US-10 90 días | Media | Recortable | Auditoría ya existe (50 filas) |
| US-03 resto, TK-01 SQS, EP-06 | — | Won’t | Ver §4 |

---

## 2. Spike AWS Educate (S5, primero) — qué comprobar en la consola

Historia extra **X-01**. 2 SP. Sin esto no se compromete Titan, Textract, S3 ni Lightsail.

Hazlo en **una sesión** (Educate a veces corta a 1–4 h). Anota región (`us-east-1` suele ser la de Academy).

### 2.1 Cuenta y techo

1. [https://labs.vocareum.com](https://labs.vocareum.com) o el portal Academy/Educate que uses → **Start Lab**.
2. Consola AWS → esquina arriba: **número de cuenta**, **rol** (`voclabs` / `vocstartsoft` / IAM de estudiante) y **región**.
3. Barra Vocareum: **tiempo restante de sesión** y si el lab **se destruye al acabar**.
4. Billing o el panel del lab: **créditos restantes**. Educate **casi nunca** muestra facturación real; si Billing está denegado, anótalo (es un dato).

### 2.2 IAM (qué puedes hacer)

En **IAM → Users / Roles** (si deja entrar): políticas pegadas al rol de lab. Busca `textract:`, `bedrock:`, `s3:`, `lightsail:`, `ec2:`, `rds:`, `ecs:`, `iam:Create*`.

Si IAM está bloqueado, usa **CloudShell** (si existe) o la CLI del lab:

```bash
aws sts get-caller-identity
aws iam list-attached-role-policies --role-name NOMBRE_DEL_ROL   # si AccessDenied, anótalo
```

### 2.3 Cada servicio (sí / AccessDenied / no está en el menú)

| Servicio | Dónde | Qué hacer | Resultado que importa |
|---|---|---|---|
| **S3** | S3 → Create bucket (no lo dejes creado si hay que borrar) | Crear `sbc-test-…`, subir un txt, borrar el bucket | ¿SSE-S3 disponible? |
| **Textract** | Amazon Textract | `DetectDocumentText` sobre un PNG de 1 página **o** “AccessDenied” | ¿Análisis síncrono? ¿AnalyzeExpense? |
| **Bedrock** | Amazon Bedrock → Model access | ¿Lista de modelos? ¿Titan Embeddings V2? ¿Nova / Claude? Pedir acceso si está “Available to request” | A2 y TK-03 |
| **Lightsail** | Lightsail | ¿Aparece el servicio? ¿Create instance? | TK-04 plan A |
| **EC2** | EC2 → Instances → Launch | ¿Lanza t2.micro/t3.micro? | Plan A alterno |
| **RDS** | RDS → Create database | ¿PostgreSQL? ¿Engine version ≥ 15? **No crees** la instancia; basta el wizard hasta “Engine options” | pgvector en RDS es improbable en Educate |
| **ECS / Fargate** | ECS | ¿Create cluster? | Si Lightsail no existe |
| **Secrets Manager** | Secrets Manager | ¿Create secret? | TK-04 criterio 3 |
| **ACM** | Certificate Manager | Suele estar bloqueado | HTTPS por Caddy, no ACM |
| **SES** | Amazon SES | Irrelevante (EP-06 Won’t) | — |

Comando rápido (marca cada `UnauthorizedOperation` / `AccessDenied`):

```bash
aws s3 ls
aws textract detect-document-text --help >/dev/null && echo TEXTRACT_CLI_OK
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `titan`) || contains(modelId, `nova`)].modelId'
aws lightsail get-regions --include-availability-zones 2>&1 | head
aws ec2 describe-instance-type-offerings --region us-east-1 --max-items 1
aws rds describe-db-engine-versions --engine postgres --query 'DBEngineVersions[0].engineVersion' --region us-east-1
```

### 2.4 Cómo se usa el resultado (condiciona S7)

| Resultado | A2 embeddings | A8 archivos | TK-04 S7 |
|---|---|---|---|
| Bedrock Titan sí | Titan v2 | — | — |
| Bedrock no, S3 sí | Modelo local/ONNX | S3 | VM + S3 |
| Nada de AWS útil | ONNX local | Volumen Docker | **Plan B: Render/Railway** (Fase 3) |
| Lab se borra al cerrar sesión | No hay “prod” en Educate | No hay | Hosting **fuera** de Educate; Educate solo para APIs puntuales |

Entregable del spike: tabla de 1 página (servicio / sí-no / evidencia) en Confluence o `docs/sprint-5/aws-educate-inventario.md`.

---

## 3. Tabla de sprints corregida

Criticidad: **Bloqueante** = no se defiende sin esto · **Importante** · **Recortable**.

| Sprint | ID | Título | Excel | Extra | SP | Prio | Criticidad | Notas |
|---|---|---|---|---|---|---|---|---|
| **S5** | **X-01** | Spike AWS Educate | — | Sí | 2 | Must | Bloqueante | Primero. Condiciona A2, A8, TK-04 |
| **S5** | **US-08** | Aislar facturas por `ownerId` + roles en mutaciones | US-08 crit. 1 y 3 | | 2 | Must defensa | Bloqueante | Recortado: **no** desactivar usuarios (crit. 2) |
| **S5** | **US-05** | Chatbot NL: analítica cerrada + RAG de **mis** facturas | US-05 | | 8 | Must | Bloqueante | Historial solo en sesión (crit. 4 recortable) |
| **S5** | **X-02** | CI mínimo: tests en PR | — | Sí A12 | 1 | Should | Recortable | Primer recorte si pierdes una semana |
| S5 | Buffer | — | — | | 3 | — | — | No comprometer |
| **S5 total** | | | | | **13+3** | | | |
| **S6** | **US-04** | Embedding semántico (Titan **o** ONNX según X-01) | US-04 | | 5 | Must | Bloqueante | Cierra también **US-07** (ranking) |
| **S6** | **US-11** | Dashboard de gastos (top 5, mes, COP) | US-11 | | 5 | **Should** | Importante | Bajado de Must |
| **S6** | **US-12** | Export CSV (XLSX si cabe) | US-12 | | 3 | **Should** | Recortable | Segundo recorte |
| S6 | Buffer | | | | 3 | | | |
| **S6 total** | | | | | **13+3** | | | |
| **S7** | **TK-04** | Publicar: HTTPS, secretos, persistencia (S3 o volumen según X-01) | TK-04 | | 8 | Must defensa | Bloqueante | Incluye **pg_dump** (A13) 1 SP embebido |
| **S7** | **US-02** | Vencimiento + `parseMoney` COP + “No identificado” | US-02 | | 3 | Must | Importante | ≥90 % se mide en S8 |
| **S7** | **TK-02** | Documentar esquema real vs Excel; índice HNSW ya existe | TK-02 | | 2 | Should | Recortable | **No** ivfflat, Alembic, RDS, backups automáticos |
| S7 | Buffer | | | | 3 | | | Cloud se lo suele comer |
| **S7 total** | | | | | **13+3** | | | |
| **S8** | **US-01/02 eval** | Set etiquetado, precisión por campo | US-01 c.2, US-02 c.1 | | 5 | Must | Bloqueante | A4: se **reporta**, no se promete ≥90 % |
| **S8** | **TK-03 eval** | Juez LLM o RAGAS oficial, ≥30 preguntas | TK-03 c. RAGAS | | 3 | Must | Importante | Bedrock si X-01 lo dio |
| **S8** | **X-03** | Memoria / ADRs / evidencias de defensa | — | Sí | 5 | Must académico | Bloqueante | No está en el Excel |
| S8 | Buffer | | | | 3 | | | Correcciones del director |
| **S8 total** | | | | | **13+3** | | | |

### S5 ¿es realista? No lo era a 8+3+2+1 = 14. Quedó en 13 así

- Spike **2** + aislamiento **2** + chatbot **8** + CI **1** = **13**.
- US-08 **antes o en el mismo sprint** que US-05, **nunca después**. Orden de trabajo: X-01 (día 1–2) → US-08 → US-05 → X-02.
- Se recortó de US-08: desactivar usuarios. Se recortó de US-05: historial en BD (solo React).

### Si pierdes una semana (orden de recorte)

1. **X-02 CI** (S5) — las 24 pruebas siguen en local.
2. **US-12 CSV** (S6).
3. **US-11** gráficos extra; dejar 3 KPI de gasto.
4. **TK-02** texto (S7).
5. **US-02 vencimiento**; **no** recortar `parseMoney` (rompe US-11/US-12).
6. **TK-03** librería oficial; dejar la métrica Node ya hecha.
7. **Nunca recortar:** X-01, US-08 aislamiento, US-05 respuesta+citas, TK-04 HTTPS/`/uploads`, eval OCR S8, X-03.

---

## 4. Ítems que estaban sueltos

| ID | Destino | Justificación |
|---|---|---|
| **TK-02** (2 SP) | **S7 Should** | El índice ANN ya está (HNSW). Queda documentar diferencias vs ivfflat/RDS y un `pg_dump` (A13), metido en TK-04 (volumen + runbook) + estas 2 SP de texto/script |
| **pg_dump (A13)** | **S7**, dentro de TK-04 | Un respaldo manual documentado; no backups diarios RDS |
| **US-07** ranking | **S6, sin ticket nuevo** | El endpoint ya existe. El ranking mejora **cuando** US-04 cambie el embedding. Criterio US-07.3 se revalida en el DoD de US-04 |
| **US-03** paginación / soft-delete / S3 delete | **Won’t S5–S8** | Listado, preview y delete con confirmación **ya están**. Paginación y soft-delete no bloquean defensa. S3 delete cae con A8 |
| **TK-01** SQS / CloudWatch / umbral 70 % | **Won’t** | A3 aprobado como borrador. OCR síncrono cumple &lt;10 s en PDF nativo |
| **US-10** retención 90 días | **Won’t S5–S8** | `AuditLog` y panel admin ya existen. 90 días es operación, no tesis. Limitación a escribir en X-03 |
| **US-09** refresh + reset mail | **Won’t** (documentar A6) | JWT 12 h. Reset implica SES (EP-06). Rate limit login: Could 1 SP si S5 termina pronto (buffer **no**) |
| **EP-06** US-13, US-14, TK-05 | **Won’t** | Ya aprobado |

---

## 5. Resumen de una página para el director (A1, A3, A5, A6, A9, A12)

**Para:** director de tesis · **De:** Miguel Rincón · **Asunto:** Desviaciones controladas del Product Backlog (borrador, pido validación)

El SPB (`SmartBillsCleaner_ProductBacklog.xlsx`) sigue siendo la referencia. El prototipo ya cubre carga, OCR local, validación, pgvector, consultas con cita a página y roles. Para terminar en **cuatro sprints de tres semanas** (S5–S8) necesito validar estas desviaciones. No cambian el problema ni el valor (extraer, consultar con evidencia, auditar). Cambian **cómo** se implementa, para caber en el tiempo y en una cuenta AWS Educate.

| ID | Qué cambia respecto al Excel | Por qué | Impacto |
|---|---|---|---|
| **A1** | Backend Django / frontend Next.js → Node, Express, React, Vite, Prisma | Ya está construido y en Docker local. Rehacerlo son ~20 SP y no añade requisitos de usuario | Alcance funcional igual. Las tres capas (presentación, servicios, IA) se mantienen |
| **A3** | Cola SQS + CloudWatch (TK-01) → OCR síncrono en la petición de carga | Educate suele bloquear SQS. Un PDF nativo ya procesa en &lt;10 s (criterio TK-01.1 medido) | Se mantiene el SLA de tiempo. Se pierde el polling “Procesando”. Estados QUEUED quedan para un Could futuro |
| **A5** | NER con Comprehend o spaCy (US-02) → reglas + corrección humana; campo vencimiento se añade | Comprehend es otro SKU, costo y permiso. El Excel ya exige que el usuario pueda corregir | Sigue habiendo proveedor, NIT, fechas y montos. La precisión ≥90 % **se mide** en S8; no se promete de antemano (pocas facturas reales etiquetadas) |
| **A6** | Cognito + JWT 1 h + refresh + reset mail → JWT propio, 12 h, bcrypt | El propio Excel marca Cognito como “fase 2”. Reset mail depende de SES (épica Baja) | Login/registro/roles se quedan. No hay recuperación de contraseña por correo. Lo declaro como limitación |
| **A9** | Épica EP-06 (API pública, OAuth, webhooks, email SES, Swagger) → **Won’t** en S5–S8 | Prioridad **Baja** en el Excel (24 % del plan original). Son 16 SP | El producto de tesis no integra Siigo/SAP ni notifica por correo. La API interna (JWT) sigue documentada en el código |
| **A12** | Añadir CI mínimo en GitHub Actions (el Excel no lo trae) | 1 SP. Sin ello cada “24 tests en verde” es una captura manual | Extra. Recortable si el sprint se aprieta |

**Qué pido:** visto bueno o rechazo por fila. Con el visto, el Sprint 5 arranca por un spike de 2 SP en AWS Educate (Bedrock, Textract, S3, Lightsail/EC2) que decide si los embeddings son Titan o un modelo local, y si los archivos van a S3 o a un volumen.

---

# Fase 2 — Historias S5 y S6 (detalle) · S7 y S8 (una línea)

Importar: copiar la tabla “CSV Jira” del final o crear issues a mano con el texto.

DoD común a todas (además del de cada una): código en rama `feature/…`;  la historia no usa el buffer; README o nota Jira si cambia un env; **no secretos en git**.

---

## S5

### X-01 — Spike AWS Educate  
**Extra.** Justificación: el Excel (TK-01 Textract, US-04 Titan, TK-04 S3/ACM) asume una cuenta AWS de pago. Educate lo condiciona; hay que medirlo **antes** de S7.

**Historia:** Como tesista, quiero un inventario escrito de servicios y permisos de mi cuenta Educate para decidir embeddings, almacenamiento y hosting sin comprometer trabajo inviable.

**Estimación:** 2 SP · **Prio:** Must · **Criticidad:** Bloqueante · **Sprint:** 5 · **Épica:** —  
**Dependencias:** ninguna. **Bloquea:** US-04 (modelo), TK-04 (dónde publicar).

**Given/When/Then**

1. Given una sesión de lab iniciada, when ejecuto `aws sts get-caller-identity` y recorro la tabla del §2, then documento para cada servicio: disponible / AccessDenied / ausente, con captura o error.
2. Given el inventario, when cierro el spike, then hay una tabla que elige: Titan vs ONNX; S3 vs volumen; Lightsail/EC2 vs Plan B PaaS.
3. Given un lab que se destruye al logout, when lo detecto, then TK-04 **no** usa Educate como hosting de producción.

**DoD:** archivo `docs/sprint-5/aws-educate-inventario.md` (o Confluence) con la tabla; comentario en Jira; **cero** recursos de pago dejados vivos (borrar bucket de prueba).

**Desvío:** no está en el Excel. Extra A12-adyacente.

---

### US-08 — Aislar facturas por dueño y restringir mutaciones  
**Excel US-08** criterios 1 y 3 (no el 2: desactivar).

**Historia:** Como usuario autenticado, quiero ver y consultar solo mis facturas, y que Viewer no las borre, para que el chatbot de US-05 no filtre datos de otros.

**Estimación:** 2 SP · **Prio:** Must defensa · **Criticidad:** Bloqueante · **Sprint:** 5  
**Dependencias:** ninguna. **Debe mergearse antes o el mismo sprint que US-05**, nunca después.

**Given/When/Then**

1. Given dos usuarios A y B con facturas propias, when A llama `GET /api/invoices` o `/search` o `POST /api/query`, then no aparecen facturas de B.
2. Given un VIEWER, when hace `POST /upload`, `PUT /invoices/:id` o `DELETE /invoices/:id`, then 403. ADMIN y ANALYST sí, **solo sobre las suyas** (ADMIN puede ver todas: **por confirmar** — default: ADMIN ve todas, ANALYST solo las suyas).
3. Given un token ausente, when pido `/uploads/<archivo>`, then **no** 200 (cerrar estático público; el archivo solo por `GET /api/invoices/:id/file` autenticado).

**DoD:** prueba automatizada de aislamiento (aunque sea unitaria del `where ownerId`); prueba 403 VIEWER; `/uploads` sin token ≠ 200; nota Jira: desactivar usuarios **Won’t** este sprint.

**Desvío:** criterio 2 (desactivar) no se hace. JWT sigue 12 h (A6).

---

### US-05 — Chatbot sobre BD y documentos propios  
**Excel US-05.**

**Historia:** Como analista financiero, quiero preguntar en español (totales, “mayor gasto”, un proveedor, un trimestre) y obtener una respuesta citada o un “no hay evidencia”, para no abrir factura por factura.

**Estimación:** 8 SP · **Prio:** Must · **Criticidad:** Bloqueante · **Sprint:** 5  
**Dependencias:** **US-08** (corpus = mis facturas). X-01 no bloquea el modo local.

**Given/When/Then**

1. Given facturas **mías** PROCESSED, when pregunto “¿Cuál fue mi mayor gasto?”, then la respuesta usa el `total` de **mi** BD (Prisma), `mode=analytics`, y nombra el `code` del proveedor/factura. Tiempo `elapsedMs` &lt; 4000 en local sin Bedrock.
2. Given facturas mías con texto de energía, when pregunto “¿Cuánto pagué de energía a Enel?”, then `mode=document`, hay cita `[Factura CODE, pág. N]` clicable, Top-5 visible, y la cita está en los chunks recuperados.
3. Given una pregunta sin evidencia (“arriendo en Madrid”), then mensaje claro de vacío, `noEvidence=true`, HTTP 200, sin citas inventadas.
4. Given facturas de otro usuario, when pregunto, then no entran al Top-5 ni a los agregados (Given US-08).
5. Given un hilo en `/app/consult`, when hago 3 preguntas, then veo las 3 en pantalla (historial **de sesión**, no persistido).

**DoD:** 4 unitarias (router analytics/document/none; aislamiento; mayor gasto; vacío); captura Jira del hilo; p95 local &lt; 4 s en una pregunta demo; no SQL libre generado por LLM.

**Desvío A7, A10:** no Claude 3; no Next.js; SLA 4 s local; historial no en BD (crit. Excel 4 recortado).

---

### X-02 — CI mínimo  
**Extra (A12).**

**Historia:** Como tesista, quiero que cada PR a `main` ejecute las unitarias del backend para no depender de una captura manual.

**Estimación:** 1 SP · **Prio:** Should · **Criticidad:** Recortable · **Sprint:** 5  
**Dependencias:** ninguna.

**Given/When/Then**

1. Given un PR que rompe una unitaria, when corre GitHub Actions, then el check queda rojo.
2. Given `main` sano, when corre el workflow, then `npm test --workspace backend` pasa (24 o las que existan).

**DoD:** `.github/workflows/ci.yml`; Node 20; sin secretos; captura del check.

**Desvío:** el Excel no tiene CI (el v2 sí, TK-10, y no es esta fuente).

---

## S6

### US-04 — Embeddings semánticos  
**Excel US-04.** Cierra **US-07.3** (orden semántico).

**Historia:** Como sistema, quiero guardar embeddings semánticos de cada factura procesada para que búsquedas y el chatbot ordenen por significado, no por hash.

**Estimación:** 5 SP · **Prio:** Must · **Criticidad:** Bloqueante · **Sprint:** 6  
**Dependencias:** **X-01** (Titan vs ONNX). Reindex `ensureInvoiceChunksIndexed`.

**Given/When/Then**

1. Given X-01 con Titan, when subo o reindexo, then `embeddingModel` ≠ `hashed-bow-96-v2` y `embeddingDim` coincide con Titan (p. ej. 1024) **o** el modelo ONNX documentado.
2. Given el set de preguntas “energia electrica” **sin** filtro SQL, when busco, then Enel (`DEMO-VEC-05` o equivalente) queda **en el top-3** (hoy queda 4.º con hash — verificado).
3. Given US-07, when uso `/invoices/search?q=`, then `mode=sql+pgvector` y el orden respeta el nuevo score; p95 local &lt; 2 s (criterio Excel US-07.1).

**DoD:** migración de dimensión si cambia; script de reindex; comparación hash vs nuevo en 5 queries (tabla en Jira); tests del serializador de vectores.

**Desvío A2, A13:** no se exige 512 tokens ni overlap 50 (sigue chunk por página, justificado: facturas cortas).

---

### US-11 — Dashboard de gastos  
**Excel US-11.** **Should.**

**Historia:** Como analista financiero, quiero ver total gastado, top 5 proveedores y gasto por mes, en COP, para decidir sobre los datos ya extraídos.

**Estimación:** 5 SP · **Prio:** Should · **Criticidad:** Importante · **Sprint:** 6  
**Dependencias:** US-08 (solo mis datos). US-02 `parseMoney` **no** está aún: usar `total` actual y declarar sesgo si hay COP mal parseados.

**Given/When/Then**

1. Given facturas mías PROCESSED, when abro `/app`, then veo total gastado (suma de `total`), top 5 proveedores y una serie mensual. Moneda COP, no EUR.
2. Given un filtro de fechas, when lo aplico, then KPIs y gráficos usan ese rango.
3. Given “categoría”: if no hay campo categoría aún (clasificación Won’t), then el filtro de categoría **no se finge**: se omite o se usa `supplier` y se documenta.

**DoD:** se quitan textos “Algoritmo simulado” / insights inventados; endpoint agregado (nuevo o `dashboard/summary` extendido); captura.

**Desvío:** Chart.js vs “Recharts/Next” irrelevante (A1). Categoría Comprehend no existe (A5).

---

### US-12 — Exportar CSV  
**Excel US-12.** **Should.** XLSX: si cabe en las 3 SP; si no, solo CSV y nota.

**Historia:** Como usuario, quiero exportar mis facturas a CSV (proveedor, NIT, fecha, subtotal, IVA, total, concepto) para llevarlas a un Excel contable.

**Estimación:** 3 SP · **Prio:** Should · **Criticidad:** Recortable · **Sprint:** 6  
**Dependencias:** US-08.

**Given/When/Then**

1. Given ≤ 1.000 facturas mías, when `GET /api/invoices/export?formato=csv`, then descargo CSV con esas columnas en &lt; 5 s.
2. Given un VIEWER, when exporta, then solo sus filas (o 403 si decidimos ANALYST+).
3. Given formato xlsx no implementado, when pido `formato=xlsx`, then 400 con mensaje claro **o** se entrega xlsx si dio el tiempo.

**DoD:** botón en `/app/invoices`; prueba de columnas; no usa pandas (Node).

**Desvío A1:** no pandas/openpyxl de Python.

---

## S7 y S8 — una línea

| Sprint | ID | Línea | SP | Criticidad |
|---|---|---|---|---|
| S7 | **TK-04** | Publicar HTTPS + secretos fuertes + persistencia (S3 o volumen según X-01) + `pg_dump` en runbook; cerrar seed en production | 8 | Bloqueante |
| S7 | **US-02** | Campo/fecha vencimiento si está en el texto; corregir `parseMoney` COP; marcar no encontrados | 3 | Importante |
| S7 | **TK-02** | Nota ADR: HNSW vs ivfflat, sin RDS; script `pg_dump` | 2 | Recortable |
| S8 | **US-01 eval** | 15–20 PDF etiquetados; tabla precisión por campo; no exigir ≥90 % (A4) | 5 | Bloqueante |
| S8 | **TK-03 eval** | ≥30 preguntas; juez o RAGAS oficial; reportar p95 con/sin Bedrock | 3 | Importante |
| S8 | **X-03 extra** | Memoria, ADRs A1–A13 según el director, evidencias | 5 | Bloqueante |

---

## CSV para Jira (S5–S6)

Pegar en Jira CSV importer (ajustar el mapeo de campos). `Summary` ≤ 255.

```csv
Summary,Issue Type,Priority,Story Points,Sprint,Labels,Description
"[X-01][extra] Spike AWS Educate: inventario de servicios y permisos",Story,Highest,2,S5,extra,"Ver docs/sprint-5/fase1-sprints-corregida.md §2 y historia X-01. DoD: tabla servicio/sí-no. Bloquea US-04 y TK-04."
"[US-08] Aislar facturas por ownerId y restringir mutaciones (Viewer 403)",Story,Highest,2,S5,excel-us-08,"Excel US-08 crit. 1 y 3. Must antes de US-05. No incluye desactivar usuarios."
"[US-05] Chatbot NL: analítica de BD + RAG de mis facturas con citas",Story,Highest,8,S5,excel-us-05,"Excel US-05. Depende de US-08. Historial solo en sesión. SLA 4s local. Sin Claude."
"[X-02][extra] CI mínimo: unitarias backend en cada PR",Story,Low,1,S5,extra,"A12. Recortable. workflow ci.yml Node 20 npm test workspace backend."
"[US-04] Embeddings semánticos (Titan o ONNX según X-01) y reindex",Story,Highest,5,S6,excel-us-04,"Excel US-04. Cierra US-07 ranking. Depende de X-01."
"[US-11] Dashboard de gastos: total, top 5 proveedores, serie mensual COP",Story,Medium,5,S6,excel-us-11,"Excel US-11 Should (no Must). Sin categoría Comprehend."
"[US-12] Exportar facturas propias a CSV",Story,Medium,3,S6,excel-us-12,"Excel US-12 Should Recortable. XLSX opcional."
```
