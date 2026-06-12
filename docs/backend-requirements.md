# Requerimientos del Backend para LearnFlow v1

Este documento detalla las necesidades y dependencias técnicas en el backend que son requeridas para el correcto funcionamiento del frontend en un entorno de producción, junto con su estado actual y la solución temporal adoptada en el frontend para el entorno local.

---

## 1. Soporte para CORS (Cross-Origin Resource Sharing)

### Descripción
El frontend y el backend corren en puertos diferentes (`http://localhost:3000` y `http://localhost:8000` respectivamente). Para que el navegador permita realizar peticiones directas de origen cruzado desde el cliente, el backend debe incluir cabeceras CORS de respuesta apropiadas.

### Requerimiento técnico
Configurar `CORSMiddleware` en la aplicación de FastAPI (`backend/app/main.py`):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Estado actual y Solución Temporal
* **Estado**: 🔴 PENDIENTE (No implementado en el backend).
* **Solución temporal en Frontend**: Durante el desarrollo local, configuramos el servidor de desarrollo de Vite para actuar como proxy inverso (`vite.config.ts`), desviando las peticiones de `http://localhost:3000/api/*` hacia `http://localhost:8000/*` en segundo plano, evitando la restricción de CORS en el navegador.

---

## 2. Endpoint para listar miembros (`GET /users`)

### Descripción
El Líder necesita asignar actividades a miembros de su equipo de manera visual. Para evitar que el Líder deba adivinar e ingresar manualmente el ID (UUID) de un miembro, el frontend requiere un selector dinámico (dropdown). Este dropdown necesita poblarse dinámicamente con los usuarios con el rol `MEMBER`.

### Requerimiento técnico
1. En **UserRepository** (puertos y adaptador SQLAlchemy), añadir un método `list_members() -> list[User]` para obtener los usuarios con rol `MEMBER`.
2. Crear un caso de uso `ListMembers` en el backend.
3. Crear una ruta `GET /users` en el router de usuarios (`backend/app/infrastructure/api/routers/users.py`) protegida para líderes que llame al caso de uso y devuelva un listado de `UserResponse`.

### Estado actual y Solución Temporal
* **Estado**: 🔴 PENDIENTE (No implementado en el backend).
* **Solución temporal en Frontend**: El frontend simula la lista de miembros usando los usuarios iniciales provistos por el seed del backend (`member1@learnflow.dev` y `member2@learnflow.dev`). Si el líder registra a un nuevo miembro mediante el formulario de invitación, este nuevo miembro no se mostrará dinámicamente en el selector hasta que el backend proporcione un endpoint para consultarlo.
