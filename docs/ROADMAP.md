# Roadmap

Alcance entregado en v1 y trabajo diferido de forma consciente. Las decisiones que
sustentan lo entregado están en [`DECISION_LOG.md`](../DECISION_LOG.md).

## v1 — Entregado

- Arquitectura limpia/hexagonal con límites dominio / aplicación / infraestructura
- Autenticación JWT stateless + bcrypt
- Rutas de aprendizaje y actividades: CRUD completo
- Gating de cumplimiento distinto de finalización (regla central de L&D)
- Asignación de actividades + notificación simulada
- Borrado suave de miembros con desactivación aplicada (sin login, token invalidado, fuera de listados y asignaciones)
- Errores de dominio localizados por código (ES/EN)
- Logging estructurado: texto en local, JSON vía env, archivo rotativo, `request_id` por petición
- Endpoint `/metrics` en memoria (contadores de request y 5xx)
- PostgreSQL + Alembic, orquestación con Docker Compose
- Frontend React (Vite + Tailwind + Zustand)
- CI: lint + tests + build de imágenes para backend y frontend, gateado por rutas cambiadas
- Cobertura de pruebas backend ≥75% (actual: 97%)

## Diferido — Próximas iteraciones

### Observabilidad real
- Exportar logs/métricas a backend externo (Loki/Promtail u OTLP → Grafana/Datadog).
  La capa de logging ya deja el formato JSON portable; falta el transporte.
- Métricas persistentes (Prometheus) en lugar de contadores en memoria.
- Trazas distribuidas con `request_id` propagado a dependencias.

### Producto
- Notificación real por correo (hoy `notifier` simulado).
- Búsqueda y filtrado de rutas/actividades.
- Persistencia de log de auditoría sobre el borrado suave existente.

### Calidad / CI
- Tests de frontend (vitest + Testing Library); el job de CI hoy solo lintea y buildea.
- `bun.lock` debe regenerarse al cambiar dependencias: CI usa `--frozen-lockfile`.

### Seguridad y escala
- Refresh tokens + revocación.
- Rate limiting por cliente.
- RBAC granular más allá de los roles actuales.
