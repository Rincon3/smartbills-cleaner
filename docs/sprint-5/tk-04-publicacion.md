# TK-04b (SBC-75) — HTTPS, persistencia y PLAN_A_EC2

Fecha: 2026-11-23  
Cuenta IAM de trabajo: usuario de estudiante (número **no** se publica). Región objetivo: `us-east-2`.

## Qué ya cubre TK-04a (SBC-74)

- Imagen de frontend: Vite build + nginx (`apps/frontend/Dockerfile.prod`).
- Compose de producción: `docker-compose.prod.yml` (proyecto Docker `smartbills-prod`). **No** reemplaza `docker-compose.yml` de desarrollo.
- JWT: `assertProductionSecrets()` rechaza vacío y `change-me`.
- Seed: apagado en `NODE_ENV=production` salvo `ALLOW_SEED=true`.
- Volúmenes: `postgres_data` y `uploads_data`. `/uploads/` público responde **404**.
- Secretos: `.env` gitignored; plantilla `.env.production.example`.

Verificado en local (2026-11-23), sin tumbar el stack de desarrollo (`:4000` / `:5173` / pgAdmin `:5050`):

| Comprobación | Resultado |
|---|---|
| `GET http://127.0.0.1:8080/api/health` | 200 |
| HTML sirve `/assets/index-*.js` (no Vite client) | sí |
| `GET /uploads/…` sin token | 404 |
| Archivo en el volumen `uploads_data` tras `restart` del backend | persistió |
| Arranque con `JWT_SECRET=change-me` | el backend no arranca |

## HTTPS local (Caddy, sin DNS)

```bash
docker compose -p smartbills-prod \
  -f docker-compose.prod.yml -f docker-compose.https.yml up -d caddy
curl -k https://127.0.0.1:8443/api/health
```

Puerto **8443** a propósito: no ocupa 80/443 ni el 8080 de pruebas. Certificado interno (`deploy/Caddyfile.local`). Let's Encrypt **no** se pide en localhost.

## PLAN_A_EC2 — bloqueo de IAM (no hay URL pública todavía)

El ADR `docs/adr/001-hosting-plan-a-b.md` sigue vigente: **t3.small** + Compose + volumen EBS + instance profile para Bedrock. Lightsail descartado. Educate/Vocareum **no** se usa como hosting.

Prueba CLI del 2026-11-23 (usuario IAM de trabajo, `us-east-2`):

| Acción | Resultado |
|---|---|
| `sts:GetCallerIdentity` | OK |
| `ec2:DescribeVpcs` / `DescribeSubnets` | OK |
| `bedrock:ListFoundationModels` (Titan v2 + Nova Lite) | OK |
| `s3:ListAllMyBuckets` | OK (vacío) |
| `ec2:RunInstances` (t3.small, dry-run) | **Denied** |
| `ec2:CreateSecurityGroup` | **Denied** |
| `ec2:DescribeInstances` / `DescribeImages` | **Denied** |
| `iam:CreateRole` / `ListInstanceProfiles` | **Denied** |
| `lightsail:GetInstances` | **Denied** |
| `sts:AssumeRole` sobre `AccountFullAccessRole` | no aplica: trust `account-access.amazonaws.com` |

**Bloqueo:** este IAM user no puede crear la VM ni el instance profile. Por eso **no hay URL HTTPS pública** en este incremento. No se inventó una instancia ni se copiaron keys de Vocareum.

Para desbloquear (quien administre la cuenta adjunta `deploy/iam/operator-ec2-policy.json` al usuario, o lanza la VM a mano):

1. Rol `smartbills-ec2` con trust `deploy/iam/instance-trust.json`.
2. Permisos Bedrock `deploy/iam/instance-bedrock-policy.json` + managed `AmazonSSMManagedInstanceCore`.
3. Instance profile del mismo nombre. IMDSv2 `HttpTokens=required` y **`HttpPutResponseHopLimit=2`** (Compose en bridge).
4. `t3.small` Amazon Linux 2023, disco EBS (no instance store), security group 80/443 (no 22 si hay SSM).
5. User data `deploy/user-data.sh` — **sin secretos**.
6. Crear `/opt/smartbills/.env` en la VM (fuera de git) a partir de `.env.production.example`:
   - `JWT_SECRET` = `openssl rand -hex 48`
   - `POSTGRES_PASSWORD` aleatorio
   - `CORS_ORIGIN=https://<eip-con-guiones>.sslip.io`
   - `PUBLIC_HOST` igual al host de CORS
   - `BEDROCK_USE_INSTANCE_PROFILE=true`
   - **no** `AWS_ACCESS_KEY_ID` (el SDK usa el rol)
   - `ALLOW_SEED=false`
7. `bash /opt/smartbills/deploy/bootstrap-ec2.sh`

Let's Encrypt exige un **nombre DNS**. Sin dominio propio se usa `sslip.io` sobre la Elastic IP. Si Educate bloquea el puerto 80, LE falla: dejar constancia y seguir con TLS interno o un dominio.

GitHub Actions (`.github/workflows/cd.yml`) **no despliega** si faltan `EC2_INSTANCE_ID` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. El workflow queda verde a propósito. No guardar JWT ni keys de Bedrock en GitHub.

## Persistencia

| Dato | Dónde | Sobrevive restart del contenedor | Sobrevive `compose down` **sin** `-v` | Se pierde con |
|---|---|---|---|---|
| Postgres | volumen `postgres_data` | sí | sí | `down -v` o borrar el EBS |
| PDFs / uploads | volumen `uploads_data` | sí | sí | igual |
| Certificados Caddy | volumen `caddy_data` | sí | sí | igual |

No usar `docker compose down -v` en el proyecto `smartbills-prod`. El compose de desarrollo (`smartbills`) no se toca.

## Bedrock

- Plan A: instance profile. `BEDROCK_USE_INSTANCE_PROFILE=true`. Si Invoke falla, RAG extractivo local.
- Plan B (Render): clave **persistente** en el panel, nunca en git. Si no hay, mismo modo degradado.
- No reutilizar keys de sesión de Educate/Vocareum.

## PLAN_B_RENDER (solo si A sigue bloqueada)

Render da HTTPS de fábrica. Hace falta un disco persistente de pago para Postgres y `uploads`. El frontend de Vite build + `/api` proxy es el mismo `Dockerfile.prod`. No se creó servicio Render en esta historia (no hay credenciales de Render en el entorno).

## Criterio de error de la historia

- Educate lab **no** se usó como hosting.
- `GET /uploads/archivo` sin token **no** es 200 (nginx 404).
- Sin `.env` de producción, `change-me` no arranca.
