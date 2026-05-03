#!/usr/bin/env bash
set -euo pipefail

# ─── Stabix Deploy — stabix.app (SSL via Caddy + Let's Encrypt) ──────────────
# Usage: ./deploy-stabix-app.sh
# Run this ON the VPS, from the repo root (/opt/stabix or wherever you cloned)

echo "══════════════════════════════════════════════"
echo "  Stabix Deploy — https://stabix.app"
echo "══════════════════════════════════════════════"

# 1. Generate secrets
DJANGO_SECRET_KEY=$(openssl rand -base64 50 | tr -dc 'a-zA-Z0-9' | head -c 50)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# 2. Mapbox token
read -p "Mapbox token (pk.*): " MAPBOX_TOKEN

# 3. Create .env.production from template
echo "[1/5] Generating .env.production..."
cp .env.production.stabix-app .env.production
sed -i "s|__POSTGRES_PASSWORD__|${POSTGRES_PASSWORD}|g" .env.production
sed -i "s|__DJANGO_SECRET_KEY__|${DJANGO_SECRET_KEY}|g" .env.production
sed -i "s|__MAPBOX_TOKEN__|${MAPBOX_TOKEN}|g" .env.production

# 4. Use SSL Caddyfile
echo "[2/5] Setting up Caddyfile (SSL)..."
cp Caddyfile.stabix-app Caddyfile

# 5. Build and start
echo "[3/5] Building and starting containers..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 6. Wait for services
echo "[4/5] Waiting for services to be ready..."
sleep 15

# 7. Seed (categories + superuser)
echo "[5/5] Running migrations and seed..."
docker compose -f docker-compose.prod.yml --env-file .env.production exec api python manage.py seed

echo ""
echo "══════════════════════════════════════════════"
echo "  Deploy complete!"
echo ""
echo "  App:   https://stabix.app"
echo "  Admin: https://stabix.app/admin/"
echo ""
echo "  Superuser: jose@stabix.cl / stabix2024"
echo "  (Cambiar password en primer login)"
echo "══════════════════════════════════════════════"
