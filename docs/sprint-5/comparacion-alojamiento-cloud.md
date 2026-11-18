# Comparación de alojamiento — SmartBills Cleaner

Fecha: 30 de octubre de 2026.
Propósito: justificar dónde puede alojarse la app para el Sprint 5 y para la tesis.
**No se desplegó nada.** Este documento es una decisión de diseño, no una evidencia de producción.

## 1. Restricciones reales del proyecto

Cualquier opción que no cumpla esto queda fuera:

| Restricción | Por qué | Evidencia |
|---|---|---|
| Contenedor Linux con binarios nativos | El OCR usa `tesseract`, `pdftotext` y `pdftoppm` | `apps/backend/Dockerfile` |
| PostgreSQL con extensión `vector` | Búsqueda y RAG usan `embedding <=>` e índice HNSW | migración `202610080001_pgvector_embeddings` |
| Almacenamiento de archivos persistente | Las facturas viven en disco (`apps/backend/uploads`); un contenedor efímero las pierde | `src/utils/paths.js`, `server.js` línea 24 |
| Frontend estático (Vite) y API Node 20 | El Dockerfile actual del frontend corre `vite` en modo **dev**; en producción hay que hacer `vite build` | `apps/frontend/Dockerfile`, `package.json` |
| Secretos (JWT, AWS, Google) fuera del código | `.env` está en `.gitignore`; `JWT_SECRET` tiene valor por defecto `change-me` | `src/config/env.js` |
| Integraciones AWS opcionales | Bedrock y Textract ya están cableados | `rag/generators.js`, `ocr/cloudOcr.js` |
| Presupuesto de tesis | Demo con pocos usuarios, no alta disponibilidad | Auditoría 24 oct 2026 |

**Queda descartado de entrada:**

- **Vercel / Netlify / Lambda “clásico”** para el backend: no instalan Tesseract ni Poppler, y el filesystem es efímero.
- **AWS App Runner para cuentas nuevas:** AWS deja de aceptar clientes nuevos el **30 de abril de 2026**. No conviene basar la tesis en un servicio en retirada. Sustituto oficial: **Amazon ECS Express Mode**.
- **Lightsail Managed Database** como única base: el plan barato no garantiza `pgvector`. Si se usa Lightsail, Postgres va **dentro del mismo Docker Compose** con la imagen `pgvector/pgvector:pg15` (igual que en local).

## 2. Opciones comparadas

Costos aproximados a octubre 2026, un ambiente de pruebas (1 instancia, 1 base, poco tráfico). No son cotizaciones.

| Criterio | A. AWS Lightsail + Docker Compose | B. AWS ECS Express Mode + RDS pgvector + S3 | C. Render | D. Railway | E. Fly.io | F. GCP Cloud Run + Cloud SQL |
|---|---|---|---|---|---|---|
| Encaje con el código actual | **Alto.** Es el Compose de hoy en una VM. | Alto, pero hay que separar frontend, API, RDS y S3. | Alto: Dockerfile + Postgres con pgvector. | Alto: importa Compose. | Medio-alto: hay que partir Compose. | Medio: hay que reempaquetar. |
| Tesseract / Poppler | Sí (misma imagen). | Sí (imagen en ECR). | Sí (Dockerfile). | Sí. | Sí. | Sí (contenedor). |
| pgvector | Sí, si Postgres va en Compose. | Sí en RDS PostgreSQL (extensión `vector`). | Sí, nativo. | Sí (plantilla aparte). | Sí. | Sí en Cloud SQL. |
| Archivos de facturas | Disco de la VM o volumen. | **S3** (reemplaza `SIMULATED_S3` / `LOCAL`). | Disco persistente (~0,25 USD/GB) o S3 externo. | Volumen. | Volumen. | GCS. |
| HTTPS / dominio | Hay que configurarlo (Nginx o Caddy). | ALB con TLS incluido. | Incluido. | Incluido. | Incluido. | Incluido. |
| CI/CD | GitHub Actions → SSH/`docker compose pull`. | Actions → ECR → Express Mode. | Deploy al hacer push (el CD lo hace Render). | Deploy al hacer push. | `fly deploy` desde Actions. | Cloud Build o Actions. |
| Bedrock / Textract | Misma cuenta AWS, IAM de la VM. | **Mejor:** IAM de tarea, sin keys en `.env`. | Hay que poner keys de AWS en el PaaS (peor). | Igual. | Igual. | Keys cruzadas de AWS. |
| Complejidad operativa | Baja. Tú parcheas la VM. | Media. Más servicios, más tesis “cloud nativo”. | Muy baja. | Muy baja. | Baja-media. | Media. |
| Costo demo / mes | **~12–24 USD** (VM 2–4 GB; Postgres en la misma máquina). | **~40–80 USD** (Fargate + ALB + RDS db.t4g.micro). | **~13 USD** (web 7 + Postgres 6). | **~5–15 USD** (Hobby 5 + uso). | **~10–40 USD** (máquina barata; Postgres gestionado sale más caro). | Variable; Cloud SQL suele ser el ítem caro. |
| Riesgo para la tesis | VM pública mal endurecida. | Costo y curva de IAM. | Vendor lock-in; Bedrock queda “externo”. | Facturación por uso impredecible. | Menos material de clase AWS. | Dos nubes (GCP + AWS). |
| Veredicto | **Recomendada para la primera URL pública.** | **Recomendada como arquitectura objetivo** si el director pide AWS “de verdad”. | Plan B si AWS se atrasa. | Plan B rápido. | Viable, no aporta a la narrativa AWS. | No: duplica nube sin ganancia. |

Fuentes de precio (octubre 2026): [Lightsail](https://aws.amazon.com/lightsail/pricing/), [ECS Express Mode](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html), [Render vs Railway vs Fly](https://www.prisma.io/blog/app-hosting-platforms-with-managed-postgres-2026), [comparativa Docker hosting](https://fly.io/learn/docker-hosting/).

## 3. Decisión propuesta

**Fase 1 (Sprint 5, Must de despliegue):** AWS Lightsail, 1 VM Ubuntu, Docker Compose de producción, Postgres `pgvector` en el mismo host, frontend compilado (`vite build`) servido por Nginx, HTTPS con Caddy o el load balancer de Lightsail (~12–24 USD/mes).

Por qué:

1. El repositorio **ya arranca con Compose**. El salto a una VM es el más corto y el más fácil de demostrar.
2. Bedrock y Textract quedan en la **misma cuenta AWS** que el hosting. Eso justifica AWS frente a Render/Railway: no es “moda”, es coherencia con el pipeline de IA ya cableado.
3. pgvector queda bajo control (misma imagen que en local). No dependemos de que un Postgres gestionado barato active la extensión.
4. App Runner no es opción para cuentas nuevas.

**Fase 2 (si hay tiempo o el director lo pide):** mover Postgres a RDS con `pgvector`, archivos a S3, API a ECS Express Mode. Esa sí es la arquitectura “AWS servicios”. No hace falta para tener una URL de pruebas.

**No elegir ahora:** Render/Railway como destino final (sí como plan B si se bloquea la cuenta AWS). GCP. Vercel para el API.

## 4. Qué hay que cambiar en el código antes de cualquier nube

Sin esto, el despliegue replica los riesgos de la auditoría:

1. El frontend no puede correr `vite dev` en producción (`apps/frontend/Dockerfile`).
2. `/uploads` se sirve **sin JWT** (`server.js`).
3. `JWT_SECRET` no puede quedar en `change-me`.
4. `seedDatabase()` no debe crear usuarios demo en producción.
5. VIEWER puede borrar facturas; hay que restringir mutaciones.
6. Los archivos deben vivir en un volumen o en S3, no en la capa de la imagen.

Esas tareas están en **SBC-58** (endurecimiento) y **SBC-57** (despliegue). Bloquean el “Done” de la URL pública.

## 5. Arquitectura objetivo fase 1 (Lightsail)

```text
Internet
   │ HTTPS (Caddy o LB Lightsail)
   ▼
┌─────────────────────────────────────────┐
│ VM Lightsail (Ubuntu)                   │
│  nginx/caddy  →  frontend estático      │
│  api:4000     →  backend Docker         │
│                 (tesseract + poppler)   │
│  postgres     →  pgvector/pgvector:pg15 │
│  volumen      →  /uploads               │
└───────────────┬─────────────────────────┘
                │ IAM / keys opcionales
                ▼
         AWS Bedrock / Textract
```

## 6. Criterio para defenderlo ante el director

Frase sugerida:

> “Evalué PaaS (Render, Railway, Fly) y tres caminos AWS (Lightsail, ECS Express Mode, App Runner). App Runner no entra: cierra altas nuevas en abril 2026. Render sería más rápido, pero el backend ya depende de Bedrock y Textract, y el OCR necesita binarios nativos. La primera publicación es Lightsail con el mismo Docker Compose que ya corre en local, con Postgres pgvector y persistencia de archivos. Si el siguiente corte pide servicios gestionados, el paso es RDS + S3 + ECS Express Mode, no cambiar de nube.”
