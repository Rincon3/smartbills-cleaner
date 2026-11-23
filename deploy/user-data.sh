#!/bin/bash
# cloud-init. NO poner JWT, POSTGRES_PASSWORD ni keys de AWS aquí.
set -euxo pipefail
dnf update -y
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user || true

install -d -o ec2-user -g ec2-user /opt/smartbills
if [ ! -d /opt/smartbills/.git ]; then
  git clone https://github.com/Rincon3/smartbills-cleaner.git /opt/smartbills
fi

cat >/usr/local/bin/smartbills-wait-env <<'EOF'
#!/bin/bash
echo "Crea /opt/smartbills/.env (desde .env.production.example) y luego:"
echo "  cd /opt/smartbills && docker compose -p smartbills-prod -f docker-compose.prod.yml -f docker-compose.https.yml up -d --build"
EOF
chmod +x /usr/local/bin/smartbills-wait-env
