# Backlog Sprint 5 · copiar a Jira

Fuente: código en `apps/backend` / `apps/frontend` y auditoría del 24 oct 2026.
**Jira no se actualizó desde aquí.** Crear las issues, pegar descripción, criterios, SP y subtareas. Si un ID `SBC-5x` ya existe, usa el siguiente número libre.

Estimación: **1 SP ≈ 4 h**. Responsable: Miguel.
Capacidad sugerida del sprint: **20 SP**.

---

## Cómo queda el Product Backlog (MoSCoW)

| Prioridad | ID | Título | SP | Notas |
|---|---|---|---|---|
| Must S5 | **SBC-54** | CI/CD en GitHub Actions | 5 | Primero CI; CD queda listo pero el deploy real es SBC-57 |
| Must S5 | **SBC-55** | Chatbot de consultas sobre BD y facturas revisadas | 8 | Evoluciona SBC-25 y SBC-17; no reabrirlas |
| Must S5 | **SBC-56** | Formalizar decisión de alojamiento | 1 | El análisis ya está en `docs/sprint-5/comparacion-alojamiento-cloud.md` |
| Must S5 | **SBC-58** | Endurecimiento previo a publicar | 3 | Bloquea SBC-57 (uploads, JWT, roles, seed) |
| Should S5 / Must S6 | **SBC-57** | Despliegue en AWS Lightsail | 8 | Si no cabe, se parte: “URL de pruebas” en S6 |
| Should | **SBC-47** | Dashboard en COP, datos reales | 5 | Ya estaba |
| Could | **SBC-7** | Soft-delete | 3 | Ya estaba |
| Could | Spike HF-ONNX | Embedding multilingüe | 2 | Sigue valiendo; el chatbot lo agradece |
| Won’t S5 | **SBC-43** | Obligaciones de tránsito | 8 | Sigue sin criterios |

Orden de ejecución: **54 → 58 → 55** en paralelo suave; **56** es documental (corta); **57** al final, bloqueada por 54+58+56.

Suma Must S5: 54+55+56+58 = **17 SP**. Cabe. SBC-57 (8) entra solo si se recorta el chatbot o se alarga el sprint.

SBC-25 y SBC-17 **no se reabren**. Quedan Done como infraestructura (búsqueda híbrida + RAG citado). El chatbot es la nueva capa de experiencia.

---

## SBC-54 — CI/CD del monorepo

**Tipo:** Historia · **Prio:** Must · **SP:** 5 · **Sprint:** 5

**Historia:** Como equipo, quiero integración continua en GitHub para que cada pull request ejecute las pruebas y construya las imágenes, y para que `main` deje un artefacto desplegable.

### Contexto (pegar en descripción)

Hoy no hay `.github/workflows`. Las 24 unitarias se corren a mano (`npm test` en el workspace backend). El backend Docker sí instala Tesseract y Poppler; el frontend Docker ejecuta Vite en modo **dev**, no sirve para un pipeline de producción.

El CD de este ticket **no publica todavía a la nube**. Publicar es SBC-57. Aquí se deja el job de deploy como `workflow_dispatch` o como job que solo corre si existe el secreto `LIGHTSAIL_HOST`.

### Alcance

- Repositorio: `github.com/Rincon3/smartbills-cleaner`
- Rama protegida objetivo: `main`
- CI en cada PR a `main`: unitarias backend + build frontend (`vite build`)
- Build de imagen backend (Dockerfile actual, con Tesseract)
- No imprimir secretos en logs
- No se exige E2E ni levantar Postgres en CI en esta historia (las unitarias actuales no tocan BD)

### Criterios de aceptación / DoD

1. Existe `.github/workflows/ci.yml` versionado.
2. Un PR que rompa una unitaria deja el check en rojo. Evidencia: captura del check de GitHub o del log.
3. `npm test --workspace backend` corre en Ubuntu y pasa las 24 pruebas.
4. `npm run build --workspace frontend` corre en el mismo workflow y genera `dist/`.
5. Job separado (o el mismo, cacheado) construye `apps/backend/Dockerfile` con `docker build`.
6. Hay `.github/workflows/cd.yml` (o un job `deploy`) disparado a mano o al pushear `main`, que **falla de forma explícita y segura** si faltan secretos (no despliega a producción inventada).
7. README (o `docs/sprint-5/ci-cd.md`) dice: qué dispara el pipeline, qué secretos hacen falta, cómo ver el resultado.
8. Ningún secreto (`JWT_SECRET`, AWS, Google) aparece en YAML ni en logs de ejemplo.
9. No se usa `npm i prisma@latest` ni se cambia de major de Prisma en este ticket.

### Especificación técnica

- Trigger CI: `pull_request` y `push` a `main`.
- Node: 20 (igual que `.nvmrc` / Dockerfile).
- `npm ci` en la raíz del monorepo (workspaces).
- Tests: el script ya definido en `apps/backend/package.json` → `"test"`.
- Docker backend: `docker build -f apps/backend/Dockerfile .` desde la raíz (el Dockerfile hace `COPY` del monorepo).
- Cache: `actions/setup-node` cache npm; opcional `docker/setup-buildx` + cache GitHub Actions.
- CD mínimo: `workflow_dispatch` con input `environment=staging`. Pasos: login a un registry (GHCR o ECR) **solo si el secreto existe**; si no, `echo "CD skipped"` y exit 0. Así el archivo existe sin bloquear a quien no tenga cuenta cloud.
- Branch protection (manual, fuera del YAML): exigir el check `ci` para mergear a `main`. Si el plan de GitHub no lo permite, documentarlo en el ticket y dejar el workflow igual.

### Subtareas (crear como Sub-task)

| ID sugerido | Título | SP | Notas |
|---|---|---|---|
| SBC-54-1 | Workflow `ci.yml`: checkout, Node 20, `npm ci`, `npm test --workspace backend` | 1 | DoD: 24 pass en Actions |
| SBC-54-2 | Añadir `vite build` del frontend al CI | 1 | El Dockerfile actual no lo hace |
| SBC-54-3 | Job `docker-backend`: build de `apps/backend/Dockerfile` | 1 | Timeout ≥ 15 min (Tesseract en apt) |
| SBC-54-4 | Workflow `cd.yml` con `workflow_dispatch` y skip seguro sin secretos | 1 | No desplegar de verdad |
| SBC-54-5 | Documentar pipeline + captura de PR en verde para Jira | 1 | Confluence o `docs/sprint-5/ci-cd.md` |

### Fuera de alcance

- Desplegar a Lightsail/ECS (SBC-57).
- Pruebas de integración con Postgres.
- E2E Playwright.
- Imagen de producción del frontend (sí se **compila** en CI; servirla con Nginx es SBC-57).

---

## SBC-55 — Chatbot de consultas sobre la BD y facturas revisadas

**Tipo:** Historia · **Prio:** Must · **SP:** 8 · **Sprint:** 5
**Reemplaza en UX a:** el formulario de búsqueda avanzada como forma principal de preguntar.
**No borra:** el listado CRUD de Facturas ni el pipeline RAG (SBC-29).

**Historia:** Como analista, quiero un chatbot en español que responda tanto preguntas de negocio sobre la base de datos (totales, conteos, filtros) como preguntas sobre el contenido de las facturas **ya revisadas**, con citas a factura y página.

### Problema actual (pegar)

Hoy hay dos pantallas distintas:

1. **Facturas** (`/app/invoices`): búsqueda híbrida SQL + pgvector. Devuelve una **lista**, no una respuesta. Sin filtros, el ranking semántico es débil (`hashed-bow-96-v2`).
2. **Consultas** (`/app/consult`): una pregunta suelta + RAG. El generador local **cita la fuente correcta pero a menudo no responde el dato** (NIT, monto). No hay historial de conversación. Indexa **todas** las facturas, incluidas `ERROR`, duplicados y seed.

El usuario no quiere “buscar y luego abrir”. Quiere preguntar.

### Definición de “factura revisada”

Una factura entra al corpus del chatbot si cumple **las dos**:

1. `status = PROCESSED`
2. Existe un evento de auditoría `EDIT` sobre esa factura **o** el usuario marcó “Revisada” en el editor (nuevo campo `reviewedAt` en `Invoice`, nullable).

Las `DEMO-VEC-*` y el seed **no** cuentan como revisadas hasta que alguien las marque. Si no hay ninguna revisada, el chatbot lo dice y no inventa.

Si se prefiere no migrar, el MVP acepta solo `status = PROCESSED` **y** `ocrEngine != 'none' y != 'seed-text'`. Documentar la regla elegida en el ticket.

### Criterios de aceptación / DoD

1. Nueva UI de chat en `/app/consult` (hilo: usuario / asistente, scroll, input persistente). El formulario de búsqueda avanzada **deja de ser el centro** de Consultas. El listado de Facturas se queda para ver, editar y borrar.
2. El backend clasifica la pregunta en uno de tres modos y lo **devuelve en la respuesta** (`mode: "analytics" | "document" | "none"`):
   - **analytics:** agregados o filtros sobre tablas (`User` no; solo `Invoice` / `InvoiceField`).
   - **document:** RAG solo sobre facturas revisadas.
   - **none:** “no puedo responder con evidencia”.
3. Preguntas analytics mínimas que deben funcionar con las facturas actuales:
   - “¿Cuántas facturas hay y cuántas están en ERROR?”
   - “¿Cuál es el total pagado a Enel Colombia?”
   - “¿Qué facturas hay de marzo 2026?”
   Respuesta en español, números tomados de SQL/Prisma, **sin citar páginas inventadas**. Si cita, cita el `code` de la factura.
4. Preguntas document: mismas de SBC-17 (NIT, energía Enel, papelería, arriendo Madrid) pero **el corpus es solo revisadas**. La de Madrid sigue en “sin evidencia”.
5. Citas siguen el formato `[Factura CODIGO, pág. N]`; las inventadas se siguen descartando (`verifyAnswerCitations`).
6. Top-5 visible solo en modo `document`. En `analytics` se muestra la tabla o el KPI, no fragmentos irrelevantes.
7. p95 de una pregunta del demo **< 4 s** en local, sin Bedrock (igual que SBC-17). Medir con el script de perf o un log `elapsedMs`.
8. Si no hay facturas revisadas, mensaje explícito, HTTP 200, `noEvidence: true`.
9. Errores de LLM/nube no tumban el chat: mismo patrón de degradación que `generateCandidate`.
10. 4 pruebas unitarias nuevas: router de intención (analytics vs document vs none), filtro de corpus revisado, agregación de total por proveedor, “sin revisadas”.
11. Captura de Jira: hilo con una pregunta analytics y una document.

### Especificación técnica

**No hacer NL-to-SQL libre** (el modelo podría inventar SQL). El MVP es un **router + herramientas cerradas**:

| Intención | Señales (ejemplos) | Herramienta |
|---|---|---|
| `count_by_status` | “cuántas”, “en error”, “procesadas” | `prisma.invoice.groupBy({ by: ['status'] })` |
| `sum_by_supplier` | “total pagado”, “cuánto pagué a X” | `aggregate({ _sum: { total } })` con `supplier contains` |
| `list_by_date` | “marzo”, “entre”, “últimas” | `findMany` + `issueDate` |
| `document_qa` | “NIT”, “qué dice”, “página”, conceptos | RAG actual con `invoiceIds` = revisadas |
| `none` | fuera de dominio | texto fijo de abstención |

Implementación sugerida:

- `POST /api/query` se **amplía** (no hace falta otro path): el body sigue `{ question, ...filters }` y la respuesta gana `mode`, `analytics` (objeto opcional) y `messages` no se persisten en BD en este sprint (solo estado React).
- Nuevo módulo `src/services/chat/intentRouter.js` + `analyticsService.js`.
- `retrieveInvoiceHits` recibe `reviewedOnly: true` y añade el `where` de facturas revisadas.
- Frontend: `ConsultPage.jsx` pasa de un shot a un array `messages[]`. Reutilizar citas clicables y `GET /api/query/source`.
- `InvoicesPage.jsx`: el `AdvancedSearchForm` puede quedar como filtro del **listado** (CRUD), no como chatbot.

### Subtareas

| ID sugerido | Título | SP |
|---|---|---|
| SBC-55-1 | Definir y persistir `reviewedAt` (migración Prisma) o documentar la regla PROCESSED | 1 |
| SBC-55-2 | Router de intención + `analyticsService` (count, sum, list) | 2 |
| SBC-55-3 | RAG acotado a facturas revisadas; `mode` en `queryInvoices` | 2 |
| SBC-55-4 | UI chatbot (historial, modos, vacío, latencia) en `ConsultPage` | 2 |
| SBC-55-5 | Pruebas unitarias + captura DoD | 1 |

### Fuera de alcance

- Reemplazar `hashed-bow-96-v2` (sigue el spike HF-ONNX).
- Activar Bedrock (sigue opcional; si hay keys, el consenso actual se reutiliza).
- Memoria de conversación en Postgres.
- Multi-turno con correferencia compleja (“y la de esa misma empresa”). V1 puede tratar cada turno como pregunta independiente, mostrando el hilo solo en UI.

---

## SBC-56 — Formalizar la decisión de alojamiento

**Tipo:** Tarea / Spike de cierre · **Prio:** Must · **SP:** 1 · **Sprint:** 5

**Historia:** Como tesista, quiero dejar por escrito por qué la app se publica en AWS Lightsail (fase 1) y no en App Runner, Render u otro PaaS, para defenderlo en seguimiento.

### DoD

1. El documento `docs/sprint-5/comparacion-alojamiento-cloud.md` queda enlazado en Confluence y en la descripción de Jira.
2. Comentario en Jira con la decisión en 5 líneas (fase 1 Lightsail, fase 2 ECS+RDS+S3, App Runner descartado).
3. El director o el propio autor marca la issue como Done tras pegarlo. **No hay código.**

Si el director elige Render u otra opción, se actualiza **una** frase en SBC-57 y se reestima. No se reescribe el chatbot.

---

## SBC-58 — Endurecimiento previo a publicar

**Tipo:** Historia técnica · **Prio:** Must · **SP:** 3 · **Sprint:** 5
**Bloquea:** SBC-57

**Historia:** Como operador, quiero cerrar los huecos de seguridad y de arranque que la auditoría encontró, antes de exponer la app a internet.

Hallazgos (auditoría 24 oct):

- R-01: `GET /uploads/<archivo>` responde **200 sin token**.
- R-03: VIEWER puede `POST /upload`, `PUT` y `DELETE` cualquier factura.
- R-10: `JWT_SECRET` por defecto `change-me`.
- El `bootstrap()` ejecuta `seedDatabase()` siempre.

### DoD

1. `/uploads` deja de ser `express.static` público. El archivo solo se sirve por `GET /api/invoices/:id/file` (ya autenticado).
2. Mutaciones de facturas (`upload`, `PUT`, `DELETE`) exigen `ADMIN` o `ANALYST`. VIEWER es solo lectura.
3. Si `NODE_ENV=production` y `JWT_SECRET` es vacío o `change-me`, el proceso **no arranca**.
4. Seed de usuarios demo **no corre** cuando `NODE_ENV=production` (variable `SKIP_SEED=true` o equivalente).
5. Prueba unitaria o de ruta: upload sin token → 401; VIEWER delete → 403.
6. Captura o log de arranque rechazado con secret débil (puede ser test de `env.js`).

### Subtareas

| ID | Título | SP |
|---|---|---|
| SBC-58-1 | Quitar static `/uploads`; dejar solo el stream autenticado | 1 |
| SBC-58-2 | `requireRole("ADMIN","ANALYST")` en mutaciones de `invoiceRoutes` | 1 |
| SBC-58-3 | Guardas de `JWT_SECRET` y seed en producción + test | 1 |

### Fuera de alcance

- Soft-delete (SBC-7).
- Transacciones Prisma en upload (deuda, no bloquea la URL).
- Corregir `parseMoney` (sí es un bug de OCR; no bloquea desplegar).

---

## SBC-57 — Despliegue en AWS Lightsail (primera URL)

**Tipo:** Historia · **Prio:** Should S5 / Must S6 · **SP:** 8
**Dependencias:** SBC-54 (CI), SBC-56 (decisión), SBC-58 (seguridad)

**Historia:** Como tesista, quiero una URL HTTPS de pruebas con el mismo flujo de login → carga → chatbot, para demostrar el sistema fuera de `localhost`.

### Decisión de infraestructura (resumen)

Fase 1: **Lightsail 2–4 GB + Docker Compose de producción**. Postgres `pgvector/pgvector:pg15` en el mismo host. Frontend: `vite build` + Nginx. Certificado TLS. Volumen para `uploads`.

No usar App Runner (cierre de altas nuevas 30 abr 2026). ECS + RDS + S3 queda como fase 2, fuera de este ticket salvo que el director lo pida (entonces reestimar a 13 SP).

### Criterios de aceptación / DoD

1. `docker-compose.prod.yml` (o override) **sin bind mounts de código**, **sin** `vite dev`, **sin** pgAdmin expuesto a 0.0.0.0.
2. Dockerfile de frontend: `vite build` y un stage Nginx que sirve `dist/` y hace proxy `/api` → backend.
3. Variables de producción documentadas en `.env.example` (nombres, no valores): `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV`, `VITE_API_URL`.
4. `prisma migrate deploy` corre al arrancar el backend (ya está en el Dockerfile).
5. Volumen Docker para `uploads`.
6. Healthcheck HTTP de `/api/health`.
7. URL pública HTTPS abre el login; usuario **no demo** o demo rotado; `GET /uploads/...` sin cookie/token no lista archivos.
8. Checklist de demo en la URL: login, dashboard, una consulta analytics, una consulta document (si hay factura revisada).
9. Runbook de 1 página: crear la instancia, copiar el compose, poner secretos, `up -d`, ver logs, respaldo (`pg_dump`).
10. Evidencia: captura de la URL + `curl https://…/api/health`.

### Subtareas

| ID | Título | SP | Prerrequisito |
|---|---|---|---|
| SBC-57-1 | `Dockerfile` de frontend multi-stage (build + nginx) | 1 | — |
| SBC-57-2 | `docker-compose.prod.yml`: api, web, postgres pgvector, volumen, healthcheck | 2 | 57-1, SBC-58 |
| SBC-57-3 | Provisionar Lightsail, DNS/HTTPS, secretos, `migrate deploy` | 3 | 57-2, SBC-56 |
| SBC-57-4 | Conectar CD opcional: job de `cd.yml` hace `docker compose pull && up -d` por SSH | 1 | SBC-54-4 |
| SBC-57-5 | Runbook + capturas DoD de la URL | 1 | 57-3 |

### Criterio de “ambiente listo”

| Check | Cómo |
|---|---|
| API | `curl -fsS https://<host>/api/health` → `{"status":"ok"}` |
| Front | Login visible, sin errores de CORS |
| BD | `\dx` muestra `vector` |
| Archivos | Subir un PDF y recargar el servidor: el archivo sigue ahí (volumen) |
| Secretos | `JWT_SECRET` ≠ `change-me`; `.env` no está en git |

### Fuera de alcance

- Multi-AZ, backups automáticos RDS, WAF, CloudWatch alarma.
- Dominio propio de pago si no hay (Lightsail da IP; HTTPS con IP es incómodo: usar el DNS gratuito de Lightsail o un dominio de estudiante).
- Document AI/Textract en producción (siguen opcionales).

---

## Textos cortos para pegar en Jira (campo Description)

### SBC-54

```
h2. Historia
Como equipo, quiero CI/CD en GitHub Actions para validar cada PR y dejar un artefacto desplegable.

h2. DoD
* ci.yml en PR a main: npm ci + 24 unitarias backend + vite build
* docker build del Dockerfile del backend (Tesseract/Poppler)
* cd.yml con workflow_dispatch; si faltan secretos, skip seguro (no despliega)
* README/docs del pipeline
* 1 SP ≈ 4 h · Total 5 SP
* Fuera: publicar a la nube (SBC-57), E2E, Postgres en CI
```

### SBC-55

```
h2. Historia
Como analista, quiero un chatbot en español que consulte la BD (totales, conteos) y el contenido de facturas *revisadas*, con citas [Factura CODIGO, pág. N].

h2. DoD
* /app/consult es un hilo de chat (no un formulario suelto)
* mode = analytics | document | none
* Analytics: conteo por estado, total por proveedor, listado por mes — datos de Prisma, sin SQL libre
* Document: RAG actual acotado a facturas revisadas (reviewedAt o PROCESSED no seed)
* Sin evidencia explícito; p95 < 4 s en local sin Bedrock
* 4 unitarias nuevas + capturas
* Total 8 SP
* No reabrir SBC-25/17. Listado CRUD de facturas se mantiene.
```

### SBC-56

```
Decisión ya redactada en docs/sprint-5/comparacion-alojamiento-cloud.md
Fase 1: AWS Lightsail + Compose. Fase 2: ECS Express Mode + RDS pgvector + S3.
Descartado: App Runner (cierre de altas 30-abr-2026), Vercel para el API, GCP.
SP: 1 (pegar en Confluence). Sin código.
```

### SBC-58

```
Cerrar R-01, R-03 y R-10 de la auditoría antes de publicar:
* /uploads ya no es estático público
* VIEWER no muta facturas
* JWT_SECRET débil impide arrancar en production
* seed no corre en production
3 SP. Bloquea SBC-57.
```

### SBC-57

```
h2. Historia
Como tesista, quiero una URL HTTPS de pruebas en AWS Lightsail con login → carga → chatbot.

h2. DoD
* compose de producción (sin vite dev, sin bind mounts)
* frontend multi-stage nginx
* volumen uploads + healthcheck + migrate deploy
* runbook + curl /api/health en HTTPS
8 SP. Depende de SBC-54, 56 y 58.
```

---

## Historias viejas: qué hacer en Jira

| ID | Acción |
|---|---|
| SBC-15, 29, 30, 31, 32, 25, 17, 23, 24 | Dejar Done. En SBC-25 añadir comentario: “la UX de pregunta pasa a SBC-55; el endpoint `/invoices/search` permanece para el listado”. |
| SBC-53 | Si la documentación S4 ya se pegó, Done; si no, cerrarla citando `docs/sprint-4/` y esta carpeta `docs/sprint-5/`. |
| SBC-8 | Comentario: nube opcional, sin SQS. No reabrir. |
| SBC-47, SBC-7 | Siguen Should/Could. No las mezcles con el chatbot. |
| SBC-43 | Won’t hasta reescribir criterios. |
