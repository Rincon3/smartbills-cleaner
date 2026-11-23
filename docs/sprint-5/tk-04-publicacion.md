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

## PLAN_A_EC2 — URL de pruebas (2026-11-23)

El ADR `docs/adr/001-hosting-plan-a-b.md` sigue vigente: **t3.small** + Compose + volumen EBS + instance profile. Lightsail descartado. Educate/Vocareum **no** se usó como hosting. JWT y Postgres se generaron **en la VM**; no hay keys de AWS en git ni en user-data.

**URL:** https://3-143-33-168.sslip.io  
Certificado Let's Encrypt (CN del host sslip.io). SG solo **80/443**. Sin puerto 22. Instance profile `smartbills-ec2` (SSM + Bedrock + S3 read). IMDSv2 hop limit 2. Disco gp3 20 GiB.

| Comprobación pública | Resultado |
|---|---|
| `GET /api/health` | 200 |
| HTML `/assets/index-*.js` (Vite build, no dev) | sí |
| `GET /uploads/…` sin token | 404 |
| Login `ADMIN` | 200 + JWT |
| HTTP :80 | 308 → HTTPS |

Este entorno de **pruebas** arrancó con `ALLOW_SEED=true` para poder entrar (mismos usuarios que el seed local). **No es producción real:** rota esas contraseñas antes de una demo abierta. En un endurecimiento posterior deja `ALLOW_SEED=false`.

`miguelr33` aún **no** tiene `ssm:SendCommand` ni `ec2-instance-connect:SendSSHPublicKey`. El bootstrap se hizo con user-data. CD de GitHub sigue en skip-until-secrets.

Para apagar costos: `aws ec2 stop-instances --region us-east-2 --instance-ids` de la VM `smartbills-prod`. No hacer `terminate` si quieres conservar Postgres/uploads. La Elastic IP sigue cobrando si queda huérfana: asociarla o liberarla.

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

## PLAN_B_RENDER

No se usó: Plan A ya tiene URL HTTPS. Queda como respaldo si Educate recorta EC2.

## Criterio de error de la historia

- Educate lab **no** se usó como hosting.
- `GET /uploads/archivo` sin token **no** es 200 (nginx 404).
- Sin `.env` de producción, `change-me` no arranca.
