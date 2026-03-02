.PHONY: help dev dev-simple stop build logs clean seed test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

dev: ## Start full stack (all services)
	docker compose up -d

dev-simple: ## Start simplified stack (no celery-beat, no nginx)
	docker compose -f docker-compose.dev.yml up -d

stop: ## Stop all services
	docker compose down

build: ## Build all images
	docker compose build

build-no-cache: ## Build all images without cache
	docker compose build --no-cache

logs: ## View logs from all services
	docker compose logs -f

logs-api: ## View API logs
	docker compose logs -f api

logs-frontend: ## View frontend logs
	docker compose logs -f frontend

logs-celery: ## View celery logs
	docker compose logs -f celery

clean: ## Stop and remove all containers and volumes
	docker compose down -v

restart: ## Restart all services
	docker compose restart

restart-api: ## Restart API only
	docker compose restart api

restart-frontend: ## Restart frontend only
	docker compose restart frontend

seed: ## Seed the database with initial data
	docker compose exec api python scripts/seed_minimal.py

migrate: ## Run database migrations
	docker compose exec api python manage.py migrate

makemigrations: ## Create new migrations
	docker compose exec api python manage.py makemigrations

shell: ## Open Django shell
	docker compose exec api python manage.py shell

dbshell: ## Open database shell
	docker compose exec postgres psql -U stabix -d stabix

test-backend: ## Run backend tests
	docker compose exec api pytest

test-frontend: ## Run frontend tests
	docker compose exec frontend npm run test

ps: ## Show running services
	docker compose ps

reset: ## Reset everything (clean + build + up + seed)
	@echo "🧹 Cleaning..."
	docker compose down -v
	@echo "🔨 Building..."
	docker compose build
	@echo "🚀 Starting..."
	docker compose up -d
	@echo "⏳ Waiting for services..."
	sleep 15
	@echo "🌱 Seeding..."
	docker compose exec api python scripts/seed_minimal.py
	@echo "✅ Done! Open http://localhost:3000"
