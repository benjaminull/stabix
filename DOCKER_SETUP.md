# 🐳 Docker Setup - Stabix Full Stack

Esta guía te ayudará a levantar todo el stack de Stabix usando Docker.

## ✅ Prerequisitos

Asegúrate de tener instalado:
- **Docker Desktop** (Mac/Windows) o **Docker Engine** (Linux)
- Al menos **4GB de RAM** disponible para Docker
- Puertos libres: 3000, 8000, 5432, 6379, 80

### Verificar instalación de Docker

```bash
docker --version
# Docker version 20.10.0 o superior

docker compose version
# Docker Compose version v2.0.0 o superior
```

## 🚀 Inicio Rápido (3 comandos)

Desde la raíz del proyecto `/stabix`:

```bash
# 1. Levantar todos los servicios
docker compose up -d

# 2. Esperar a que todo esté listo (30-60 segundos)
docker compose logs -f api

# 3. Cuando veas "Application startup complete", ejecutar seeds
docker compose exec api python scripts/seed_minimal.py
```

**¡Listo!** Accede a:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs/

## 📦 Servicios Incluidos

El `docker-compose.yml` levanta 7 servicios:

1. **postgres** - PostgreSQL 15 + PostGIS (puerto 5432)
2. **redis** - Redis 7 (puerto 6379)
3. **api** - Backend Django (puerto 8000)
4. **celery** - Worker de tareas asíncronas
5. **celery-beat** - Scheduler de tareas periódicas
6. **frontend** - Next.js 14 (puerto 3000)
7. **nginx** - Reverse proxy (puerto 80)

## 🔧 Comandos Útiles

### Ver logs de todos los servicios

```bash
docker compose logs -f
```

### Ver logs de un servicio específico

```bash
docker compose logs -f api
docker compose logs -f frontend
docker compose logs -f postgres
```

### Reiniciar un servicio

```bash
docker compose restart api
docker compose restart frontend
```

### Detener todos los servicios

```bash
docker compose down
```

### Detener y eliminar volúmenes (limpieza completa)

```bash
docker compose down -v
```

### Reconstruir imágenes

```bash
# Reconstruir todo
docker compose build

# Reconstruir sin cache
docker compose build --no-cache

# Reconstruir solo un servicio
docker compose build frontend
```

### Ejecutar comandos dentro de contenedores

```bash
# Django shell
docker compose exec api python manage.py shell

# Crear superuser
docker compose exec api python manage.py createsuperuser

# Correr migraciones
docker compose exec api python manage.py migrate

# Frontend shell
docker compose exec frontend sh

# PostgreSQL shell
docker compose exec postgres psql -U stabix -d stabix
```

## 🗄️ Base de Datos

### Seed inicial

```bash
docker compose exec api python scripts/seed_minimal.py
```

Esto crea:
- ✅ 3 categorías de servicios
- ✅ 6 servicios
- ✅ 1 usuario demo: `demo@stabix.com` / `demo123`
- ✅ 3 proveedores: `provider1@stabix.com` / `provider123`
- ✅ 4 listings activos

### Resetear base de datos

```bash
# Detener todo y eliminar volúmenes
docker compose down -v

# Levantar de nuevo
docker compose up -d

# Esperar y correr seeds
sleep 10
docker compose exec api python manage.py migrate
docker compose exec api python scripts/seed_minimal.py
```

### Backup de base de datos

```bash
docker compose exec -T postgres pg_dump -U stabix stabix > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
docker compose exec -T postgres psql -U stabix -d stabix < backup_20240315_120000.sql
```

## 🧪 Testing

### Backend tests

```bash
docker compose exec api pytest
```

### Frontend tests

```bash
docker compose exec frontend npm run test
```

## 🔑 Credenciales por Defecto

Después de correr seeds:

**Usuario Demo:**
```
Email: demo@stabix.com
Password: demo123
```

**Proveedores:**
```
Email: provider1@stabix.com
Email: provider2@stabix.com
Email: provider3@stabix.com
Password: provider123
```

**Base de datos:**
```
Host: localhost:5432
Database: stabix
User: stabix
Password: stabix
```

## 🗺️ Mapbox (Opcional)

Para habilitar mapas en el frontend:

1. Obtén un token gratis en: https://account.mapbox.com/access-tokens/

2. Edita el archivo `.env` en la raíz:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazZwNnE3eGswMDAwM29xYnoxOGJhYnRoIn0.example
   ```

3. Reconstruye el frontend:
   ```bash
   docker compose up -d --build frontend
   ```

## 🐛 Troubleshooting

### Problema: Servicios no inician

**Solución 1**: Verificar logs
```bash
docker compose logs api
docker compose logs postgres
```

**Solución 2**: Limpiar y reiniciar
```bash
docker compose down -v
docker compose up -d
```

### Problema: "Port already in use"

**Solución**: Detener procesos que usan esos puertos
```bash
# Verificar qué usa el puerto 3000
lsof -i :3000

# Detener proceso (Mac/Linux)
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problema: Backend no conecta con base de datos

**Solución**: Esperar a que postgres esté listo
```bash
docker compose exec postgres pg_isready -U stabix
```

Si dice "accepting connections", la base de datos está lista.

### Problema: Frontend no conecta con backend

**Verificación**:
```bash
# Desde tu máquina
curl http://localhost:8000/api/categories/

# Debería retornar JSON con categorías
```

**Solución**: Verificar CORS en `backend/stabix_backend/settings/local.py`

### Problema: Migraciones pendientes

```bash
docker compose exec api python manage.py showmigrations
docker compose exec api python manage.py migrate
```

### Problema: Frontend no actualiza cambios

```bash
# Reconstruir frontend
docker compose up -d --build frontend

# O forzar reconstrucción sin cache
docker compose build --no-cache frontend
docker compose up -d frontend
```

## 📊 Monitoreo

### Ver recursos usados

```bash
docker stats
```

### Ver procesos corriendo

```bash
docker compose ps
```

### Healthchecks

```bash
# Postgres
docker compose exec postgres pg_isready -U stabix

# Redis
docker compose exec redis redis-cli ping

# API (desde fuera)
curl http://localhost:8000/api/categories/

# Frontend
curl http://localhost:3000
```

## 🚀 Modo Producción

Para producción, usa variables de entorno seguras:

1. Copia `.env.example` a `.env.production`:
   ```bash
   cp .env .env.production
   ```

2. Edita `.env.production`:
   ```bash
   DJANGO_SECRET_KEY=<genera-clave-segura>
   DEBUG=0
   ALLOWED_HOSTS=tudominio.com
   POSTGRES_PASSWORD=<password-seguro>
   ```

3. Levanta con el archivo de producción:
   ```bash
   docker compose --env-file .env.production up -d
   ```

## 📝 Notas Importantes

- **Primera vez**: El build puede tomar 5-10 minutos
- **Postgres**: Tarda ~10 segundos en estar listo
- **Migraciones**: Se corren automáticamente al iniciar el backend
- **Hot reload**: Frontend tiene hot reload, backend necesita restart
- **Volúmenes**: Los datos persisten entre reinicios (usar `-v` para limpiar)

## 🔗 URLs Importantes

Una vez levantado todo:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **API Docs (Swagger)**: http://localhost:8000/api/docs/
- **Admin Django**: http://localhost:8000/admin/
- **Nginx**: http://localhost/ (proxy)

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`

## 🎯 Workflow de Desarrollo

### 1. Desarrollo local del backend

```bash
# Levantar solo servicios de infraestructura
docker compose up -d postgres redis

# Backend en local
cd backend
python manage.py runserver
```

### 2. Desarrollo local del frontend

```bash
# Levantar backend en Docker
docker compose up -d api postgres redis

# Frontend en local
cd frontend
npm run dev
```

### 3. Desarrollo completo en Docker

```bash
# Todo en Docker con hot reload
docker compose up -d

# Ver logs
docker compose logs -f api frontend
```

---

**¿Listo para empezar?**

```bash
docker compose up -d
docker compose exec api python scripts/seed_minimal.py
```

Luego abre http://localhost:3000 y http://localhost:8000/api/docs/ 🚀
