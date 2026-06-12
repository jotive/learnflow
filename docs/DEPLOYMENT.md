# Despliegue y CI/CD

Notas operativas del pipeline de integración y del versionado de toolchain.
Los comandos para levantar el stack viven en el [README](../README.md); aquí
solo queda lo que hay que **tener en cuenta** al desplegar o tocar la CI.

## Pipeline de CI

`.github/workflows/ci.yml` corre en `push` a `main` y en cada `pull_request`.

El job `changes` (filtro `dorny/paths-filter`) decide qué corre según qué
cambió, para no gastar runners de más:

| Cambia | Jobs que corren |
|---|---|
| `backend/**` o el propio `ci.yml` | `backend-lint`, `backend-test`, `backend-docker` |
| `frontend/**` o el propio `ci.yml` | `frontend-lint`, `frontend-build`, `frontend-docker` |

- `backend-lint`: `ruff check` + `black --check` + `isort --check-only`.
- `backend-test`: `pytest` (gate de cobertura ≥75%).
- `frontend-lint` / `frontend-build`: `bun run lint` / `bun run build`.
- `*-docker`: `docker build` de cada imagen.

> Tocar `ci.yml` dispara **ambos** sets de jobs (está en los dos filtros) — es
> deliberado: cambiar la CI revalida todo.

### Paridad local con la CI

Antes de hacer push, replicar lo que valida la CI evita el round-trip:

```bash
cd backend && ruff check . && black --check . && isort --check-only . && pytest
cd frontend && bun run lint && bun run build
```

`black` e `isort` corren en CI pero no en pre-commit local: un archivo sin
formatear pasa `ruff` y aun así rompe la CI. Formatear con `black .` e
`isort .` antes de commitear.

## Versionado del toolchain (fuente única)

### Bun

La versión de Bun está fijada en **un solo lugar lógico** por contexto:

- **CI**: `.bun-version` en la raíz del repo. `oven-sh/setup-bun` lo
  autodetecta; los jobs **no** llevan `bun-version:` inline.
- **Docker**: `ARG BUN_VERSION` en `frontend/Dockerfile`, usado por ambos
  `FROM oven/bun:${BUN_VERSION}-alpine`.

Para subir Bun: editar `.bun-version` (CI) y el default del `ARG` en el
Dockerfile. Mantenerlos sincronizados.

> **Gotcha lockfile.** `frontend/bun.lock` es el formato texto de Bun **1.2+**
> (`lockfileVersion: 1`). Bun 1.1 lo rechaza bajo `--frozen-lockfile`
> (`InvalidLockfileVersion`). Por eso el piso es 1.2, no 1.1. Si se regenera
> el lockfile con un Bun más nuevo, subir el pin en los dos sitios de arriba.

### Acciones de GitHub

Fijadas a runtimes **Node 24** (Node 20 quedó deprecado en los runners el
2026-06-16):

| Acción | Versión |
|---|---|
| `actions/checkout` | v6 |
| `actions/setup-python` | v6 |
| `oven-sh/setup-bun` | v2 |
| `dorny/paths-filter` | v4 |

Al bumpear, preferir el último major estable y revisar que corra sobre Node 24
(evita el warning de deprecación en los logs).

### Python

`actions/setup-python` con `python-version: "3.12"` (dos jobs). La imagen
backend define su propia versión en `backend/Dockerfile` — mantener ambas
alineadas con la `requires-python` del backend.

## Imágenes Docker y orquestación

`docker-compose.yml` encadena `db -> migrate -> backend -> frontend` con
healthchecks:

- `db`: `pg_isready`.
- `backend`: healthcheck HTTP a `/health`; `frontend` espera
  `condition: service_healthy`.
- `migrate`: corre `alembic upgrade head` + seed, una sola vez
  (`service_completed_successfully`).

El stack no requiere pasos manuales en secuencia: un `docker compose up
--build` levanta todo en orden.

## Releases

- Convención de commits: Conventional Commits (`feat:`, `ci:`, `docs:`, …).
- Tags: SemVer, anotados (`git tag -a vX.Y.Z -m "…"` + `git push origin vX.Y.Z`).
- `v1.0.0` = primer release del stack completo (backend + frontend + infra + docs).
