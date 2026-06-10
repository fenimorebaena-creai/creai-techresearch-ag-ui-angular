.PHONY: help install install-api install-web dev dev-api dev-web test lint clean

help:
	@echo "Targets:"
	@echo "  install      - Install API and web dependencies"
	@echo "  dev          - Run API and web concurrently (use two terminals)"
	@echo "  dev-api      - Run FastAPI agent on http://localhost:8001 (override with PORT=)"
	@echo "  dev-web      - Run Angular client on http://localhost:4200"
	@echo "  test         - Run API tests"
	@echo "  lint         - Run ruff + eslint"
	@echo "  clean        - Remove caches and build artifacts"

install: install-api install-web

install-api:
	cd apps/api && python3 -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"

install-web:
	cd apps/web && npm install

dev:
	@echo "Run 'make dev-api' in one terminal and 'make dev-web' in another."
	@echo "Or use ./scripts/dev.sh to run both."

dev-api:
	cd apps/api && . .venv/bin/activate && uvicorn src.main:app --reload --port $${PORT:-8001}

dev-web:
	cd apps/web && npm start

test:
	cd apps/api && . .venv/bin/activate && pytest -q

lint:
	cd apps/api && . .venv/bin/activate && ruff check src
	cd apps/web && npm run lint

clean:
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	find . -type d -name .pytest_cache -prune -exec rm -rf {} +
	find . -type d -name .ruff_cache -prune -exec rm -rf {} +
	rm -rf apps/web/dist apps/web/.angular
