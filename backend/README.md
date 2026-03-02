# Stabix Backend API

RESTful API for Stabix - a marketplace for on-demand services with geospatial matching.

## Features

- 🔐 JWT Authentication
- 📍 Geospatial search with PostGIS (radius/distance filtering)
- 🎯 Intelligent matching algorithm with scoring
- 💬 Real-time chat (WebSocket ready via Django Channels)
- 📋 OpenAPI 3.0 schema with auto-generated docs
- ⚡ Async tasks with Celery
- 🐳 Docker Compose setup for easy deployment
- ✅ Comprehensive test suite with pytest

## Tech Stack

- **Framework**: Django 5.0, Django REST Framework
- **Database**: PostgreSQL 15 + PostGIS
- **Cache/Queue**: Redis
- **Task Queue**: Celery + django-celery-beat
- **WebSocket**: Django Channels
- **API Docs**: drf-spectacular (OpenAPI 3)
- **Authentication**: djangorestframework-simplejwt
- **Testing**: pytest, pytest-django, factory-boy

## Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)
- Make (optional, for convenience commands)

## Quick Start

### 1. Clone and setup environment

```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

### 2. Start services

```bash
make dev
```

This will start:
- API server (http://localhost:8000)
- PostgreSQL with PostGIS
- Redis
- Celery worker
- Celery beat scheduler
- Nginx reverse proxy

### 3. Run migrations

```bash
make migrate
```

### 4. Seed database

```bash
make seed
```

This creates demo data:
- 3 service categories
- 6 services
- 1 demo user (demo@stabix.com / demo123)
- 3 provider users with profiles and listings

### 5. Access the API

- **API Base**: http://localhost:8000/api/
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## Environment Variables

See `.env.example` for all available configuration options:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key-change-in-production
DJANGO_SETTINGS_MODULE=stabix_backend.settings.local
DEBUG=1
ALLOWED_HOSTS=*

# Database
DATABASE_URL=postgis://stabix:stabix@postgres:5432/stabix

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=1440  # minutes
```

## API Endpoints

### Authentication

```
POST   /api/auth/token/          # Obtain JWT token pair
POST   /api/auth/refresh/        # Refresh access token
GET    /api/auth/me/             # Get current user profile
POST   /api/auth/register/       # Register new user
```

### Taxonomy

```
GET    /api/categories/          # List service categories
GET    /api/services/            # List services (filter by ?category=slug)
```

### Providers & Listings

```
GET    /api/providers/           # Search providers (geospatial filters)
  ?lat=34.0522&lng=-118.2437&radius_km=10&category=home-services
GET    /api/providers/{id}/      # Get provider details
GET    /api/listings/            # List listings
  ?service=plumbing&lat=34.0522&lng=-118.2437&radius_km=20
GET    /api/listings/{id}/       # Get listing details
```

### Jobs & Matching

```
POST   /api/job-requests/        # Create job request
GET    /api/job-requests/        # List user's job requests
GET    /api/job-requests/{id}/   # Get job request details
POST   /api/job-requests/{id}/match/  # Run matching algorithm
GET    /api/job-requests/{id}/matches/  # List matches for job
POST   /api/matches/{id}/accept/ # Accept match (provider)
```

### Orders

```
POST   /api/orders/              # Create order from accepted match
GET    /api/orders/              # List user's orders
GET    /api/orders/{id}/         # Get order details
```

### Reviews

```
POST   /api/orders/{id}/reviews/ # Create review for order
GET    /api/providers/{id}/reviews/  # List provider reviews
```

### Chat

```
GET    /api/orders/{id}/messages/  # List messages for order
POST   /api/orders/{id}/messages/  # Send message
WS     /ws/orders/{id}/chat/       # WebSocket chat
```

## Authentication

### Obtain JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@stabix.com", "password": "demo123"}'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Use Token in Requests

```bash
curl http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Geospatial Search

Search for providers within a radius:

```bash
curl "http://localhost:8000/api/providers/?lat=34.0522&lng=-118.2437&radius_km=10"
```

Response includes `distance_km` for each provider.

## Matching Algorithm

The matching engine uses a weighted scoring system:

```
score = 0.35 * distance_score +
        0.25 * rating_score +
        0.15 * availability_score +
        0.15 * price_score +
        0.10 * response_speed_score
```

All components normalized to [0, 1].

### Trigger Matching

```bash
curl -X POST http://localhost:8000/api/job-requests/1/match/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Development

### Run tests

```bash
make test           # Run all tests
make test-cov       # Run with coverage report
```

### Code formatting

```bash
make fmt            # Format with black & isort
make lint           # Lint with flake8
```

### Pre-commit hooks

```bash
make pre-commit     # Install pre-commit hooks
```

### Database operations

```bash
make migrate        # Run migrations
make makemigrations # Create new migrations
make shell          # Django shell
make dbshell        # PostgreSQL shell
make db-reset       # Reset database (DANGER)
```

### View logs

```bash
make logs           # All services
make logs-api       # API only
make logs-celery    # Celery only
```

## OpenAPI Schema Generation

### Export schema

```bash
make schema
```

Generates `schema.yml` which can be used to generate client SDKs:

```bash
# Generate TypeScript client
npx openapi-generator-cli generate \
  -i schema.yml \
  -g typescript-fetch \
  -o ../frontend/src/api
```

## Project Structure

```
backend/
├── apps/                    # Django apps
│   ├── common/             # Shared utilities
│   ├── users/              # User & auth
│   ├── taxonomy/           # Categories & services
│   ├── listings/           # Provider listings
│   ├── jobs/               # Job requests & matching
│   ├── orders/             # Orders/bookings
│   ├── reviews/            # Reviews & ratings
│   └── chat/               # Real-time messaging
├── docker/                 # Dockerfiles & config
│   ├── api.Dockerfile
│   ├── celery.Dockerfile
│   └── nginx.conf
├── scripts/                # Utility scripts
│   ├── init_postgis.sql
│   └── seed_minimal.py
├── stabix_backend/         # Django project
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   └── prod.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── urls.py
│   └── celery_app.py
├── docker-compose.yml
├── Makefile
├── requirements.txt
└── README.md
```

## Testing

Run the full test suite:

```bash
make test
```

Test specific modules:

```bash
docker-compose exec api pytest apps/jobs/tests/
docker-compose exec api pytest apps/listings/tests/test_views.py
```

Tests cover:
- User model and authentication
- Service taxonomy
- Geospatial provider search
- Matching engine scoring
- API endpoints
- Serializers

## Celery Tasks

### Implemented Tasks

- `run_matching_task`: Async matching for job requests
- `cleanup_expired_matches`: Periodic cleanup of expired matches
- `update_provider_ranking`: Recalculate provider ratings
- `send_order_confirmation_email`: Order notifications (stub)
- `send_review_request`: Request reviews after completion (stub)

### Monitor Celery

```bash
make logs-celery
```

## Production Deployment

### 1. Update environment

```bash
cp .env.example .env.prod
# Set production values:
# - DEBUG=0
# - DJANGO_SETTINGS_MODULE=stabix_backend.settings.prod
# - Strong DJANGO_SECRET_KEY
# - Production DATABASE_URL
# - Restrict ALLOWED_HOSTS
# - Configure CORS_ALLOWED_ORIGINS
```

### 2. Build and deploy

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Run migrations and collect static

```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py migrate
docker-compose -f docker-compose.prod.yml exec api python manage.py collectstatic --noinput
```

### 4. Create superuser

```bash
docker-compose -f docker-compose.prod.yml exec api python manage.py createsuperuser
```

## Troubleshooting

### PostGIS extension error

If you see "PostGIS extension not found":

```bash
docker-compose exec postgres psql -U stabix -d stabix -c "CREATE EXTENSION postgis;"
```

### Reset database

```bash
make db-reset
```

### View logs

```bash
make logs-api
```

### Clear migrations

```bash
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
```

## Contributing

1. Install pre-commit hooks: `make pre-commit`
2. Format code: `make fmt`
3. Lint: `make lint`
4. Run tests: `make test`

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
