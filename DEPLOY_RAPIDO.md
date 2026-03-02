# Deploy en 15 Minutos - Guía Express

## Paso 1: Comprar VPS (3 minutos)

### Hetzner (Recomendado - 4€/mes)
1. Ve a https://console.hetzner.cloud
2. Crear proyecto → Crear servidor
3. Ubicación: Cualquiera cerca de ti
4. Imagen: **Ubuntu 22.04**
5. Tipo: **CX21** (2 vCPU, 4GB RAM) - 4.51€/mes
6. Networking: IPv4 pública
7. SSH Key: Sube tu llave pública o crea contraseña
8. Crear y arrancar

**Anota tu IP:** `XXX.XXX.XXX.XXX`

### Alternativas:
- **DigitalOcean**: https://cloud.digitalocean.com/droplets/new (Basic $6/mes)
- **Linode**: https://cloud.linode.com/linodes/create (Nanode 2GB $12/mes)

## Paso 2: Configurar Dominio (2 minutos)

1. Ve a tu proveedor de dominio (Namecheap, Cloudflare, etc.)
2. DNS Settings → Añade estos registros:
   ```
   Tipo    Nombre    Valor
   A       @         TU_IP_VPS
   A       www       TU_IP_VPS
   ```
3. Guarda y espera 2-5 minutos

## Paso 3: Setup Automático (10 minutos)

### Conéctate a tu VPS:
```bash
ssh root@TU_IP_VPS
```

### Ejecuta el script de instalación:
```bash
# Descargar script
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/stabix/main/deploy-setup.sh -o deploy-setup.sh

# Darle permisos
chmod +x deploy-setup.sh

# Ejecutar
./deploy-setup.sh
```

El script te pedirá:
- URL de tu repositorio Git
- Tu dominio
- Tu email (para certificados SSL)
- Token de Mapbox (opcional)

**Automáticamente instalará:** Docker, Docker Compose, clonará el repo y configurará todo.

### Iniciar la aplicación:
```bash
cd /opt/stabix
export $(cat .env.production | xargs)
docker-compose -f docker-compose.prod.yml up -d --build
```

Espera 5-8 minutos mientras construye las imágenes.

### Crear tu usuario admin:
```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser
```

## ¡LISTO! 🎉

Visita: **https://tudominio.com**

- Frontend: `https://tudominio.com`
- Admin: `https://tudominio.com/admin`
- API Docs: `https://tudominio.com/api/docs`

SSL se configura automáticamente en 1-2 minutos.

---

## Comandos Útiles

### Ver logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Reiniciar servicios:
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Actualizar la app:
```bash
cd /opt/stabix
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup DB:
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U stabix stabix > backup.sql
```

---

## Troubleshooting

### "No puedo acceder a mi dominio"
- Verifica DNS: `dig tudominio.com` debe mostrar tu IP
- Espera 5-10 minutos para propagación DNS

### "Error de certificado SSL"
- Caddy tarda 1-2 minutos en obtener certificado
- Verifica que puertos 80 y 443 estén abiertos: `ufw status`

### "Backend no responde"
```bash
# Ver logs del API
docker-compose -f docker-compose.prod.yml logs api

# Verificar que todos los servicios estén corriendo
docker-compose -f docker-compose.prod.yml ps
```

---

## Costos Mensuales

- **VPS Hetzner CX21**: 4.51€/mes (~$5)
- **Dominio**: ~$10-15/año (~$1/mes)
- **Total**: ~$6/mes

¡Sin cargos ocultos! Todo incluido: SSL, storage, backups.
