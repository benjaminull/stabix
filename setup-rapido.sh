#!/bin/bash
# Setup rápido de Stabix en VPS (SIN dominio)

set -e

echo "🚀 Stabix - Setup Rápido"
echo "========================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detectar IP pública
echo -e "${BLUE}Detectando IP pública del servidor...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipecho.net/plain)
echo -e "${GREEN}✓ IP detectada: $PUBLIC_IP${NC}"
echo ""

# Confirmar IP
read -p "¿Es correcta esta IP? (y/n): " CONFIRM_IP
if [ "$CONFIRM_IP" != "y" ]; then
    read -p "Ingresa la IP correcta: " PUBLIC_IP
fi

echo ""
echo -e "${BLUE}[1/5] Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    echo -e "${GREEN}✓ Docker instalado${NC}"
else
    echo -e "${GREEN}✓ Docker ya instalado${NC}"
fi

echo ""
echo -e "${BLUE}[2/5] Instalando Docker Compose y Git...${NC}"
apt update -qq
apt install -y docker-compose git

echo ""
echo -e "${BLUE}[3/5] Configurando Firewall...${NC}"
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443
echo -e "${GREEN}✓ Firewall configurado${NC}"

echo ""
echo -e "${BLUE}[4/5] Configurando aplicación...${NC}"

# Obtener token de Mapbox (opcional)
echo ""
read -p "Token de Mapbox (opcional, presiona Enter para omitir): " MAPBOX_TOKEN
echo ""

# Generar passwords seguros
DB_PASSWORD=$(openssl rand -base64 32)
DJANGO_SECRET=$(openssl rand -base64 50)

# Crear .env.production
cat > .env.production << EOF
POSTGRES_DB=stabix
POSTGRES_USER=stabix
POSTGRES_PASSWORD=$DB_PASSWORD

DOMAIN=$PUBLIC_IP
CADDY_EMAIL=admin@localhost
ENABLE_SSL=False

DJANGO_SECRET_KEY=$DJANGO_SECRET
ALLOWED_HOSTS=$PUBLIC_IP,localhost
CORS_ALLOWED_ORIGINS=http://$PUBLIC_IP

NEXT_PUBLIC_API_BASE_URL=http://$PUBLIC_IP/api
NEXT_PUBLIC_APP_URL=http://$PUBLIC_IP
NEXT_PUBLIC_MAPBOX_TOKEN=${MAPBOX_TOKEN:-}
EOF

# Usar Caddyfile sin SSL
cp Caddyfile.sin-ssl Caddyfile

echo -e "${GREEN}✓ Configuración creada${NC}"

echo ""
echo -e "${BLUE}[5/5] Iniciando aplicación...${NC}"
echo -e "${YELLOW}Esto tomará 5-8 minutos (descarga y construcción de imágenes)${NC}"
echo ""

# Cargar variables
export $(cat .env.production | xargs)

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ ¡INSTALACIÓN COMPLETADA!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Tu aplicación está iniciando en:"
echo ""
echo -e "${BLUE}🌐 URL:${NC} http://$PUBLIC_IP"
echo -e "${BLUE}🔧 Admin:${NC} http://$PUBLIC_IP/admin"
echo -e "${BLUE}📚 API Docs:${NC} http://$PUBLIC_IP/api/docs"
echo ""
echo "Los servicios pueden tardar 1-2 minutos en estar completamente listos."
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo ""
echo "1. Ver logs (opcional):"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "2. Crear tu usuario administrador:"
echo "   docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser"
echo ""
echo "3. Gestionar la app:"
echo "   ./comandos-utiles.sh"
echo ""
echo -e "${GREEN}¡Disfruta de Stabix! 🎉${NC}"
