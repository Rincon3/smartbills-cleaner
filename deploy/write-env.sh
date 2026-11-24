#!/usr/bin/env bash
# Genera /opt/smartbills/.env en la VM. No imprimas el archivo.
set -euo pipefail
HOST="${1:?falta PUBLIC_HOST}"
cd /opt/smartbills
if [ -f .env ]; then
  echo ".env ya existe"
  exit 0
fi
umask 077
JWT_SECRET="$(openssl rand -hex 48)"
POSTGRES_PASSWORD="$(openssl rand -hex 16)"
cat > .env <<EOF
NODE_ENV=production
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
CORS_ORIGIN=https://${HOST}
HTTP_PORT=8080
ALLOW_SEED=false
AWS_REGION=us-east-2
BEDROCK_USE_INSTANCE_PROFILE=true
PUBLIC_HOST=${HOST}
HTTPS_PORT=443
CADDY_HTTP_PORT=80
CADDYFILE=./deploy/Caddyfile
CADDY_EMAIL=admin@${HOST}
EMBEDDING_MODEL=amazon.titan-embed-text-v2:0
BEDROCK_BASE_MODEL=amazon.nova-lite-v1:0
BEDROCK_ADJUSTED_MODEL=amazon.nova-lite-v1:0
RAG_TOP_K=3
MIN_RETRIEVAL_SCORE=0.32
EOF
chown ec2-user:ec2-user .env
chmod 600 .env
echo "env-ok"
