# ADR 001 — Hosting de la URL de pruebas

- Estado: **aceptado — PLAN_A_EC2**
- Fecha: 2026-11-05 · cerrado X-01 2026-11-06
- Decisores: Miguel (PO/Dev)
- Cuenta: AWS Educate estudiante estándar, IAM user, región **us-east-2** (no es lab Vocareum)

## Contexto

SmartBills necesita Linux con Tesseract y Poppler, PostgreSQL `pgvector`, disco persistente, HTTPS y secretos fuera del git. App Runner no admite altas nuevas. Vercel/Lambda no instalan Tesseract.

## Decisión

**PLAN_A_EC2.** TK-04 (S7) publica en una instancia **t3.small** (us-east-2) con Docker Compose, Postgres en el host, volumen o S3 para `uploads`, TLS en Caddy/Nginx. Bedrock va con **instance profile** (rol IAM), no keys de sesión.

Justificación (X-01):

1. STS, S3 y Bedrock (Titan Embed v2 + `amazon.nova-lite-v1:0` ON_DEMAND) responden en esta cuenta.
2. Prueba manual: **t3.small**, Docker corre. RAM = 2 GiB de la familia (medición `free -h` y USD/mes: **pendiente** de anotar al destruir/confirmar la factura).
3. Lightsail no admite rol IAM en la VM; EC2 sí (`--iam-instance-profile`). Por eso no es Lightsail.

**Respaldo: PLAN_B_RENDER** si el costo mensual no cabe, Educate recorta EC2, o Docker no sostiene 2 GB reales en la demo.

S3 está disponible (crear/subir/borrar, bucket de prueba eliminado). Textract no entra. No se publica nada en el S5.

## Consecuencias

- US-04 usa Titan v2 dim 1024. RAG de texto: Nova Lite; si Invoke falla, extractivo local.
- TK-04 implementa **solo** Plan A EC2 (Plan B solo si A se cae).
- Inventario: `docs/sprint-5/aws-educate-inventario.md`.
