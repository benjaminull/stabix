#!/bin/bash
set -e

echo "🚀 Stabix Production Setup Script"
echo "=================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Instalar Docker
echo -e "${BLUE}[1/6] Instalando Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# 2. Instalar Docker Compose
echo -e "${BLUE}[2/6] Instalando Docker Compose...${NC}"
apt install docker-compose -y

# 3. Instalar Git
echo -e "${BLUE}[3/6] Instalando Git...${NC}"
apt install git -y

# 4. Configurar Firewall
echo -e "${BLUE}[4/6] Configurando Firewall...${NC}"
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443

# 5. Clonar repositorio
echo -e "${BLUE}[5/6] Clonando repositorio...${NC}"
cd /opt
read -p "URL de tu repositorio Git: " REPO_URL
git clone $REPO_URL stabix
cd stabix

# 6. Configurar variables de entorno
echo -e "${BLUE}[6/6] Configurando variables de entorno...${NC}"
echo ""
echo "Por favor ingresa la siguiente información:"
echo ""

read -p "Tu dominio (ej: miapp.com): " DOMAIN
read -p "Tu email (para SSL): " EMAIL
read -p "Token de Mapbox (opcional, presiona Enter para omitir): " MAPBOX_TOKEN

# Generar password de DB
DB_PASSWORD=$(openssl rand -base64 32)

# Generar Django secret key
DJANGO_SECRET=$(openssl rand -base64 50)

# Crear archivo .env.production
cat > .env.production << EOF
# Database
POSTGRES_DB=stabix
POSTGRES_USER=stabix
POSTGRES_PASSWORD=$DB_PASSWORD

# Domain & Email
DOMAIN=$DOMAIN
CADDY_EMAIL=$EMAIL

# Django
DJANGO_SECRET_KEY=$DJANGO_SECRET
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN
CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# Frontend
NEXT_PUBLIC_API_BASE_URL=https://$DOMAIN/api
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_MAPBOX_TOKEN=$MAPBOX_TOKEN
EOF

echo ""
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo "Ahora ejecuta estos comandos para iniciar la aplicación:"
echo ""
echo "  cd /opt/stabix"
echo "  export \$(cat .env.production | xargs)"
echo "  docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "Esto tomará 5-10 minutos. Luego crea tu superusuario:"
echo ""
echo "  docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser"
echo ""
echo -e "${GREEN}Tu aplicación estará disponible en: https://$DOMAIN${NC}"
