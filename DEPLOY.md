# Guía de Despliegue a Producción - MÁS SIMPLE

Esta guía te llevará de 0 a producción en menos de 30 minutos.

## Opción 1: VPS con Docker (Recomendado - $5-10/mes)

### Paso 1: Comprar un VPS

Elige uno de estos proveedores (todos son simples):
- **Hetzner** (más barato): ~4€/mes - https://www.hetzner.com/cloud
- **DigitalOcean**: $6/mes - https://www.digitalocean.com
- **Linode**: $5/mes - https://www.linode.com

**Especificaciones mínimas:**
- 2GB RAM
- 1 CPU
- 50GB SSD
- Ubuntu 22.04 LTS

### Paso 2: Configurar el servidor

Conéctate a tu VPS vía SSH:

```bash
ssh root@TU_IP_DEL_VPS
```

Instala Docker y Docker Compose:

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Verificar instalación
docker --version
docker-compose --version
```

### Paso 3: Configurar tu dominio

1. Compra un dominio (Namecheap, Cloudflare, etc.)
2. Apunta los registros DNS a tu VPS:
   ```
   A     @           TU_IP_DEL_VPS
   A     www         TU_IP_DEL_VPS
   ```
3. Espera 5-15 minutos a que se propague el DNS

### Paso 4: Clonar y configurar el proyecto

En tu VPS:

```bash
# Instalar Git si no está instalado
apt install git -y

# Clonar el repositorio
cd /opt
git clone https://github.com/tu-usuario/stabix.git
cd stabix

# Crear archivo de variables de entorno
cp .env.production.example .env.production

# Editar variables de entorno
nano .env.production
```

**Configura estas variables:**

```bash
# Database
POSTGRES_DB=stabix
POSTGRES_USER=stabix
POSTGRES_PASSWORD=tu_password_super_seguro_123

# Domain & Email
DOMAIN=tudominio.com
CADDY_EMAIL=tu@email.com

# Django Secret Key (genera uno nuevo)
DJANGO_SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')

# URLs permitidas
ALLOWED_HOSTS=tudominio.com,www.tudominio.com
CORS_ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Frontend
NEXT_PUBLIC_API_BASE_URL=https://tudominio.com/api
NEXT_PUBLIC_APP_URL=https://tudominio.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.tu_token_de_mapbox
```

### Paso 5: Levantar la aplicación

```bash
# Cargar variables de entorno
export $(cat .env.production | xargs)

# Construir y levantar los contenedores
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs para verificar que todo esté funcionando
docker-compose -f docker-compose.prod.yml logs -f
```

### Paso 6: Seed inicial de datos

```bash
# Crear superusuario
docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser

# Opcional: Cargar datos de ejemplo
docker-compose -f docker-compose.prod.yml exec api python scripts/seed_minimal.py
```

### Paso 7: Verificar

Visita:
- `https://tudominio.com` - Tu aplicación
- `https://tudominio.com/admin` - Panel de Django
- `https://tudominio.com/api/docs/` - Documentación API

Caddy se encargará automáticamente de:
- Certificados SSL (HTTPS gratis)
- Renovación automática de certificados
- Redirección de HTTP a HTTPS

¡Listo! Tu aplicación está en producción.

---

## Opción 2: Railway (Más simple pero más caro - ~$20/mes)

Railway es un PaaS que hace todo automático pero es más caro.

### Paso 1: Crear cuenta en Railway

1. Ve a https://railway.app
2. Regístrate con GitHub
3. Conecta tu repositorio

### Paso 2: Configurar servicios

Railway detectará automáticamente tu `docker-compose.yml` y creará los servicios.

1. Añade las variables de entorno desde su panel
2. Railway asignará URLs automáticamente
3. SSL incluido automáticamente

**Pros:**
- Configuración en 5 minutos
- SSL automático
- Backups automáticos
- No necesitas servidor

**Contras:**
- Más caro (~$20-40/mes)
- Menos control

---

## Opción 3: DigitalOcean App Platform (Balance - ~$12/mes)

Similar a Railway pero un poco más económico.

1. Ve a https://cloud.digitalocean.com/apps
2. Conecta tu repositorio de GitHub
3. Selecciona el branch
4. DigitalOcean detectará tu Dockerfile
5. Configura variables de entorno
6. Deploy

---

## Mantenimiento

### Ver logs

```bash
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Actualizar la aplicación

```bash
cd /opt/stabix
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup de la base de datos

```bash
# Crear backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U stabix stabix > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20240101.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U stabix stabix
```

### Reiniciar servicios

```bash
# Reiniciar todo
docker-compose -f docker-compose.prod.yml restart

# Reiniciar solo el backend
docker-compose -f docker-compose.prod.yml restart api

# Reiniciar solo el frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

---

## Costos estimados

### VPS (Opción 1 - Recomendado)
- VPS Hetzner: ~4€/mes
- Dominio: ~$10/año
- **Total: ~$5-6/mes**

### Railway (Opción 2)
- Plan base: $5/mes
- Recursos: ~$15-35/mes
- **Total: ~$20-40/mes**

### DigitalOcean App Platform (Opción 3)
- Apps: ~$12-24/mes
- Database: ~$15/mes
- **Total: ~$27-39/mes**

---

## Problemas comunes

### Puerto 80/443 bloqueado

```bash
# Verificar firewall
ufw status
ufw allow 80
ufw allow 443
```

### Error de certificado SSL

Caddy tarda 1-2 minutos en obtener el certificado. Espera y recarga.

### Base de datos no conecta

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose -f docker-compose.prod.yml ps postgres

# Ver logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Frontend no encuentra el API

Verifica que `NEXT_PUBLIC_API_BASE_URL` en `.env.production` sea correcto y esté usando HTTPS.

---

## Seguridad adicional (Opcional)

### Firewall

```bash
ufw enable
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
```

### Fail2ban (protección contra ataques)

```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### Backups automáticos

Crea un cronjob para backups diarios:

```bash
crontab -e

# Añade esta línea (backup diario a las 2 AM)
0 2 * * * cd /opt/stabix && docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U stabix stabix > /backups/backup_$(date +\%Y\%m\%d).sql
```

---

**Mi recomendación:** Empieza con la Opción 1 (VPS con Docker). Es la más económica, tienes total control, y si tu app crece, puedes escalar fácilmente.
