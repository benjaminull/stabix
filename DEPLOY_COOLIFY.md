# 🚀 Deploy Stabix con Coolify + VPS

Esta guía te llevará paso a paso para deployar Stabix en un VPS usando Coolify (alternativa gratuita a Heroku).

**Costo estimado:** €5.88 - €12/mes (~$6-13/mes)  
**Tiempo de setup:** 2-3 horas (primera vez)

---

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Paso 1: Crear VPS en Hetzner](#paso-1-crear-vps-en-hetzner)
3. [Paso 2: Instalar Coolify](#paso-2-instalar-coolify)
4. [Paso 3: Configurar Variables de Entorno](#paso-3-configurar-variables-de-entorno)
5. [Paso 4: Deploy con Coolify](#paso-4-deploy-con-coolify)
6. [Paso 5: Configurar Dominio (Opcional)](#paso-5-configurar-dominio-opcional)
7. [Troubleshooting](#troubleshooting)

---

## Pre-requisitos

- [ ] Cuenta de GitHub (para conectar el repositorio)
- [ ] Tarjeta de crédito/débito (para Hetzner)
- [ ] Dominio (opcional, recomendado para SSL automático)
- [ ] 2-3 horas de tiempo

---

## Paso 1: Crear VPS en Hetzner

### 1.1 Crear Cuenta en Hetzner

1. Ve a https://accounts.hetzner.com/signUp
2. Completa el registro
3. Verifica tu email
4. Agrega método de pago

### 1.2 Crear Servidor

1. En el panel de Hetzner, click en "Add Server"
2. **Location:** Elige el más cercano a tus usuarios
   - Europe: Nuremberg, Germany
   - USA: Ashburn, Virginia
3. **Image:** Ubuntu 22.04
4. **Type:** Selecciona según tu presupuesto:

   | Plan | CPU | RAM | Disco | Precio | Para |
   |------|-----|-----|-------|--------|------|
   | CPX11 | 2 | 2GB | 40GB | €4.15/mes | Testing (mínimo) |
   | CPX21 | 3 | 4GB | 80GB | €5.88/mes | **MVP Recomendado** ✅ |
   | CPX31 | 4 | 8GB | 160GB | €11.90/mes | Producción con tráfico |

5. **SSH Key:** 
   - Si no tienes una: `ssh-keygen -t ed25519 -C "tu-email@example.com"`
   - Copia la clave pública: `cat ~/.ssh/id_ed25519.pub`
   - Pégala en Hetzner

6. **Nombre:** `stabix-prod`
7. Click "Create & Buy now"

**⏱️ Espera 1-2 minutos** mientras se crea el servidor.

### 1.3 Conectarte al Servidor

```bash
# Obtén la IP del servidor desde el panel de Hetzner
ssh root@YOUR_SERVER_IP

# Primera vez te preguntará si confías en el servidor, escribe: yes
```

---

## Paso 2: Instalar Coolify

### 2.1 Instalar Coolify (Comando de 1 línea)

```bash
# Conectado al servidor via SSH, ejecuta:
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

**⏱️ Este proceso toma 5-10 minutos.** Instalará:
- Docker
- Coolify
- Todas las dependencias necesarias

### 2.2 Acceder al Panel de Coolify

1. Abre tu navegador
2. Ve a: `http://YOUR_SERVER_IP:8000`
3. **Primera vez:**
   - Crea tu cuenta de admin
   - Email: tu-email@example.com
   - Password: (elige una contraseña fuerte)

🎉 **¡Coolify está instalado!**

---

## Paso 3: Configurar Variables de Entorno

### 3.1 Generar SECRET_KEY de Django

**En tu máquina local:**

```bash
# Genera una clave secreta aleatoria
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Copia el resultado, lo necesitarás en el paso 4
```

### 3.2 Preparar Variables

Copia `.env.production.example` a `.env.production` y completa:

```bash
# En tu proyecto local
cp .env.production.example .env.production
```

**Edita `.env.production` con tus valores:**

```env
# Cambiar ESTOS valores:
POSTGRES_PASSWORD=TuPasswordSegura123!@#
DJANGO_SECRET_KEY=la-clave-que-generaste-arriba
ALLOWED_HOSTS=your-server-ip-or-domain.com
CORS_ALLOWED_ORIGINS=http://your-server-ip

# Si NO tienes dominio, usa:
DOMAIN=:80

# Si TIENES dominio:
DOMAIN=stabix.com
CADDY_EMAIL=admin@stabix.com

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://your-server-ip/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token
NEXT_PUBLIC_APP_URL=http://your-server-ip
```

**⚠️ IMPORTANTE:**
- NO subas `.env.production` a Git
- Ya está en `.gitignore`

---

## Paso 4: Deploy con Coolify

### 4.1 Conectar GitHub al Servidor

**En el panel de Coolify:**

1. Click en **"Sources"** (sidebar izquierdo)
2. Click **"+ Add Source"**
3. Selecciona **"GitHub"**
4. Autoriza Coolify en GitHub
5. Selecciona el repositorio `stabix`

### 4.2 Crear Proyecto

1. Click en **"Projects"**
2. Click **"+ Add Project"**
3. Nombre: `stabix`
4. Click **"Save"**

### 4.3 Crear Aplicación

1. Dentro del proyecto, click **"+ Add Resource"**
2. Selecciona **"Docker Compose"**
3. **Configure:**
   - **Name:** stabix-app
   - **Source:** Tu repositorio de GitHub
   - **Branch:** main (o master)
   - **Docker Compose File:** `docker-compose.prod.yml`
4. Click **"Continue"**

### 4.4 Configurar Variables de Entorno en Coolify

1. En la aplicación, ve a **"Environment Variables"**
2. Click **"+ Add Variable"**
3. Agrega TODAS las variables de tu `.env.production`:

```
POSTGRES_DB=stabix
POSTGRES_USER=stabix
POSTGRES_PASSWORD=TuPasswordSegura123
DJANGO_SECRET_KEY=tu-secret-key-generada
DJANGO_SETTINGS_MODULE=stabix_backend.settings.prod
DEBUG=0
ALLOWED_HOSTS=your-ip
CORS_ALLOWED_ORIGINS=http://your-ip
DOMAIN=:80
CADDY_EMAIL=admin@localhost
NEXT_PUBLIC_API_BASE_URL=http://your-ip/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
NEXT_PUBLIC_APP_NAME=Stabix
NEXT_PUBLIC_APP_URL=http://your-ip
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

### 4.5 Hacer el Deploy

1. Click en el botón **"Deploy"** (arriba a la derecha)
2. **⏱️ Primera vez:** 10-15 minutos
   - Descargará imágenes de Docker
   - Construirá los servicios
   - Iniciará todo

**Monitorea los logs:**
- Click en "Logs" para ver el progreso
- Deberías ver: ✅ Building... → ✅ Starting... → ✅ Running

### 4.6 Seed de la Base de Datos

**Una vez que todo esté corriendo:**

1. En Coolify, ve a tu aplicación
2. Click en el servicio **"api"**
3. Click en **"Execute Command"**
4. Ejecuta:

```bash
python scripts/seed_minimal.py
```

---

## Paso 5: Configurar Dominio (Opcional)

### 5.1 Si Tienes un Dominio

**En tu proveedor de dominio (GoDaddy, Namecheap, etc.):**

1. Crea un registro **A**:
   - Name: `@` (o `stabix`)
   - Type: `A`
   - Value: `YOUR_SERVER_IP`
   - TTL: 3600

2. Espera 5-30 minutos para propagación DNS

### 5.2 Actualizar Variables en Coolify

```env
DOMAIN=stabix.com
CADDY_EMAIL=admin@stabix.com
ALLOWED_HOSTS=stabix.com,www.stabix.com
CORS_ALLOWED_ORIGINS=https://stabix.com
NEXT_PUBLIC_API_BASE_URL=https://stabix.com/api
NEXT_PUBLIC_APP_URL=https://stabix.com
ENABLE_SSL=True
```

**Re-deploy:**
1. Click "Deploy" de nuevo
2. Caddy generará SSL automáticamente con Let's Encrypt

🎉 **Tu app estará en:** https://stabix.com

---

## 🎯 Verificar que Todo Funciona

```bash
# 1. Verifica que la API responde
curl http://YOUR_SERVER_IP/api/

# 2. Verifica el frontend
curl http://YOUR_SERVER_IP

# 3. Verifica servicios en Coolify
# Ve a "Services" y verifica que todos estén "Running"
```

**Deberías ver:**
- ✅ postgres (healthy)
- ✅ redis (healthy)
- ✅ api (running)
- ✅ celery (running)
- ✅ celery-beat (running)
- ✅ frontend (running)
- ✅ caddy (running)

---

## 🐛 Troubleshooting

### Problema: "Build Failed"

```bash
# En Coolify, revisa los logs del build
# Busca errores de dependencias

# Solución común: Limpiar cache
# En Coolify: Settings → Clear Build Cache → Re-deploy
```

### Problema: "Database Connection Error"

```bash
# Verifica que postgres esté healthy
# En Coolify → Services → postgres → Debe decir "Healthy"

# Si no está healthy, reinícialo:
# Click en postgres → Restart
```

### Problema: "502 Bad Gateway"

```bash
# El backend no está respondiendo

# Revisa logs del API:
# Coolify → Services → api → Logs

# Común: Migraciones no corrieron
# Ejecuta manualmente:
docker exec -it stabix-api-1 python manage.py migrate
```

### Problema: "Frontend no carga"

```bash
# Verifica que las variables NEXT_PUBLIC_* estén correctas
# Deben apuntar a la URL correcta de la API

# Si cambiaste algo, re-build:
# Coolify → Deploy (fuerza re-build del frontend)
```

### Problema: "WebSocket no funciona"

```bash
# Verifica que Daphne esté corriendo (no Gunicorn)
# En logs del API deberías ver: "Daphne listening on 0.0.0.0:8000"

# Verifica Caddy reverse proxy:
# Los WebSockets deben pasar por /ws/*
```

---

## 🔧 Comandos Útiles

### Conectarte al Servidor

```bash
ssh root@YOUR_SERVER_IP
```

### Ver Logs de un Servicio

```bash
# En el servidor
docker logs stabix-api-1 -f
docker logs stabix-frontend-1 -f
docker logs stabix-postgres-1 -f
```

### Ejecutar Comando en un Contenedor

```bash
# Django shell
docker exec -it stabix-api-1 python manage.py shell

# Migraciones
docker exec -it stabix-api-1 python manage.py migrate

# Crear superuser
docker exec -it stabix-api-1 python manage.py createsuperuser
```

### Reiniciar Todos los Servicios

```bash
# En el servidor
cd /path/to/project
docker compose -f docker-compose.prod.yml restart
```

### Ver Estado de Servicios

```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 📊 Monitoreo

### En Coolify:

1. **Dashboard:** Ver uso de CPU, RAM, Disco
2. **Logs:** Logs en tiempo real de todos los servicios
3. **Alerts:** Configurar alertas por email/Slack

### Recursos del Servidor:

```bash
# CPU y RAM
htop

# Espacio en disco
df -h

# Logs de Docker
docker stats
```

---

## 🚀 Próximos Pasos

Una vez que tu app esté corriendo:

1. **Backups:** Configurar backups automáticos de PostgreSQL
2. **Monitoring:** Agregar Sentry para error tracking
3. **Analytics:** Agregar Google Analytics o similar
4. **CDN:** Considerar Cloudflare para cache global
5. **Escalar:** Si crece, upgrade a CPX31 o migra a Vercel+Railway

---

## 💰 Costos Mensuales

| Recurso | Costo |
|---------|-------|
| Hetzner CPX21 | €5.88/mes |
| Dominio (opcional) | ~$12/año |
| **Total** | **€5.88-6.88/mes** |

vs Heroku/Railway: $54-87/mes 💸

---

## 🆘 Soporte

**Problemas con:**
- Coolify: https://coolify.io/docs
- Hetzner: https://docs.hetzner.com
- Este proyecto: GitHub Issues

---

**¡Listo!** 🎉 Tu app está en producción por menos de $10/mes.
