# Fase 2 — Sprint 5 (solo)

Capacidad: 13 SP comprometidos + 3 buffer. Orden: **X-01 → US-08 → US-05 → X-02**.
Jira: IDs del Excel original (`SmartBillsCleaner_ProductBacklog.xlsx`). X-01 y X-02 son **extra**.
No implementar S6 aquí.

Convención de roles (S5):

- **VIEWER:** lectura de **sus** facturas. 403 en upload/PUT/DELETE.
- **ANALYST:** CRUD **solo** de las suyas.
- **ADMIN:** lectura y mutación de **todas** (soporte/demo). Desactivar usuarios = Won’t.

---

## 1. Inventario `ownerId` — ¿alcanzan 2 SP?

Hoy **ningún** listado/búsqueda/RAG/dashboard filtra por dueño. `ownerId` solo se **escribe** en el upload (`invoiceRoutes.js` ~251). `/uploads` ni siquiera pide JWT.

| # | Superficie | Archivo | Qué hace hoy | Filtro `ownerId` |
|---|---|---|---|---|
| 1 | `GET /api/invoices` | `invoiceRoutes.js` 109–137 | `findMany` por estado/proveedor/fechas | **No** |
| 2 | `GET /api/invoices/search` | `invoiceRoutes.js` 93 + `invoiceSearchService.js` 110 | `buildInvoiceWhere` sin dueño | **No** |
| 3 | `GET /api/invoices/:id` | `invoiceRoutes.js` 139 | `findUnique` por id | **No** (IDOR) |
| 4 | `GET /api/invoices/:id/file` | `invoiceRoutes.js` 152 | Stream del PDF | **No** (IDOR) |
| 5 | `GET /api/invoices/:id/chunks` | `invoiceRoutes.js` 170 | Chunks | **No** (IDOR) |
| 6 | `POST /api/invoices/upload` | `invoiceRoutes.js` 198 | Crea con `ownerId: req.user.id` | Escribe dueño; **no** restringe rol |
| 7 | `PUT /api/invoices/:id` | `invoiceRoutes.js` 282 | Update por id | **No** dueño ni rol |
| 8 | `DELETE /api/invoices/:id` | `invoiceRoutes.js` 336 | Delete por id | **No** dueño ni rol |
| 9 | `GET /api/dashboard/summary` | `dashboardRoutes.js` 6 | `findMany` **todas** las facturas | **No** |
| 10 | `POST /api/query` | `queryRoutes.js` + `retrieve.js` 35–60 | Si no hay filtro SQL, `invoiceIds = null` → **todos** los chunks | **No** |
| 11 | `GET /api/query/source` | `queryService.js` `getChunkSource` | Busca por `chunkId` o `code`+página | **No** |
| 12 | `GET /uploads/:archivo` | `server.js` 24 | `express.static` | **Sin auth** |
| — | `uniqueInvoiceCode` | `invoiceRoutes.js` 54 | `findUnique` por `code` | N/A (unicidad global, no filtra) |
| — | `ensureInvoiceChunksIndexed` | `chunkIndexService.js` | Bootstrap | N/A (sin HTTP) |
| — | FE `InvoicesPage`, `DashboardPage`, `ConsultPage` | `apps/frontend/src/pages/*` | Consumen la API | Se corrigen **solos** si el API filtra |
| — | `GET /api/users`, `/api/audit` | ya `requireRole("ADMIN")` | No es de facturas | Fuera de US-08 |

**Veredicto: 2 SP sí alcanzan** si se hace un único helper y se pasa a esos 12 puntos. No hay 12 diseños distintos.

Patrón (un día de las 8 h):

```js
// apps/backend/src/services/access.js  (nuevo)
export function invoiceWhereFor(user) {
  if (user.role === "ADMIN") return {};
  return { ownerId: user.id };
}
export function canMutateInvoices(user) {
  return user.role === "ADMIN" || user.role === "ANALYST";
}
```

`buildInvoiceWhere` gana `ownerId`/`AND invoiceWhereFor`. `retrieveInvoiceHits` **siempre** resuelve `invoiceIds` con ese `where` (hoy solo lo hace si hay filtro SQL: eso es el agujero del chat).

**No entra en las 2 SP (explícito):**

- Desactivar usuarios (US-08 crit. Excel 2).
- Ocultar ítems del menú en React (el 403 basta; opcional 30 min si sobra).
- Migrar facturas seed a otros dueños (siguen del admin; para la demo de aislamiento **crear un segundo usuario** en la prueba).
- Tests E2E Playwright.

**Si a mitad de sprint no llega:** recortar **X-02 (CI, 1 SP)**, no el aislamiento. Si aún no llega, recortar dashboard (#9) al final del día y **no** recortar IDOR `#3–5, #8, #10–12`.

---

## X-01 — Spike AWS Educate

**Extra.** El Excel asume Textract, Titan y S3 de pago (TK-01, US-04, TK-04). Educate lo desconoce.

**Historia:** Como tesista, quiero un inventario escrito de servicios y permisos de mi cuenta AWS Educate para elegir embeddings, disco y hosting antes de comprometer el S6 y el S7.

| Campo | Valor |
|---|---|
| Estimación | 2 SP |
| Prioridad | Highest (Must) |
| Épica | — (infra) |
| Sprint | S5 · primero |
| Dependencias | Ninguna. **Bloquea** US-04 (S6) y TK-04 (S7). No bloquea US-08 ni US-05 local |
| Excel | — |
| Desvío | Extra. ADR `docs/adr/001-hosting-plan-a-b.md` |

### Criterios Given / When / Then

**Éxito**

1. Given una sesión de lab iniciada, when ejecuto `aws sts get-caller-identity`, then registro Account, Arn y región.
2. Given la consola, when pruebo S3, Textract, Bedrock (Titan/Nova), Lightsail, EC2, RDS (solo wizard), Secrets Manager y ACM, then cada fila queda en sí / AccessDenied / ausente, con captura o error.
3. Given esas filas, when cierro el spike, then el ADR queda con **una** etiqueta: `PLAN_A_LIGHTSAIL` o `PLAN_A_EC2` o `PLAN_B_RENDER`.
4. Given un bucket o VM de prueba, when termino, then los borro (cero recursos huérfanos).

**Vacío / lab inútil**

5. Given que el lab se destruye al *End Lab*, when lo constato, then **no** elijo Plan A aunque Lightsail aparezca en el menú (criterio 2 del ADR en falso → Plan B).

**Error**

6. Given `ExpiredToken` o sesión cortada, when el comando falla, then reintento **una** vez en sesión nueva y documento el límite de minutos; no se inventan permisos.

**Permiso denegado**

7. Given `AccessDenied` en un servicio, when lo registro, then cuenta como “no disponible” para el criterio del ADR (no se insiste con otras cuentas).

### Subtareas

| # | Tarea | Dónde |
|---|---|---|
| 1 | Seguir la tabla de `fase1-sprints-corregida.md` §2 y los comandos CLI | Consola Educate |
| 2 | Rellenar `docs/sprint-5/aws-educate-inventario.md` (crear) | docs |
| 3 | Marcar el ADR 001 con el PLAN_* elegido | `docs/adr/001-hosting-plan-a-b.md` |
| 4 | Comentario en Jira con la frase de decisión | Jira |

No se toca código de la app.

### DoD

- Inventario con las 8 filas de servicio.
- ADR con un PLAN_*.
- Captura de `get-caller-identity` (sin keys).
- Recursos de prueba borrados.

### Riesgos

- Sesión de 1–4 h: hacer S3+Bedrock+Lightsail/EC2 primero.
- Vocareum ≠ cuenta personal: el resultado **no** vale para una AWS de pago posterior; se revalida si cambias de cuenta.
- Pedir model access en Bedrock puede tardar horas: si queda “pending”, US-04 asume ONNX.

---

## US-08 — Aislar facturas y restringir mutaciones

**Excel US-08** (Media). Criterios 1 y 3. Criterio 2 (desactivar) = Won’t S5.

**Historia:** Como usuario autenticado, quiero ver y consultar solo mis facturas, y que un Viewer no pueda cargarlas ni borrarlas, para que el chatbot no mezcle datos de otra persona.

| Campo | Valor |
|---|---|
| Estimación | 2 SP |
| Prioridad | Highest (Must de defensa) |
| Épica | EP-04 Gestión de usuarios y seguridad |
| Sprint | S5 · **antes o en paralelo inmediato de US-05** |
| Dependencias | Ninguna de código. **US-05 no se mergea sin esto** |
| Excel | US-08.1 roles; US-08.3 facturas privadas; US-08.4 log de no autorizado (403 basta; AuditLog de DENY es extra si cabe) |
| Desvío | Sin desactivar usuarios. Sin Cognito. `/uploads` deja de ser estático (cierra R-01 de la auditoría, no estaba literal en US-08) |

### Criterios Given / When / Then

**Éxito**

1. Given usuarios A (ANALYST) y B (ANALYST) con facturas propias, when A hace `GET /api/invoices`, `/search`, `/dashboard/summary` o `POST /api/query`, then no aparecen ids/códigos/chunks de B.
2. Given A autenticado, when A pide `GET /api/invoices/:id/file` de **su** factura, then 200 y el PDF.
3. Given ADMIN, when lista, then ve las de todos (demo/soporte).

**Vacío**

4. Given un ANALYST sin facturas, when lista o pregunta al chat, then lista `[]` / `noEvidence=true`, HTTP 200, no 500.

**Error**

5. Given un `:id` inexistente, when GET/PUT/DELETE, then 404 `{ message: "Factura no encontrada" }` (igual si existe pero es de otro: **404, no 403**, para no filtrar ids).
6. Given token ausente o inválido, when cualquier `/api/invoices*` o `/api/query*`, then 401.

**Permiso denegado**

7. Given VIEWER, when `POST /upload`, `PUT /:id` o `DELETE /:id`, then 403 `{ message: "No tienes permisos para esta accion" }`.
8. Given ANALYST A, when muta una factura de B, then 404 (no es suya).
9. Given URL `/uploads/<archivo>` **sin** `Authorization`, when GET, then **≠ 200** (404 o 401). El archivo solo sale por `/api/invoices/:id/file`.

### Subtareas técnicas

| # | Tarea | Archivos |
|---|---|---|
| 1 | Crear `invoiceWhereFor` / `assertCanReadInvoice` / `canMutateInvoices` | **nuevo** `apps/backend/src/services/access.js` |
| 2 | Meter el where en listado, search y dashboard | `invoiceRoutes.js`, `invoiceSearchService.js` (`buildInvoiceWhere`), `dashboardRoutes.js` |
| 3 | Guardas GET/PUT/DELETE/`file`/`chunks` por id | `invoiceRoutes.js` |
| 4 | RAG: **siempre** calcular `invoiceIds` con el where de dueño | `rag/retrieve.js` (hoy `invoiceIds` queda `null` sin filtros) |
| 5 | `getChunkSource(..., user)` rechaza chunks ajenos | `queryService.js`, `queryRoutes.js` (pasar `req.user`) |
| 6 | `requireRole("ADMIN","ANALYST")` en POST upload, PUT, DELETE | `invoiceRoutes.js` |
| 7 | Quitar `app.use("/uploads", express.static)` | `server.js` |
| 8 | Tests | **nuevo** `apps/backend/src/services/access.test.js`; ampliar `invoiceSearchService.test.js` con `ownerId`; caso en retrieve: sin filtros igual pasa `invoiceIds` |
| 9 | (Opcional <30 min) Ocultar botón Upload si VIEWER | `AppLayout.jsx` |

Ampliar `apps/backend/package.json` script `test` para incluir `src/services/access.test.js`.

### DoD

- Los 12 puntos del inventario filtran o rechazan.
- Tests nuevos en verde (`node --test … access.test.js`).
- GET `/uploads/…` sin token ≠ 200 (comprobado con `curl`).
- Comentario Jira: desactivar usuarios Won’t; ADMIN ve todo.

### Riesgos

- **2 SP justos:** 12 call sites. Mitigación: helper único; no E2E.
- Seed: A y B deben existir para la demo (`analyst@…` y un usuario nuevo). El seed actual ya tiene analyst/viewer; las 14 facturas son del **admin**. La prueba de aislamiento **crea** una factura de prueba o usa upload del analyst — no reasignar las DEMO-VEC a mano en S5.
- 404 vs 403 en IDOR: usar 404 para no enumerar.
- Quitar `/uploads` estático puede romper el visor si el FE aún apunta a esa URL. Verificar `DocumentPreview.jsx` / `getInvoiceFile` (ya usa `/api/invoices/:id/file` — verificado en `client.js`). **OK.**

---

## US-05 — Chatbot NL (analítica + RAG propio)

**Excel US-05** (Alta).

**Historia:** Como analista financiero, quiero preguntar en español por totales, el mayor gasto o el contenido de **mis** facturas y obtener una respuesta citada o un “sin evidencia”, para no abrir documento por documento.

| Campo | Valor |
|---|---|
| Estimación | 8 SP |
| Prioridad | Highest |
| Épica | EP-03 Consultas en lenguaje natural |
| Sprint | S5 |
| Dependencias | **US-08 mergeado.** X-01 no bloquea el modo local |
| Excel | US-05 (ejemplo Q1, &lt;3 s, cita, vacío, historial, chat, Claude) |
| Desvío | A7: no Next.js ni Claude. A10: SLA **4 s** local. Historial **de sesión**, no tabla. Sin SQL generado por LLM (herramientas cerradas) |

### Criterios Given / When / Then

**Éxito — analytics**

1. Given ≥2 facturas **mías** PROCESSED con `total` distinto, when pregunto “¿Cuál fue mi mayor gasto?”, then `mode=analytics`, la respuesta nombra el `code` y el `total` mayores según Prisma (`orderBy total desc take 1`), **sin** citas de página inventadas, `elapsedMs < 4000`.
2. Given facturas mías de un proveedor (p. ej. Enel), when pregunto “¿Cuánto pagué a Enel?”, then `mode=analytics` y la suma `_sum.total` coincide con la BD (filtro `supplier contains`, case-insensitive).
3. Given facturas en marzo 2026, when pregunto “¿Qué facturas tengo de marzo 2026?”, then `mode=analytics` y un listado de `code` de ese mes.

**Éxito — document (RAG existente)**

4. Given chunks míos con “energia”, when pregunto “¿Cuánto pagué de energía eléctrica con Enel?”, then `mode=document`, hay `[Factura …, pág. N]` clicable, Top-5 visible, citas ⊆ chunks recuperados.

**Vacío**

5. Given corpus propio sin arriendos en Madrid, when pregunto el canon de Madrid, then `mode=none` o `document` con `noEvidence=true`, texto que no inventa facturas, HTTP 200.
6. Given ANALYST sin facturas, when pregunta “mayor gasto”, then vacío explícito (“no hay facturas”), no 500.

**Error**

7. Given `question` vacío, when `POST /api/query`, then 400 `La pregunta es requerida` (ya existe).
8. Given el generador/LLM cae, when hay hits, then se usa el generador local (`generateCandidate` ya degrada); el chat **no** devuelve 500.

**Permiso denegado**

9. Given token ausente, when POST `/api/query`, then 401.
10. Given facturas de B, when A pregunta “mayor gasto”, then el máximo es el de **A** (cubre US-08).
11. Given A, when pide `GET /api/query/source` de un chunk de B, then 404.

### Subtareas técnicas

| # | Tarea | Archivos |
|---|---|---|
| 1 | Router de intención: `analytics` / `document` / `none` (palabras: mayor, total, cuántas, suma, trimestre, vs NIT/página/qué dice) | **nuevo** `apps/backend/src/services/chat/intentRouter.js` + `intentRouter.test.js` |
| 2 | Herramientas cerradas: `maxByTotal`, `sumBySupplier`, `countByStatus`, `listByMonth` | **nuevo** `apps/backend/src/services/chat/analyticsService.js` (Prisma + `invoiceWhereFor`) |
| 3 | `queryInvoices` ramifica por `mode`; añade `analytics` al JSON | `queryService.js`, `queryRoutes.js` (pasar `req.user`) |
| 4 | RAG ya acotado por US-08; no reindexar | `rag/retrieve.js` |
| 5 | UI: hilo `messages[]` usuario/asistente; mostrar `mode`; conservar citas clicables y Top-5 solo si `document` | `ConsultPage.jsx`, `app.css` (mínimo) |
| 6 | Preguntas sugeridas: mayor gasto, total Enel, NIT, Madrid | `ConsultPage.jsx` |
| 7 | Tests analytics con Prisma mock o fixtures | `analyticsService.test.js` |
| 8 | Incluir `src/services/chat/*.test.js` en `package.json` `test` | `apps/backend/package.json` |

**No hacer en S5:** tabla `QueryHistory`; NL-to-SQL libre; Bedrock (si X-01 lo da, el consenso actual ya lo usa sin trabajo extra).

### DoD

- Cuatro unitarias: router; mayor gasto; suma proveedor; vacío Madrid (esta última puede seguir en RAG).
- Captura Jira: hilo con 1 analytics + 1 document + 1 vacío.
- `mode` en la respuesta HTTP.
- p95 local &lt; 4 s en una pregunta demo (`elapsedMs` en UI).
- US-08 en `main` o en la misma PR, mergeado **antes**.

### Riesgos

- 8 SP justos si el router se vuelve NLP. Mitigación: **solo reglas/keywords** (español, lista cerrada). Lo que no matchea va a RAG.
- “Servicios públicos Q1” del Excel puede no clasificar categoría (A5). En S5 “servicios públicos” cae a RAG; “mayor gasto” sí es analytics. Documentar en Jira.
- Duplicados `S-FS13928501*` ensucian “mayor gasto”: analytics usa `Invoice.total`, no chunks; igual pueden duplicar suma. Fuera de alcance S5 (dedup = v2 US-15, no este Excel).
- Generador local no dice el monto en modo document (ya visto). Analytics cubre el monto; document cubre la cita. No reabrir embeddings (S6).

---

## X-02 — CI mínimo

**Extra (A12).**

**Historia:** Como tesista, quiero que cada pull request a `main` ejecute las unitarias del backend para no depender de una captura hecha a mano.

| Campo | Valor |
|---|---|
| Estimación | 1 SP |
| Prioridad | Low (Should, recortable) |
| Épica | — |
| Sprint | S5 · al final |
| Dependencias | Ninguna. Recortar **antes** que US-08 |
| Excel | — (el v2 tiene TK-10; no es la fuente) |
| Desvío | Extra. No despliega (CD = S7) |

### Criterios Given / When / Then

**Éxito**

1. Given un PR a `main` con tests sanos, when corre Actions, then el job `test` es verde y ejecuta `npm test --workspace backend`.

**Vacío**

2. Given un repo sin secretos AWS, when corre CI, then **no** falla por keys ausentes (las unitarias actuales no las piden).

**Error**

3. Given un test `assert.equal(1, 2)` en el PR, when corre CI, then el check queda rojo y no se considera mergeable (aunque branch protection sea manual).

**Permiso denegado**

4. N/A (no hay roles). Given un workflow que imprime `env`, when se revisa el YAML, then **no** aparecen `AWS_SECRET`, `JWT_SECRET` ni tokens.

### Subtareas

| # | Tarea | Archivos |
|---|---|---|
| 1 | Workflow `pull_request` + `push` a `main` | **nuevo** `.github/workflows/ci.yml` |
| 2 | `actions/setup-node@v4` Node 20, cache npm, `npm ci`, `npm test --workspace backend` | mismo |
| 3 | Ampliar el glob `test` si US-08/US-05 añadieron archivos | `apps/backend/package.json` |
| 4 | Captura del check para Jira | docs o comentario |

No Docker build en este 1 SP (el Dockerfile con Tesseract pasa de 10 min).

### DoD

- `ci.yml` en el repo.
- Un PR de evidencia (aunque sea vacío) con check verde, o el push a la rama.
- Cero secretos en YAML.

### Riesgos

- `npm ci` en workspaces puede fallar si el lock está desincronizado — correrlo local antes.
- GitHub de repo privado: minutos de Actions; este job es &lt; 2 min.
- Recortable: si S5 se pasa, no se abre S6 por esto.

---

## CSV Jira — solo S5

Archivo: `docs/sprint-5/jira-s5.csv`  
Campos: ID, Resumen, Descripción, Criterios, SP, Prioridad, Épica, Sprint, Etiquetas.

En el importador: mapear Etiquetas → Labels; SP → Story Points; Prioridad Highest/High/Low.

Tras importar, enlazar: X-01 “blocks” US-04 y TK-04 (S6/S7); US-08 “blocks” US-05.
