# Registro de Decisiones

Decisiones técnicas, sus compensaciones y las alternativas descartadas. Cada decisión nueva
se agrega como sección numerada.

## Índice

| # | Decisión | Driver principal |
|---|---|---|
| 1 | Arquitectura limpia / hexagonal | Testeabilidad y límites claros |
| 2 | PostgreSQL + Alembic como servicio | Esquema versionado y reproducible |
| 3 | Cumplimiento distinto de finalización | Regla de negocio central de L&D |
| 4 | Monorepo, compose backend primero | Levantar todo con un comando |
| 5 | Borrado suave | Auditoría y reversibilidad |
| 6 | Roles normalizados, enums en línea | Normalizar solo lo que tiene identidad |
| 7 | Versionado de API por prefijo | Contrato estable para clientes |
| 8 | Errores localizados por código | Accionable por máquina + bilingüe |
| 9 | Paginación como objeto de valor | Sin fugas de tipos al dominio |
| 10 | Auth JWT stateless + bcrypt | Escala horizontal sin estado de sesión |
| 11 | Estrategia de testing en pirámide | Velocidad de feedback + fidelidad |
| 12 | Repositorio como frontera de query | Simplicidad: sin CQRS prematuro |
| 13 | Frontend SPA React + Vite | Producto con UI, despliegue desacoplado |
| 14 | Notificaciones: puerto + plantillas reutilizables | Transporte y contenido intercambiables |

---

## 1. Arquitectura limpia / hexagonal

**Estado:** aceptada

### Contexto

El sistema tiene reglas de negocio reales (control de cumplimiento, permisos por rol) que
deben ser testeables de forma aislada del framework web y de la base de datos. El brief
también pide capas explícitas Dominio / Aplicación / Infraestructura.

### Decisión

Adoptar arquitectura limpia con dependencias apuntando hacia adentro: el dominio no depende
de nada, la aplicación depende del dominio a través de puertos (repositorios abstractos y
notifier), la infraestructura implementa esos puertos y cablea FastAPI. Los casos de uso
reciben los puertos por inyección en el constructor.

### Alternativas descartadas

- **Router con llamadas directas al ORM:** menos archivos, pero acopla la regla de negocio
  a FastAPI y SQLAlchemy, e impide probar el dominio sin levantar HTTP ni DB.
- **Service layer anémica sobre Active Record:** difumina dónde vive la regla; el modelo ORM
  termina con lógica de negocio y se vuelve intesteable de forma aislada.

### Consecuencias

- Las reglas de dominio se prueban unitariamente contra repositorios en memoria, sin DB ni
  HTTP.
- Cambiar la persistencia o el canal de email toca solo la infraestructura.
- Más archivos de arranque que un enfoque router-con-llamadas-ORM, aceptado por la
  testeabilidad y los límites claros.

---

## 2. PostgreSQL + migraciones Alembic como servicio

**Estado:** aceptada

### Contexto

El sistema necesita una base de datos relacional real y una forma reproducible de crear y
evolucionar el esquema. Crear el esquema vía `Base.metadata.create_all()` es cómodo pero no
deja historial de migraciones y diverge de la práctica de producción.

### Decisión

Usar PostgreSQL 16 como base de datos y Alembic como dueño del esquema. En Docker Compose el
esquema lo aplica un servicio `migrate` dedicado de un solo disparo que corre `alembic
upgrade head` y el paso de seed antes de que arranque el backend. Orden de servicios:
`db -> migrate -> backend`.

### Alternativas descartadas

- **`create_all()` al arrancar:** sin historial, sin downgrade, y deriva silenciosamente del
  estado real en producción.
- **Migrar dentro del contenedor del backend al boot:** acopla arranque de la app con cambio
  de esquema y rompe en despliegues con múltiples réplicas (carreras en `upgrade`).

### Consecuencias

- Los cambios de esquema quedan versionados, revisables y reproducibles en cualquier
  entorno.
- El contenedor del backend nunca corre migraciones al arrancar.
- Las pruebas de integración corren contra SQLite en memoria creado desde la metadata de
  SQLAlchemy por velocidad; Alembic es dueño de los entornos Postgres reales.

---

## 3. El cumplimiento es distinto de la finalización

**Estado:** aceptada

### Contexto

Un rastreador ingenuo de rutas de aprendizaje trata "hecho" como un único porcentaje. El
L&D corporativo necesita garantizar que el material obligatorio se termine mientras el
material opcional puede quedar abierto.

### Decisión

Mantener dos atributos de actividad independientes:

- `priority` (`HIGH` | `MEDIUM` | `LOW`) para urgencia y filtrado.
- `is_mandatory` para el control de cumplimiento.

`LearningPath` expone dos propiedades derivadas, calculadas al leer:

- `progress_percentage` = actividades completadas / actividades totales.
- `is_compliant` = toda actividad obligatoria está completada.

La firma de la ruta (`POST /paths/{id}/complete`) se controla por cumplimiento, no por
finalización total.

### Alternativas descartadas

- **Un único porcentaje de avance:** colapsa "urgente" con "obligatorio" y no puede
  garantizar el cumplimiento normativo, que es el valor diferencial del producto.
- **Persistir `is_compliant`/`progress` como columnas:** se desincroniza del estado real de
  las actividades; derivar al leer mantiene consistencia.

### Consecuencias

- La regla de negocio central es explícita, testeable unitariamente y visible en la API.
- Derivar al leer mantiene los valores consistentes con el estado de las actividades.
- Una ruta puede tener trabajo opcional pendiente y aun así estar en cumplimiento.

---

## 4. Monorepo, compose con backend primero

**Estado:** aceptada

### Contexto

El entregable crece hacia un producto completo: API de backend más una SPA de frontend.
Debe ser trivial de levantar para un revisor que solo clone el repo.

### Decisión

Mantener backend y frontend en un solo repositorio (`backend/`, `frontend/`) con un único
`docker-compose.yml` en la raíz. `docker compose up` encadena `db -> migrate -> backend ->
frontend` con healthchecks. El frontend es una SPA React + Vite servida como contenedor
propio (ver decisión 13), no un framework SSR; backend y frontend conservan toolchains,
pruebas y ciclos de despliegue independientes.

### Alternativas descartadas

- **Dos repos separados desde el día uno:** sincronizar contrato API y versiones entre repos
  añade fricción sin beneficio en esta etapa.
- **Backend y frontend en una sola imagen:** mezcla toolchains (Python/Node) y ciclos de
  despliegue que deberían escalar por separado.

### Consecuencias

- Un clon, un comando, el stack completo (API + UI) corriendo.
- Registro de decisiones y docs compartidos cubren todo el sistema en un solo lugar.
- Backend y frontend mantienen toolchains y pruebas independientes.
- El despliegue puede separarse naturalmente: contenedor backend, Postgres gestionado,
  frontend estático o en edge.

---

## 5. Borrado suave en vez de borrado físico

**Estado:** aceptada

### Contexto

Borrar rutas y actividades destruye el historial de auditoría y rompe el reporte de
cumplimiento: una vez que una actividad obligatoria desaparece, no queda registro de que
existió. El L&D necesita que los borrados sean reversibles y rastreables.

### Decisión

El borrado es suave. `LearningPath` y `Activity` llevan `deleted_at` y `deleted_by`. El
dominio expone `soft_delete(actor)`; los casos de uso lo invocan y persisten vía `update`,
nunca un `DELETE` de fila. Toda ruta de lectura filtra `deleted_at IS NULL`, incluidos los
conteos de paginación y las listas de actividades agregadas a una ruta.

Los miembros usan un mecanismo análogo pero por bandera: `User.is_active`. `UserRepository.
delete(user_id)` desactiva la cuenta (`is_active = False`) y libera sus asignaciones en vez
de borrar la fila. La desactivación se aplica en todo el sistema: la cuenta no puede
autenticarse, su token vigente deja de validar, no aparece en listados ni conteos y no puede
recibir nuevas asignaciones de actividad. Se eligió una bandera y no `deleted_at` porque la
identidad del usuario (email único, historial de asignaciones) debe persistir incluso
inactiva; un `deleted_at` invitaría a reusar el email y romper la trazabilidad.

### Alternativas descartadas

- **Borrado físico:** irreversible y destruye la evidencia que exige el cumplimiento.
- **Tabla de auditoría separada con triggers:** más maquinaria operacional de la que justifica
  el tamaño actual; un par de columnas resuelve el requisito real.

### Consecuencias

- Los registros borrados permanecen para auditoría y posible restauración.
- Las consultas filtran por `deleted_at` (paths/actividades) o `is_active` (usuarios); el
  repositorio lo centraliza para que los casos de uso lo ignoren.
- Ningún puerto expone un borrado físico: `delete()` de usuario es una desactivación, y
  paths/actividades solo se marcan; se elimina una clase de borrados físicos accidentales.

---

## 6. Roles normalizados, enums de valor en línea

**Estado:** aceptada

### Contexto

El sistema tiene tanto clasificaciones con identidad propia (un rol tiene id, un código
estable y un nombre visible) como clasificaciones de puro valor (`priority`, `status` de
actividad) que no cargan atributos más allá de la etiqueta.

### Decisión

Normalizar solo las entidades. `Role` pasa a ser su propia tabla referenciada por clave
foránea, así la metadata del rol vive en un solo lugar. `Priority` y `ActivityStatus`
quedan como columnas de texto respaldadas por enums de dominio; no tienen atributos que
ameriten una tabla.

### Alternativas descartadas

- **Todo como enum en código (rol incluido):** un cambio de nombre de rol obligaría a un
  despliegue, y el rol sí carga atributos persistibles.
- **Todo normalizado en tablas (priority y status incluidos):** joins y semillas para
  catálogos que no tienen atributo alguno; sobreingeniería.

### Consecuencias

- Nombres y códigos de rol cambian en una sola fila, no en cada usuario.
- Los enums de valor quedan simples, con validación forzada en el dominio, no vía joins.
- Promover un enum de valor a tabla luego es una migración localizada si llegara a crecer
  en atributos (peso, orden).

---

## 7. Versionado de API vía un prefijo configurable

**Estado:** aceptada

### Contexto

Los contratos HTTP públicos necesitan una versión estable y explícita para que los clientes
no se rompan por cambios incompatibles futuros. Los despliegues detrás de un reverse-proxy
también pueden necesitar montar la API bajo una base distinta.

### Decisión

Todos los routers se montan bajo un único `APIRouter(prefix=settings.api_prefix)`.
`api_prefix` tiene por defecto `/api/v1` y es sobreescribible vía la variable de entorno
`API_PREFIX`. El segmento de versión es un contrato de código: una `v2` incompatible se
publica como routers nuevos montados junto a `v1`. La variable de entorno ajusta solo la
base de montaje del despliegue, no la versión.

### Alternativas descartadas

- **Versionado por header (`Accept` con media type):** más difícil de explorar, cachear y
  documentar para consumidores externos; el prefijo en la ruta es explícito.
- **Tratar la versión como puro valor de entorno:** invita a "cambiar v1 a v2" por config,
  rompiendo a los clientes de v1 en silencio; la versión debe ser un cambio de código.

### Consecuencias

- Un solo punto de ensamblaje es dueño del prefijo; pruebas y app comparten la misma fuente
  de verdad.
- Los clientes obtienen un contrato versionado y determinista expuesto en OpenAPI.
- Los despliegues en subruta funcionan sin cambios de código; los saltos de versión siguen
  siendo un cambio de código.

---

## 8. Errores localizados vía códigos estables

**Estado:** aceptada

### Contexto

Las respuestas de error deben ser a la vez accionables por máquina y legibles por humanos, y
el producto sirve usuarios en español e inglés. Ramificar clientes sobre una cadena de error
o el nombre de una clase de excepción es frágil e intraducible.

### Decisión

Cada excepción de dominio lleva un `code` estable en snake_case. El handler devuelve
`{ "code", "message" }`, resolviendo `message` desde un catálogo por idioma
(`infrastructure/i18n/es.py`, `en.py`) indexado por código. El idioma viene del header
`Accept-Language`, con `es` por defecto. Sin gettext/babel; un catálogo de diccionario
plano basta a este tamaño.

### Alternativas descartadas

- **Devolver solo `detail` en texto (default de FastAPI):** obliga al cliente a parsear
  strings traducibles; imposible ramificar lógica de forma estable.
- **gettext/babel con archivos `.po`:** toolchain y compilación de catálogos
  desproporcionados para dos idiomas y un puñado de mensajes.

### Consecuencias

- Los clientes se ramifican por `code`; el copy y las traducciones cambian sin tocarlos.
- Agregar un idioma es un solo archivo de catálogo.
- El dominio queda libre de framework e idioma; solo la infraestructura conoce los mensajes.

---

## 9. Paginación como objeto de valor de dominio

**Estado:** aceptada

### Contexto

Los endpoints de lista sobre usuarios y rutas no deben devolver conjuntos de resultados sin
límite, y el contrato de página debe ser expresable en la frontera del puerto sin filtrar
tipos web o de ORM hacia el dominio.

### Decisión

Agregar `Pagination(limit, offset)` y un `Page[T](items, total, limit, offset)` genérico al
dominio como núcleo compartido. Los puertos reciben `Pagination` y devuelven `Page`. Los
repositorios corren un `COUNT` más una consulta `LIMIT/OFFSET` compartiendo la misma tupla
de filtros. La API expone los query params `limit`/`offset` y serializa `Page` a través de
un `PageResponse[T]` genérico.

### Alternativas descartadas

- **Paginación por cursor/keyset:** más eficiente a gran escala pero más compleja para el
  cliente; `limit/offset` basta para los volúmenes esperados y es trivial de consumir.
- **Devolver listas crudas:** sin `total` el cliente no puede pintar controles de página, y
  arriesga respuestas sin límite.

### Consecuencias

- El contrato de página se define una vez y se reutiliza en puertos, casos de uso,
  repositorios y fakes.
- El dominio queda libre de tipos de FastAPI y SQLAlchemy.
- `total` requiere una segunda consulta de conteo por lista, aceptado para una paginación
  correcta del lado del cliente.

---

## 10. Autenticación JWT stateless + bcrypt

**Estado:** aceptada

### Contexto

La API necesita autenticación para el bonus de login y autorización por rol. Debe escalar a
múltiples réplicas sin estado de sesión compartido y almacenar contraseñas de forma segura.

### Decisión

Tokens JWT bearer firmados con HS256, portando `sub` (id de usuario) y `exp`
(`settings.jwt_expires_minutes`, por defecto 60). Sin almacén de sesión: cada request se
valida decodificando el token. Las contraseñas se hashean con bcrypt (`rounds=12` en
producción, `rounds=4` en tests para velocidad). La emisión y verificación viven detrás de
funciones de infraestructura (`issue_access_token`, `decode_user_id`) y un puerto
`PasswordHasher`, dejando el dominio libre de la librería de criptografía.

### Alternativas descartadas

- **Sesiones server-side (cookie + store):** requiere almacén compartido (Redis/DB) entre
  réplicas; contradice el objetivo stateless.
- **argon2:** más fuerte teóricamente, pero bcrypt es suficiente, ubicuo y sin dependencias
  de compilación nativa problemáticas; el `PasswordHasher` permite cambiarlo sin tocar el
  dominio.
- **RS256 (firma asimétrica):** útil si terceros verifican tokens; innecesario para un
  emisor/validador único, y HS256 simplifica la gestión de claves.

### Consecuencias

- El backend escala horizontalmente sin estado compartido.
- Revocar un token antes de su expiración no es posible sin una lista de revocación; se
  acepta con expiraciones cortas.
- Cambiar el algoritmo de hash es un cambio localizado detrás del puerto.

---

## 11. Estrategia de testing en pirámide

**Estado:** aceptada

### Contexto

El brief exige unit + integración con pytest y ≥75% de cobertura. El feedback de los tests
debe ser rápido para iterar, pero sin perder fidelidad en la frontera HTTP y de
persistencia.

### Decisión

Pirámide de dos niveles. **Unit:** el dominio y los casos de uso se prueban contra
repositorios fake en memoria (`tests/unit/fakes.py`), sin DB ni HTTP. **Integración:** la
API se prueba con `TestClient` de FastAPI contra SQLite en memoria (`StaticPool`), creando
el esquema desde la metadata de SQLAlchemy y sobreescribiendo la dependencia de sesión. Los
repositorios SQL y los helpers de seed se ejercen directamente contra esa misma sesión
SQLite. Cobertura exigida en `pytest.ini` con `--cov-fail-under=75`.

### Alternativas descartadas

- **Todo contra Postgres real (incl. unit):** fidelidad máxima pero lento y con setup pesado;
  mata el ciclo de feedback rápido del dominio.
- **Solo tests de integración:** cubriría líneas, pero no aísla la regla de negocio y vuelve
  los fallos difíciles de localizar.
- **Mockear el ORM en tests de API:** frágil y de bajo valor; SQLite en memoria da fidelidad
  real de SQL a costo casi nulo.

### Consecuencias

- Suite completa en segundos; el dominio se prueba sin I/O.
- Riesgo: SQLite y Postgres difieren en algunos comportamientos; Alembic y el `migrate`
  service mitigan en entornos reales.
- Cobertura actual ~96%; lo no cubierto es glue operacional que requiere Postgres real
  (`get_session`, `seed.run()`).

---

## 12. El repositorio es la frontera de query (sin CQRS)

**Estado:** aceptada

### Contexto

Los casos de uso de lista necesitan consultas con filtros, conteos y paginación. Surgió la
pregunta de si introducir una capa o clase de queries dedicada (estilo CQRS) separada de los
repositorios.

### Decisión

El repositorio es la única frontera de acceso a datos, tanto para escritura como para
lectura. Los métodos de lista (`list_members`, `list_owned_by`, `list_assigned_to`) viven en
el repositorio y comparten sus tuplas de filtros entre la consulta de `COUNT` y la de datos
(DRY). No se introduce una capa de queries ni un modelo de lectura separado.

### Alternativas descartadas

- **CQRS con modelo de lectura separado:** justificable con proyecciones complejas o cargas
  de lectura masivas; aquí sería estructura sin beneficio (YAGNI). Las lecturas y escrituras
  comparten el mismo modelo.
- **Query objects por consulta:** multiplicaría clases para lo que son métodos cohesivos del
  repositorio; añade indirección sin pago.

### Consecuencias

- Una sola abstracción de datos que aprender y testear.
- Si en el futuro aparecen lecturas analíticas pesadas, separar un modelo de lectura es una
  evolución localizada, no un rediseño.
- El repositorio crece con cada consulta nueva; aceptable mientras siga cohesivo por
  agregado.

---

## 13. Frontend como SPA React + Vite

**Estado:** aceptada

### Contexto

La prueba plantea un gestor de tareas; presentarlo como producto exige una interfaz, no solo
la API. La UI consume contratos `/api/v1` ya versionados y sirve a un líder de L&D y a
miembros autenticados: es una herramienta interna, sin necesidad de SEO ni renderizado en
servidor.

### Decisión

Una SPA con React 19, Vite como bundler, Tailwind CSS para estilos y Zustand para estado de
cliente (sesión y datos de vista). Bun como gestor de paquetes. Se sirve como contenedor
estático propio que habla con el backend por HTTP; el backend declara `CORS_ORIGINS` para
permitir el origen del frontend. Es el cuarto servicio de Compose, después de `backend`.

### Alternativas descartadas

- **Next.js (SSR/RSC):** aporta SSR, SEO y un runtime Node en producción que esta herramienta
  autenticada no necesita; añade complejidad de despliegue sin pago.
- **Create React App:** efectivamente descontinuado y con build lento frente a Vite.
- **Plantillas renderizadas por el backend:** acoplarían la UI al ciclo de despliegue de la
  API y contradicen la separación de toolchains de la decisión 4.

### Consecuencias

- El frontend se despliega como estático/edge, independiente del backend.
- Sin runtime de servidor para la UI más allá del build; modelo mental simple.
- Compensación aceptada: sin SSR/SEO (irrelevante para una herramienta interna autenticada)
  y el estado de sesión vive en el cliente (Zustand), validado siempre contra el backend.
- Las pruebas de frontend quedan diferidas (ver `docs/ROADMAP.md`); el contrato lo cubre la
  suite de integración del backend.

---

## 14. Notificaciones: puerto + plantillas reutilizables

**Estado:** aceptada

### Contexto

El brief pide una notificación ficticia al asignar una actividad. La necesidad real es doble
y de ejes independientes: **por dónde se envía** (log hoy; email real mañana) y **qué dice**
(asunto y cuerpo, en español o inglés). Mezclar ambos —strings de copy embebidos en el código
que habla con SMTP— obliga a tocar el transporte para cambiar una palabra y duplica el texto
por cada canal.

### Decisión

Separar transporte de contenido en dos abstracciones:

- **Transporte:** un puerto de dominio `Notifier` (`send_invitation`, `send_assignment`). El
  adaptador activo es `LoggingNotifier`, que registra en el log sin SMTP. Se proveen dos
  adaptadores de referencia que implementan el mismo puerto: `SesNotifier` (AWS SES vía
  `boto3`, import perezoso para no exigir la dependencia salvo que se use) y `ResendNotifier`
  (API HTTP de Resend vía `httpx`, endpoint configurable por `RESEND_ENDPOINT`). Cambiar de
  canal es editar una sola función de cableado (`get_notifier` en `deps.py`); dominio, casos
  de uso y routers no se tocan.
- **Contenido:** un módulo de plantillas (`infrastructure/email/messages.py`) que produce un
  `EmailMessage(subject, body)` a partir de las entidades. Es la única fuente del copy; los
  tres adaptadores la consumen. El idioma se parametriza reutilizando el mismo convenio del
  i18n de errores (`DEFAULT_LOCALE`, catálogos `es`/`en`); el locale es configuración del
  adaptador, no parte del contrato del puerto, así el dominio queda libre de idioma.

### Alternativas descartadas

- **Copy embebido en cada adaptador:** duplica el texto por canal y acopla contenido a
  transporte; cambiar una palabra obliga a tocar SMTP/HTTP.
- **Locale en la firma del puerto (`send_invitation(user, locale)`):** filtra una preocupación
  de presentación al contrato de dominio; el adaptador es el lugar correcto para decidir idioma.
- **Campo `locale` en la entidad `User`:** preferencia por usuario es válida a futuro, pero
  agregar estado de presentación al dominio excede el alcance actual; el locale por adaptador
  cubre la necesidad sin tocar el modelo.
- **gettext/babel para los emails:** mismo veredicto que en la decisión 8; desproporcionado
  para dos idiomas y dos plantillas.

### Consecuencias

- Cambiar el canal de envío y cambiar el texto son dos cambios localizados e independientes.
- Agregar un proveedor de email es un adaptador nuevo del puerto; agregar un idioma es una
  entrada más en el catálogo de plantillas.
- Los adaptadores de referencia (`SesNotifier`, `ResendNotifier`) se excluyen de la cobertura
  (`.coveragerc`): son ejemplos no cableados con dependencias de red. El módulo de plantillas
  sí se cubre, ejercido por `LoggingNotifier` en los tests de integración.
