.PHONY: help dev stop migrate makemigrations seed test fmt lint clean shell logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

dev: ## Start development environment with Docker Compose
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "API: http://localhost:8000"
	@echo "Docs: http://localhost:8000/api/docs/"

stop: ## Stop all Docker services
	docker-compose down

restart: ## Restart all Docker services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View API logs
	docker-compose logs -f api

logs-celery: ## View Celery worker logs
	docker-compose logs -f celery

build: ## Build Docker images
	docker-compose build

migrate: ## Run database migrations
	docker-compose exec api python manage.py migrate

makemigrations: ## Create new database migrations
	docker-compose exec api python manage.py makemigrations

seed: ## Seed database with test data
	docker-compose exec api python scripts/seed_minimal.py

shell: ## Open Django shell
	docker-compose exec api python manage.py shell

dbshell: ## Open database shell
	docker-compose exec postgres psql -U stabix -d stabix

createsuperuser: ## Create Django superuser
	docker-compose exec api python manage.py createsuperuser

test: ## Run tests with pytest
	docker-compose exec api pytest

test-cov: ## Run tests with coverage report
	docker-compose exec api pytest --cov-report=html --cov-report=term

fmt: ## Format code with black and isort
	docker-compose exec api black .
	docker-compose exec api isort .

lint: ## Lint code with flake8
	docker-compose exec api flake8 .

pre-commit: ## Install pre-commit hooks
	pre-commit install

clean: ## Clean up temporary files and caches
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true

schema: ## Generate OpenAPI schema
	docker-compose exec api python manage.py spectacular --color --file schema.yml
	@echo "Schema generated at schema.yml"

collectstatic: ## Collect static files
	docker-compose exec api python manage.py collectstatic --noinput

# Local development (without Docker)
install: ## Install dependencies locally (requires Python 3.11)
	pip install -r requirements.txt

run-local: ## Run development server locally
	python manage.py runserver

celery-local: ## Run Celery worker locally
	celery -A stabix_backend worker -l info

celery-beat-local: ## Run Celery beat locally
	celery -A stabix_backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

# Database management
db-reset: ## Reset database (DANGER: deletes all data)
	docker-compose down -v
	docker-compose up -d postgres redis
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5
	docker-compose up -d api
	@echo "Running migrations..."
	@sleep 5
	make migrate
	@echo "Database reset complete!"

db-backup: ## Backup database
	docker-compose exec -T postgres pg_dump -U stabix stabix > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created!"

# Production
prod-build: ## Build production images
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down
