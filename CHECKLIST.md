# ✅ Checklist de Deploy - 15 Minutos

## Antes de empezar

Necesitas tener en tu máquina local:
- [ ] Tu proyecto con los cambios commiteados
- [ ] Repositorio en GitHub/GitLab (puede ser privado)

---

## ⏱️ PASO 1: VPS (3 min)

1. Ve a https://console.hetzner.cloud
2. Sign up (si no tienes cuenta)
3. Crear proyecto → **New Server**
4. Configuración:
   - Location: Nuremberg (o el más cercano)
   - Image: **Ubuntu 22.04**
   - Type: **CX21** (4GB RAM) - 4.51€/mes
   - SSH keys: Añade tu clave pública o usa contraseña
   - Click **Create & Buy now**

**Anota tu IP:** `_______________`

---

## ⏱️ PASO 2: Dominio (2 min)

### Si tienes dominio:
1. Ve a tu registrador (Namecheap, Cloudflare, GoDaddy, etc.)
2. DNS Management → Añade:
   ```
   A    @      TU_IP_VPS
   A    www    TU_IP_VPS
   ```

### Si NO tienes dominio:
Por ahora puedes usar la IP directamente. Compra uno después en:
- Namecheap (~$10/año)
- Cloudflare (~$10/año)

---

## ⏱️ PASO 3: Deploy (10 min)

### 1. Sube tu código a GitHub (si no lo hiciste):
```bash
cd /Users/benjaminull/Desktop/Repos/stabix
git add .
git commit -m "Ready for production"
git push
```

### 2. Conéctate a tu VPS:
```bash
ssh root@TU_IP_VPS
```

### 3. Ejecuta estos comandos EN EL VPS:

```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose git -y

# Configurar firewall
ufw --force enable
ufw allow 22 && ufw allow 80 && ufw allow 443

# Clonar tu repositorio
cd /opt
git clone URL_DE_TU_REPOSITORIO stabix
cd stabix

# Configurar variables de entorno
cp .env.production.example .env.production
nano .env.production
```

### 4. Edita `.env.production` con tus datos:
```bash
DOMAIN=tudominio.com                    # O tu IP si no tienes dominio
CADDY_EMAIL=tu@email.com
POSTGRES_PASSWORD=CambiaEstoPorAlgoSeguro123
DJANGO_SECRET_KEY=$(openssl rand -base64 50)
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token       # Opcional
```

Guarda con: `Ctrl+O`, `Enter`, `Ctrl+X`

### 5. Iniciar la aplicación:
```bash
# Cargar variables
export $(cat .env.production | xargs)

# Levantar todo (toma 5-8 minutos)
docker-compose -f docker-compose.prod.yml up -d --build

# Ver progreso
docker-compose -f docker-compose.prod.yml logs -f
```

Espera hasta ver: `Server running at ...`

### 6. Crear superusuario:
```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser
```

---

## ✅ ¡TERMINADO!

Visita tu aplicación:
- **Frontend**: https://tudominio.com (o http://TU_IP)
- **Admin**: https://tudominio.com/admin
- **API Docs**: https://tudominio.com/api/docs

**Nota sobre SSL:**
- Si usas dominio: SSL se activa automáticamente en 1-2 minutos
- Si usas IP: Por ahora será HTTP (no HTTPS). Después configura dominio para HTTPS.

---

## 🆘 Si algo falla

### Ver logs:
```bash
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs frontend
```

### Reiniciar todo:
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Estado de servicios:
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## 📞 Ayuda

Si tienes problemas, verifica:
1. DNS propagado: `dig tudominio.com` debe mostrar tu IP
2. Puertos abiertos: `ufw status`
3. Servicios corriendo: `docker-compose ps`
4. Logs para errores: `docker-compose logs`
