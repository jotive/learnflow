# LearnFlow — Backend

API REST de LearnFlow: rutas de aprendizaje corporativo, actividades, asignación a miembros
y control de cumplimiento. Este documento cubre solo el backend. Para levantar el stack
completo (Postgres + migraciones + API + frontend) con un comando, ver el
[README raíz](../README.md). Las decisiones técnicas y sus alternativas descartadas viven en
[`DECISION_LOG.md`](../DECISION_LOG.md).

## Stack

- Python 3.12, FastAPI, Pydantic v2
- SQLAlchemy 2.0 + Alembic sobre PostgreSQL 16
- Auth: JWT bearer (HS256) + bcrypt
- Pruebas: pytest, pytest-cov; flake8 / ruff / black / isort

## Arquitectura

Arquitectura limpia con dependencias apuntando hacia adentro. El dominio no conoce el
framework ni la base de datos; la aplicación depende del dominio vía puertos; la
infraestructura implementa esos puertos y cablea FastAPI.

```text
infrastructure  ->  application  ->  domain
   (FastAPI,          (un caso        (entidades, enums,
    SQLAlchemy,        de uso por      políticas, puertos;
    JWT, bcrypt)       acción)         sin framework)
```

```text
app/
  domain/            # entidades, enums, excepciones, políticas, puertos, paginación
  application/
    dtos.py          # comandos y filtros de entrada
    use_cases/       # un archivo por acción de negocio
      auth/          # authenticate_user
      users/         # provision/list/update/delete_member
      paths/         # create/get/list/update/delete/complete_path
      activities/    # create/list/update/update_status/assign/delete_activity
  infrastructure/
    api/             # routers, deps, schemas, presenters, errores, observabilidad
    auth/            # emisión/validación JWT, bcrypt
    db/              # modelos SQLAlchemy, repositorios, sesión, seed
    email/           # notifier (implementación que registra en log)
    i18n/            # catálogos de mensajes es / en
    settings.py      # configuración por entorno (pydantic-settings)
    logging.py       # logging estructurado, request_id por petición
    main.py          # ensamblaje de la app
```

Convención de código del proyecto: cero docstrings y cero comentarios inline; los nombres
de funciones leen como la regla de negocio que aplican. Cada caso de uso recibe sus puertos
por inyección en el constructor.

## Ejecución

La vía recomendada es Docker desde la raíz (`docker compose up --build`); levanta
`db -> migrate -> backend` en orden. Para iterar el backend con el intérprete del host:

```bash
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-dev.txt
```

En Linux/macOS usar `.venv/bin/python` en lugar de `.venv/Scripts/python.exe`.

Servir la API local contra la base de datos del contenedor:

```bash
docker compose up -d --wait db                                            # 1. Postgres sano
docker compose run --rm migrate                                           # 2. migraciones + seed
cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --reload   # 3. API
```

Documentación interactiva (Swagger UI): `http://localhost:8000/docs`.

## Variables de entorno

Se leen de `.env` (raíz) vía `pydantic-settings`. Ver [`.env.example`](../.env.example).

| Variable | Por defecto | Propósito |
|---|---|---|
| `DATABASE_URL` | — (requerida) | DSN SQLAlchemy de Postgres |
| `JWT_SECRET` | — (requerida) | Clave de firma HS256 (≥ 32 bytes) |
| `JWT_EXPIRES_MINUTES` | `60` | Vida del access token |
| `API_PREFIX` | `/api/v1` | Base de montaje de los routers |
| `CORS_ORIGINS` | `[]` | Orígenes permitidos, separados por coma |
| `CORS_ALLOW_CREDENTIALS` | `true` | Enviar credenciales en CORS |
| `LOG_LEVEL` | `INFO` | Nivel de logging |
| `LOG_JSON` | `false` | `true` emite logs JSON; `false` texto |
| `LOG_FILE` | — | Ruta de archivo rotativo; vacío = solo stdout |
| `LOG_MAX_BYTES` | `5000000` | Tamaño de rotación por archivo |
| `LOG_BACKUP_COUNT` | `5` | Archivos rotados que se conservan |

## Pruebas

```bash
cd backend
.venv/Scripts/python.exe -m pytest                 # suite + cobertura
.venv/Scripts/python.exe -m flake8 app tests
.venv/Scripts/python.exe -m ruff check app tests
```

Pirámide de dos niveles:

- **Unit** (`tests/unit/`): dominio y casos de uso contra repositorios fake en memoria
  (`tests/unit/fakes.py`). Sin DB ni HTTP.
- **Integración** (`tests/integration/`): la API con `TestClient` de FastAPI sobre SQLite
  en memoria; los repositorios SQL y el seed se ejercen contra esa misma sesión.

Las pruebas marcadas con `pg` corren contra un Postgres real vía testcontainers (requieren
Docker):

```bash
.venv/Scripts/python.exe -m pytest -m pg           # solo integración Postgres
.venv/Scripts/python.exe -m pytest -m "not pg"     # excluir Postgres
```

La cobertura se exige en `pytest.ini` con `--cov-fail-under=75` (actual: ~97%).

## Migraciones

Alembic es dueño del esquema; el backend nunca migra al arrancar.

```bash
.venv/Scripts/python.exe -m alembic upgrade head           # aplicar
.venv/Scripts/python.exe -m alembic revision --autogenerate -m "mensaje"   # nueva revisión
```

## Endpoints

Todos bajo `/api/v1`. El mapeo completo de cada requisito de la prueba a su endpoint está en
el [README raíz](../README.md#mapeo-de-requisitos-del-pdf). Resumen:

- `POST /auth/login` — emite token bearer.
- `GET|POST|PATCH|DELETE /users` — gestión de miembros (líder).
- `GET|POST|PATCH|DELETE /paths` + `POST /paths/{id}/complete` — rutas de aprendizaje.
- `POST|GET /paths/{id}/activities` — crear y listar (filtros `status` / `priority` +
  `progress_percentage`).
- `PATCH /activities/{id}`, `PATCH /activities/{id}/status`, `POST /activities/{id}/assign`,
  `DELETE /activities/{id}` — actividades.
- `GET /health`, `GET /metrics` — observabilidad.
