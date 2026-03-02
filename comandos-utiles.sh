#!/bin/bash
# Comandos útiles para gestionar Stabix en producción

# Variables
COMPOSE_FILE="docker-compose.prod.yml"

# Función para mostrar menú
show_menu() {
    echo ""
    echo "==================================="
    echo "   Stabix - Comandos Útiles"
    echo "==================================="
    echo "1.  Ver logs (todos los servicios)"
    echo "2.  Ver logs del API"
    echo "3.  Ver logs del Frontend"
    echo "4.  Ver estado de servicios"
    echo "5.  Reiniciar todos los servicios"
    echo "6.  Reiniciar solo API"
    echo "7.  Reiniciar solo Frontend"
    echo "8.  Actualizar aplicación (git pull + rebuild)"
    echo "9.  Crear superusuario"
    echo "10. Backup de base de datos"
    echo "11. Restaurar base de datos"
    echo "12. Ver uso de recursos"
    echo "13. Limpiar imágenes antiguas"
    echo "14. Abrir shell de Django"
    echo "15. Ejecutar migraciones"
    echo "0.  Salir"
    echo "==================================="
    echo -n "Selecciona una opción: "
}

# Funciones
logs_all() {
    docker-compose -f $COMPOSE_FILE logs -f
}

logs_api() {
    docker-compose -f $COMPOSE_FILE logs -f api
}

logs_frontend() {
    docker-compose -f $COMPOSE_FILE logs -f frontend
}

status() {
    docker-compose -f $COMPOSE_FILE ps
}

restart_all() {
    echo "Reiniciando todos los servicios..."
    docker-compose -f $COMPOSE_FILE restart
    echo "✅ Servicios reiniciados"
}

restart_api() {
    echo "Reiniciando API..."
    docker-compose -f $COMPOSE_FILE restart api celery celery-beat
    echo "✅ API reiniciada"
}

restart_frontend() {
    echo "Reiniciando Frontend..."
    docker-compose -f $COMPOSE_FILE restart frontend
    echo "✅ Frontend reiniciado"
}

update_app() {
    echo "📥 Actualizando desde Git..."
    git pull
    echo "🔨 Reconstruyendo servicios..."
    docker-compose -f $COMPOSE_FILE up -d --build
    echo "✅ Aplicación actualizada"
}

create_superuser() {
    docker-compose -f $COMPOSE_FILE exec api python manage.py createsuperuser
}

backup_db() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "💾 Creando backup: $BACKUP_FILE"
    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U stabix stabix > $BACKUP_FILE
    echo "✅ Backup creado: $BACKUP_FILE"
}

restore_db() {
    echo "Archivos de backup disponibles:"
    ls -lh backup_*.sql 2>/dev/null || echo "No hay backups disponibles"
    echo ""
    read -p "Nombre del archivo a restaurar: " BACKUP_FILE
    if [ -f "$BACKUP_FILE" ]; then
        echo "⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos actual"
        read -p "¿Estás seguro? (yes/no): " CONFIRM
        if [ "$CONFIRM" == "yes" ]; then
            cat $BACKUP_FILE | docker-compose -f $COMPOSE_FILE exec -T postgres psql -U stabix stabix
            echo "✅ Base de datos restaurada"
        else
            echo "❌ Operación cancelada"
        fi
    else
        echo "❌ Archivo no encontrado"
    fi
}

resources() {
    echo "📊 Uso de recursos:"
    docker stats --no-stream
}

cleanup() {
    echo "🧹 Limpiando imágenes antiguas..."
    docker image prune -a -f
    echo "✅ Limpieza completada"
}

django_shell() {
    docker-compose -f $COMPOSE_FILE exec api python manage.py shell
}

migrate() {
    echo "🔄 Ejecutando migraciones..."
    docker-compose -f $COMPOSE_FILE exec api python manage.py migrate
    echo "✅ Migraciones completadas"
}

# Loop principal
while true; do
    show_menu
    read option
    case $option in
        1) logs_all ;;
        2) logs_api ;;
        3) logs_frontend ;;
        4) status ;;
        5) restart_all ;;
        6) restart_api ;;
        7) restart_frontend ;;
        8) update_app ;;
        9) create_superuser ;;
        10) backup_db ;;
        11) restore_db ;;
        12) resources ;;
        13) cleanup ;;
        14) django_shell ;;
        15) migrate ;;
        0) echo "👋 Adiós!"; exit 0 ;;
        *) echo "❌ Opción inválida" ;;
    esac

    if [ "$option" != "1" ] && [ "$option" != "2" ] && [ "$option" != "3" ]; then
        read -p "Presiona Enter para continuar..."
    fi
done
