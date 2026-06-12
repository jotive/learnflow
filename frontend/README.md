# LearnFlow — Frontend

Interfaz de usuario web premium y responsiva para **LearnFlow**, la plataforma de desarrollo profesional y seguimiento de planes de capacitación (rutas de aprendizaje). Diseñada con una estética moderna, fluida y adaptada tanto para líderes de equipo como para miembros.

## Tecnologías Utilizadas

- **Núcleo:** React 19 + TypeScript
- **Compilador y Empaquetador:** Vite 8
- **Estilos:** Tailwind CSS v4 (configuración dinámica para modo claro y oscuro a través de la clase `.dark`)
- **Gestión del Estado Global:** Zustand (store centralizado en [path.store.ts](src/store/path.store.ts))
- **Iconografía:** Lucide React
- **Ruteo:** React Router v7

## Características Clave

1. **Dashboard Principal:**
   - Visualización de métricas clave (KPI) con efectos de resplandor (glow).
   - Cuadrícula responsiva de rutas en 3 columnas.
   - Paginación del lado del cliente (6 rutas por página) y skeletons de carga animados.
2. **Detalle de Ruta (Tablero Kanban):**
   - Panel de cabecera "Hero" elegante.
   - Kanban dividido por estados (*No Iniciado*, *En Progreso*, *Completado*) con arrastrar y soltar (Drag and Drop).
   - Asignación rápida de miembros del equipo con opción de desasignación instantánea ("X") en la tarjeta.
   - Barras de progreso con gradientes dinámicos y controles de estado de actividad adaptables.
3. **Gestión de Equipo (`/team`):**
   - Indicadores KPI superiores en tiempo real (Miembros totales, asignaciones, completadas, promedio de progreso).
   - Filtros dinámicos por rol (Todos, Miembros, Administradores) y estado (Activos, Inactivos, Suspendidos).
   - Buscador en tiempo real y paginación interactiva (8 elementos por página).
   - Modal de administración para editar datos del perfil y desactivar miembros de forma segura.
4. **Modo Oscuro Integrado:**
   - Mapeo de colores semánticos con alto nivel de contraste de accesibilidad (cumpliendo estándares de legibilidad WCAG AA en modo claro y modo oscuro).

## Estructura del Directorio

```text
frontend/
├── src/
│   ├── assets/       # Recursos estáticos (estilos globales)
│   ├── components/   # Componentes reutilizables (modales, selectores)
│   ├── models/       # Definiciones de tipos y modelos de dominio
│   ├── services/     # Clientes de API, servicios y manejadores de error
│   ├── store/        # Stores de Zustand (auth, path)
│   └── views/        # Vistas y páginas principales de la aplicación (Dashboard, PathDetail, Team, Statistics, Login)
├── index.html
├── package.json
└── tsconfig.json
```

## Scripts Disponibles

En el directorio del frontend, puedes ejecutar:

### `bun run dev` o `npm run dev`
Inicia el servidor de desarrollo local de Vite en `http://localhost:3000`.

### `bun run build` o `npm run build`
Compila la aplicación para producción en la carpeta `dist`. Realiza comprobaciones estrictas de tipos con TypeScript.

### `bun run lint` o `npm run lint`
Ejecuta el linter (ESLint) para comprobar y reportar cualquier problema de estilo o malas prácticas de código.

### `bun run preview` o `npm run preview`
Ejecuta de manera local el bundle compilado de producción en `dist`.
