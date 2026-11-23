#!/usr/bin/env bash
# Corre EN la instancia (SSM/SSH) cuando ya existe /opt/smartbills/.env
# No imprime secretos.
set -euo pipefail
cd /opt/smartbills

if [ ! -f .env ]; then
  echo "Falta /opt/smartbills/.env. Cópialo desde .env.production.example (fuera de git)." >&2
  exit 1
fi

if grep -qE '^JWT_SECRET=(change-me)?[[:space:]]*$' .env; then
  echo "JWT_SECRET no puede estar vacío ni ser change-me." >&2
  exit 1
fi

git fetch origin
git checkout "${SMARTBILLS_REF:-main}"
git pull --ff-only origin "${SMARTBILLS_REF:-main}" || true

export CADDYFILE=./deploy/Caddyfile
export CADDY_HTTP_PORT=80
export HTTPS_PORT=443

docker compose -p smartbills-prod -f docker-compose.prod.yml -f docker-compose.https.yml up -d --build
docker compose -p smartbills-prod -f docker-compose.prod.yml -f docker-compose.https.yml ps
