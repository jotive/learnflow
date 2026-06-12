.PHONY: backend backend-dev build db migrate seed backend-test backend-test-unit backend-test-integration backend-lint backend-format frontend

ifeq ($(OS),Windows_NT)
PYTHON := .venv/Scripts/python.exe
BUN := bun.cmd
else
PYTHON := .venv/bin/python
BUN := bun
endif

backend:
	docker compose up --build backend

backend-dev:
	docker compose up --build backend-dev

build:
	docker compose build

db:
	docker compose up -d --wait db

migrate:
	docker compose run --rm migrate alembic upgrade head

seed:
	docker compose run --rm migrate

backend-test:
	cd backend && $(PYTHON) -m pytest

backend-test-unit:
	cd backend && $(PYTHON) -m pytest tests/unit -v --no-cov

backend-test-integration:
	cd backend && $(PYTHON) -m pytest tests/integration -v --no-cov

backend-lint:
	cd backend && $(PYTHON) -m flake8 app tests && $(PYTHON) -m ruff check app tests

backend-format:
	cd backend && $(PYTHON) -m black app tests && $(PYTHON) -m isort app tests

frontend:
	cd frontend && $(BUN) dev
