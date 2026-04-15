#!/usr/bin/env bash
set -euo pipefail

# ─── Stabix Deploy Script (IP-only, no SSL) ───────────────────────────────────
# Usage: ./deploy.sh <VPS_IP>
# Example: ./deploy.sh 95.217.123.45

if [ $# -lt 1 ]; then
  echo "Usage: ./deploy.sh <VPS_IP>"
  echo "Example: ./deploy.sh 95.217.123.45"
  exit 1
fi

VPS_IP="$1"

echo "══════════════════════════════════════════════"
echo "  Stabix Deploy — http://${VPS_IP}"
echo "══════════════════════════════════════════════"

# 1. Generate secrets
DJANGO_SECRET_KEY=$(openssl rand -base64 50 | tr -dc 'a-zA-Z0-9' | head -c 50)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

echo "[1/5] Generating .env.production..."

# 2. Create .env.production from template
cp .env.production.sin-dominio .env.production
sed -i "s|TU_IP_DEL_VPS|${VPS_IP}|g" .env.production
sed -i "s|CAMBIA_ESTO_PASSWORD_SEGURO|${POSTGRES_PASSWORD}|g" .env.production
sed -i "s|CAMBIA_ESTO_GENERA_UNO_NUEVO|${DJANGO_SECRET_KEY}|g" .env.production

echo "[2/5] Setting up Caddyfile (no SSL)..."

# 3. Use the no-SSL Caddyfile
cp Caddyfile.sin-ssl Caddyfile

echo "[3/5] Building and starting containers..."

# 4. Build and start
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "[4/5] Waiting for services to be ready..."
sleep 15

echo "[5/5] Running migrations and seed..."

# 5. Run seed data
docker compose -f docker-compose.prod.yml exec api python manage.py seed

echo ""
echo "══════════════════════════════════════════════"
echo "  Deploy complete!"
echo "  App:   http://${VPS_IP}"
echo "  Admin: http://${VPS_IP}/admin"
echo ""
echo "  Create superuser:"
echo "  docker compose -f docker-compose.prod.yml exec api python manage.py createsuperuser"
echo "══════════════════════════════════════════════"
