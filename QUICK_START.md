# 🚀 Quick Start - Stabix

Guía rápida para levantar el proyecto completo.

## ⚡ Inicio Rápido (3 pasos)

```bash
# 1. Levantar todos los servicios
docker compose up -d

# 2. Ver logs (espera a ver "Application startup complete")
docker compose logs -f api

# 3. Seed la base de datos
docker compose exec api python scripts/seed_minimal.py
```

**¡Listo!** Abre:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/docs/

## 📝 Credenciales

```
Usuario: demo@stabix.com
Password: demo123

Proveedores: provider1@stabix.com / provider123
```

## 🐛 Si algo falla

### Error: "port already in use"
```bash
# Detener todo
docker compose down

# Ver qué usa el puerto
lsof -i :3000
lsof -i :8000

# Matar proceso
kill -9 <PID>
```

### Error: "npm install failed"
```bash
# Rebuild solo frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Error: "connection refused"
```bash
# Ver logs del servicio específico
docker compose logs api
docker compose logs postgres

# Restart servicios
docker compose restart api postgres
```

### Reset completo
```bash
# Limpiar todo y empezar de cero
docker compose down -v
docker compose up -d
# Esperar 30 segundos
docker compose exec api python scripts/seed_minimal.py
```

## 🔧 Comandos Útiles

```bash
# Ver estado
docker compose ps

# Ver logs de un servicio
docker compose logs -f frontend

# Reiniciar servicio
docker compose restart api

# Detener todo
docker compose down

# Rebuild un servicio
docker compose up -d --build frontend

# Ejecutar comando en contenedor
docker compose exec api python manage.py shell
docker compose exec api pytest
```

## 📚 Más Info

- Docker completo: `DOCKER_SETUP.md`
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
