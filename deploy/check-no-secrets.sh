#!/usr/bin/env bash
# Falla si hay secretos reales rastreados. Placeholders de *.example están permitidos.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

tracked_env="$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -vE '\.env\.example$|\.env\.production\.example$' || true)"
if [ -n "$tracked_env" ]; then
  echo "ERROR: un archivo .env está en git" >&2
  echo "$tracked_env" >&2
  exit 1
fi

if git grep -I -E 'AKIA[0-9A-Z]{16}' -- . ':!.github/workflows/cd.yml' ':!deploy/check-no-secrets.sh' >/dev/null; then
  echo "ERROR: posible AWS Access Key en el repo" >&2
  exit 1
fi

if git grep -I -E 'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY' -- . >/dev/null; then
  echo "ERROR: clave privada en el repo" >&2
  exit 1
fi

echo "OK: no hay secretos rastreados"
