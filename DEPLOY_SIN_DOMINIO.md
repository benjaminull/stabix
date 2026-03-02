# Deploy SIN DOMINIO - Solo con IP

Guía para cuando NO tienes dominio aún. Tu app funcionará con `http://TU_IP`

## Pasos (15 minutos)

### 1. Sube el código a GitHub (1 min)

```bash
cd /Users/benjaminull/Desktop/Repos/stabix
git add .
git commit -m "Production ready"
git push
```

### 2. Compra VPS (3 min)

**Hetzner Cloud (Recomendado - 4.51€/mes):**
1. https://console.hetzner.cloud
2. Create Project → Add Server
3. Location: Cualquiera
4. Image: **Ubuntu 22.04**
5. Type: **CX21** (2 vCPU, 4GB RAM)
6. SSH Key o Password
7. Create & Buy

**Anota tu IP:** `_______________`

### 3. Conéctate al VPS (1 min)

```bash
ssh root@TU_IP_VPS
```

### 4. Instala Docker (3 min)

```bash
# Instalar Docker y herramientas
curl -fsSL https://get.docker.com | sh
apt install docker-compose git -y

# Configurar firewall
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443
```

### 5. Clona y configura (2 min)

```bash
# Ir a /opt y clonar
cd /opt
git clone TU_URL_REPOSITORIO stabix
cd stabix

# Copiar archivo de configuración SIN dominio
cp .env.production.sin-dominio .env.production

# Usar Caddyfile sin SSL
cp Caddyfile.sin-ssl Caddyfile

# Editar variables
nano .env.production
```

**Reemplaza en `.env.production`:**

```bash
# TU_IP_DEL_VPS con la IP real (ejemplo: 123.45.67.89)
DOMAIN=TU_IP_DEL_VPS
ALLOWED_HOSTS=TU_IP_DEL_VPS,localhost
CORS_ALLOWED_ORIGINS=http://TU_IP_DEL_VPS
NEXT_PUBLIC_API_BASE_URL=http://TU_IP_DEL_VPS/api
NEXT_PUBLIC_APP_URL=http://TU_IP_DEL_VPS

# Genera passwords seguros
POSTGRES_PASSWORD=$(openssl rand -base64 32)
DJANGO_SECRET_KEY=$(openssl rand -base64 50)
```

**O hazlo automático con estos comandos:**

```bash
# Reemplaza TU_IP_VPS con tu IP real
IP_VPS="123.45.67.89"  # <-- CAMBIA ESTO

# Opcional: Tu token de Mapbox (deja vacío si no lo tienes aún)
MAPBOX_TOKEN=""  # <-- Pon tu token aquí o déjalo vacío

cat > .env.production << EOF
POSTGRES_DB=stabix
POSTGRES_USER=stabix
POSTGRES_PASSWORD=$(openssl rand -base64 32)

DOMAIN=$IP_VPS
CADDY_EMAIL=admin@localhost
ENABLE_SSL=False

DJANGO_SECRET_KEY=$(openssl rand -base64 50)
ALLOWED_HOSTS=$IP_VPS,localhost
CORS_ALLOWED_ORIGINS=http://$IP_VPS

NEXT_PUBLIC_API_BASE_URL=http://$IP_VPS/api
NEXT_PUBLIC_APP_URL=http://$IP_VPS
NEXT_PUBLIC_MAPBOX_TOKEN=$MAPBOX_TOKEN
EOF

# Usar Caddyfile sin SSL
cp Caddyfile.sin-ssl Caddyfile
```

Guarda con: `Ctrl+O`, `Enter`, `Ctrl+X`

### 6. Inicia la aplicación (5 min)

```bash
# Cargar variables
export $(cat .env.production | xargs)

# Iniciar (toma 5-8 minutos)
docker-compose -f docker-compose.prod.yml up -d --build

# Ver progreso
docker-compose -f docker-compose.prod.yml logs -f
```

Presiona `Ctrl+C` cuando veas que todo está corriendo.

### 7. Crea superusuario (1 min)

```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser
```

## ✅ ¡LISTO!

Abre tu navegador en: **http://TU_IP_VPS**

- Frontend: `http://TU_IP_VPS`
- Admin: `http://TU_IP_VPS/admin`
- API Docs: `http://TU_IP_VPS/api/docs`

---

## 🔒 Agregar Dominio y SSL Después (Opcional)

Cuando compres un dominio:

### 1. Configurar DNS:
```
A    @      TU_IP_VPS
A    www    TU_IP_VPS
```

### 2. En el VPS, editar `.env.production`:
```bash
cd /opt/stabix
nano .env.production
```

Cambiar:
```bash
DOMAIN=tudominio.com
ENABLE_SSL=True
ALLOWED_HOSTS=tudominio.com,www.tudominio.com
CORS_ALLOWED_ORIGINS=https://tudominio.com
NEXT_PUBLIC_API_BASE_URL=https://tudominio.com/api
NEXT_PUBLIC_APP_URL=https://tudominio.com
CADDY_EMAIL=tu@email.com
```

### 3. Reemplazar Caddyfile:
```bash
cp Caddyfile.original Caddyfile  # Si guardaste el original
# O descarga uno nuevo del repo
```

### 4. Reiniciar:
```bash
export $(cat .env.production | xargs)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

SSL se activará automáticamente en 2 minutos.

---

## 🆘 Problemas Comunes

### No puedo acceder a http://MI_IP
```bash
# Verificar firewall
ufw status

# Verificar que servicios estén corriendo
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs
```

### Error "Can't connect to API"
```bash
# Verifica que la IP en .env.production sea correcta
cat .env.production | grep NEXT_PUBLIC_API_BASE_URL

# Debe ser: http://TU_IP_REAL/api
```

### Servicios no inician
```bash
# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs frontend
```

---

## 📊 Gestión

Usa el script de comandos útiles:
```bash
cd /opt/stabix
./comandos-utiles.sh
```

O manualmente:
```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker-compose -f docker-compose.prod.yml restart

# Actualizar app
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Backup DB
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U stabix stabix > backup.sql
```

---

## 💰 Costos

- VPS Hetzner CX21: **4.51€/mes** (~$5 USD)
- Dominio (opcional): ~$10/año cuando lo compres

**Total ahora: $5/mes** 🎉
