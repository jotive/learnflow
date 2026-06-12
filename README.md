# LearnFlow

Gestor de rutas de aprendizaje corporativo. Permite a un líder de L&D crear rutas de
aprendizaje, agregar actividades, asignar miembros, exigir la finalización de lo
obligatorio y seguir el progreso sin hojas de cálculo.

La distinción central del producto es **cumplimiento != 100% completado**. Una ruta puede
tener actividades opcionales pendientes y aun así estar en cumplimiento cuando toda
actividad obligatoria está completada.

## Stack

- Backend: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, PostgreSQL 16, Alembic
- Frontend: React 19, Vite, Tailwind CSS, Zustand (gestor de paquetes Bun)
- Auth: tokens JWT bearer, hash de contraseñas con bcrypt
- Calidad: pytest, pytest-cov, flake8, ruff, black, isort
- Infra: Docker Compose con `db -> migrate -> backend -> frontend`

Detalle del backend (arquitectura, variables de entorno, pruebas, migraciones) en
[`backend/README.md`](backend/README.md).

## Requisitos previos

La vía recomendada es Docker: no necesitas Python ni Node instalados localmente.

| Herramienta | Versión mínima | Necesario para | Verificar |
|---|---|---|---|
| Docker Engine | 24+ | Levantar todo el stack | `docker --version` |
| Docker Compose v2 | 2.20+ (plugin `docker compose`) | Orquestar `db`/`migrate`/`backend` | `docker compose version` |
| GNU Make | 4+ | Atajos del `Makefile` (opcional) | `make --version` |

Solo si trabajas el backend fuera de Docker (entorno local):

| Herramienta | Versión mínima | Necesario para |
|---|---|---|
| Python | 3.12 | Ejecutar pruebas y servidor sin contenedor |
| PostgreSQL | 16 | Base de datos local (o usar el contenedor `db`) |

Solo si trabajas el frontend fuera de Docker:

| Herramienta | Versión mínima | Necesario para |
|---|---|---|
| Bun | 1.1+ | `bun install` y `bun dev` |

En Windows, instalar Make con `winget install GnuWin32.Make` o `choco install make`. Sin
Make, ejecutar los comandos `docker compose ...` directamente (la columna equivalente está
en cada sección).

## Ejecución con Docker (recomendado)

Un solo comando levanta todo en orden. Compose encadena los servicios con healthchecks:
`db` (espera a estar sano) -> `migrate` (corre Alembic y siembra datos) -> `backend` ->
`frontend`. No hay que ejecutar pasos manuales en secuencia.

```bash
docker compose up --build          # equivalente: make backend  (solo API)
```

| Acción | Con Make | Sin Make |
|---|---|---|
| Levantar API + dependencias | `make backend` | `docker compose up --build backend` |
| Levantar API en modo recarga | `make backend-dev` | `docker compose up --build backend-dev` |
| Solo base de datos | `make db` | `docker compose up -d --wait db` |
| Correr migraciones + seed | `make seed` | `docker compose run --rm migrate` |
| Frontend (UI) | — | `docker compose up --build frontend` |

Documentación del backend:

```text
http://localhost:8000/docs
```

## Instalación local (sin Docker)

Para iterar el backend con el intérprete del host:

```bash
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-dev.txt
.venv/Scripts/python.exe -m pytest
```

En Linux/macOS, usar `.venv/bin/python` en lugar de `.venv/Scripts/python.exe`.

Orden para servir la API local contra la base de datos del contenedor:

```bash
docker compose up -d --wait db                              # 1. Postgres sano
docker compose run --rm migrate                             # 2. migraciones + seed
cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --reload   # 3. API
```

Usuarios semilla:

| Rol | Email | Contraseña |
|---|---|---|
| LEADER | `leader@learnflow.dev` | `leader-pass` |
| MEMBER | `member1@learnflow.dev` | `member-pass` |
| MEMBER | `member2@learnflow.dev` | `member-pass` |

## Ejecución de pruebas

```bash
cd backend
.venv/Scripts/python.exe -m pytest
.venv/Scripts/python.exe -m flake8 app tests
.venv/Scripts/python.exe -m ruff check app tests
```

La cobertura se exige en `backend/pytest.ini` con `--cov-fail-under=75`.

## Mapeo de requisitos del PDF

La prueba plantea un gestor genérico de "listas de tareas" y "tareas". En lugar de un CRUD
abstracto, lo presento como un producto con dominio propio: **LearnFlow**, un gestor de
rutas de aprendizaje corporativo. El renombre es deliberado y mantiene la equivalencia
funcional uno a uno:

| Concepto del PDF | Concepto de LearnFlow | Por qué |
|---|---|---|
| Lista de tareas | Ruta de aprendizaje (`path`) | Una ruta agrupa actividades como una lista agrupa tareas |
| Tarea | Actividad (`activity`) | Unidad de trabajo dentro de la ruta |
| Estado de tarea | Estado de actividad | `PENDING` / `IN_PROGRESS` / `COMPLETED` |
| Porcentaje de completitud | `progress_percentage` | Actividades completadas sobre el total |

Todos los endpoints se sirven bajo el prefijo de versión `/api/v1` (la tabla lo omite por
brevedad; p. ej. `POST /paths` es `POST /api/v1/paths`).

| Requisito del PDF | Endpoint de LearnFlow |
|---|---|
| CRUD de listas de tareas | `POST /paths`, `GET /paths`, `GET /paths/{id}`, `PATCH /paths/{id}`, `DELETE /paths/{id}` |
| CRUD de tareas dentro de una lista | `POST /paths/{id}/activities`, `GET /paths/{id}/activities`, `PATCH /activities/{id}`, `DELETE /activities/{id}` |
| Cambiar estado de tarea | `PATCH /activities/{id}/status` |
| Listar tareas filtradas por estado/prioridad + porcentaje de avance | `GET /paths/{id}/activities?status=&priority=` devuelve `progress_percentage` |
| Bonus: login JWT | `POST /auth/login` más endpoints protegidos por bearer |
| Bonus: asignar usuario a tarea | `POST /activities/{id}/assign` |
| Bonus: notificación de email simulada | Puerto `Notifier` con implementación que registra en log |

## Convenciones de la API

### Versionado

Toda ruta vive bajo `/api/v1`. El prefijo se lee de `API_PREFIX` (ver `.env.example`) con
un valor por defecto fijo `/api/v1`. La variable de entorno solo ajusta la base de montaje
para despliegues detrás de un reverse-proxy; el número de versión es un contrato de código,
así que una futura `v2` se publica como routers nuevos montados junto a `v1`, no editando
configuración.

### Paginación

Los endpoints de colección (`GET /api/v1/users`, `GET /api/v1/paths`) aceptan `limit`
(1-100, por defecto 20) y `offset` (>= 0, por defecto 0) como query params y devuelven un
sobre envolvente:

```json
{
  "items": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
```

`total` es el conteo total de coincidencias ignorando la ventana. Los endpoints de recurso
único devuelven el objeto desnudo, sin sobre.

### Errores

Los errores de dominio devuelven un `code` estable e independiente del idioma más un
`message` humano:

```json
{
  "code": "path_has_pending_mandatory_activities",
  "message": "La ruta tiene actividades obligatorias pendientes."
}
```

El idioma de `message` se resuelve desde el header `Accept-Language` (`es` por defecto,
`en` disponible). Los clientes se ramifican por `code`, nunca por `message`.

## Arquitectura

Arquitectura limpia con dependencias apuntando hacia adentro:

```text
infrastructure -> application -> domain
```

- `app/domain`: entidades, enums, excepciones, políticas, puertos. Libre de framework.
- `app/application`: un caso de uso por acción de negocio, puertos inyectados.
- `app/infrastructure`: repositorios SQLAlchemy, routers FastAPI, JWT, bcrypt, notifier.

## Reglas de dominio

- Los líderes crean rutas, actividades, cuentas de miembro, asignaciones y firman la
  finalización.
- Los miembros pueden listar rutas asignadas y actualizar solo actividades asignadas a
  ellos.
- `progress_percentage` es actividades completadas sobre actividades totales.
- `is_compliant` es verdadero cuando toda actividad obligatoria está completada.
- Las rutas vacías no pueden firmarse.
- Las actividades obligatorias pendientes bloquean la firma; las opcionales pendientes no.

## Pendientes

- Cobertura de pruebas del frontend (la UI React/Vite en `frontend/` aún sin tests).
- Features del roadmap: certificados, mapeo de skills con IA, auto-inscripción,
  integración HRIS, prerrequisitos.
