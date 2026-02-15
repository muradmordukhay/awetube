.PHONY: dev up down seed migrate test lint build clean

## Development

dev: ## Start Next.js dev server (requires local DB)
	npm run dev

up: ## Start PostgreSQL, apply migrations, and run dev server
	docker compose up -d db
	@echo "Waiting for PostgreSQL..."
	@sleep 2
	npx prisma migrate deploy
	npm run dev

down: ## Stop all Docker services
	docker compose down

## Database

seed: ## Seed the database with demo data
	npx prisma db seed

migrate: ## Create a new migration (interactive)
	npx prisma migrate dev

migrate-deploy: ## Apply pending migrations (non-interactive)
	npx prisma migrate deploy

studio: ## Open Prisma Studio
	npx prisma studio

## Quality

test: ## Run tests
	npm test

lint: ## Run linter
	npm run lint

build: ## Production build
	npm run build

## Docker

docker-up: ## Start full stack via Docker (db + app)
	docker compose up --build -d

docker-down: ## Stop Docker stack and remove volumes
	docker compose down -v

## Help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
