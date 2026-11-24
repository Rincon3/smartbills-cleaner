#!/bin/bash
# cloud-init. NO poner JWT, POSTGRES_PASSWORD ni keys de AWS aquí.
set -euxo pipefail

if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
swapon /swapfile || true

dnf install -y docker git
if ! dnf install -y docker-compose-plugin; then
  mkdir -p /usr/libexec/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-x86_64" \
    -o /usr/libexec/docker/cli-plugins/docker-compose
  chmod +x /usr/libexec/docker/cli-plugins/docker-compose
fi
systemctl enable --now docker
usermod -aG docker ec2-user || true

export HOME=/root
install -d -o ec2-user -g ec2-user /opt/smartbills
git config --system --add safe.directory /opt/smartbills || true
if [ ! -d /opt/smartbills/.git ]; then
  git clone --branch feature/sbc-75-publish --depth 1 \
    https://github.com/Rincon3/smartbills-cleaner.git /opt/smartbills
  chown -R ec2-user:ec2-user /opt/smartbills
fi
