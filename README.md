# CARNAVALES 2027 — Sistema de Votación Digital

Sistema web **PWA / Responsive** para la gestión, carga, validación, auditoría y escrutinio de las puntuaciones de las comparsas del **Carnaval de Goya — Edición 2027**.

El sistema está diseñado para ser utilizado durante las noches de competencia por **jurados, escribano/veedor y administradores**, priorizando la operación **offline-first**, la trazabilidad de las acciones y la inmutabilidad de los votos confirmados.

Las reglas funcionales del sistema toman como referencia el **Proyecto de Reglamento de Organización y Competencia del Carnaval de la Ciudad de Goya — Edición 2027**.

---

## Objetivos

El sistema busca digitalizar el circuito completo de puntuación del Carnaval:

- Gestión de comparsas.
- Gestión de rubros y subrubros.
- Administración de jurados.
- Asignación de jurados por noche.
- Carga digital de puntuaciones.
- Operación sin conexión.
- Sincronización automática.
- Confirmación y bloqueo de planillas.
- Auditoría en tiempo real.
- Aplicación de sanciones.
- Cálculo automático de resultados.
- Escrutinio.
- Generación de actas oficiales.
- Exportación de resultados.
- Trazabilidad completa de las operaciones.

---

## Actores del sistema

### Jurado

Usuario encargado de puntuar los rubros asignados.

El reglamento establece jurados especializados por área y que cada jurado solamente debe puntuar los rubros correspondientes a su competencia.

Los perfiles contemplados por el reglamento incluyen:

- **Jurado 1 — Baile**
- **Jurado 2 — Vestuario**
- **Jurado 3 — Batería**

Durante cada noche se utilizan jurados diferentes y la organización comunica previamente su designación. El reglamento también contempla mecanismos de impugnación y reemplazo de jurados.

**Funciones:**

- Iniciar sesión.
- Visualizar la noche asignada.
- Visualizar las comparsas habilitadas.
- Navegar entre comparsas.
- Puntuar únicamente sus rubros.
- Guardar puntuaciones localmente.
- Trabajar sin conexión.
- Revisar la planilla.
- Confirmar la puntuación.
- Bloquear definitivamente la planilla.
- Visualizar el estado de sincronización.

---

### Escribano / Veedor

Usuario responsable de supervisar el correcto funcionamiento del proceso de puntuación y escrutinio.

El reglamento establece la presencia de veedores y del escribano durante el proceso de custodia y apertura de puntuaciones.

**Funciones:**

- Visualizar el estado de los jurados.
- Ver qué comparsas fueron puntuadas.
- Detectar planillas pendientes.
- Ver planillas confirmadas.
- Supervisar sincronizaciones.
- Ver incidencias.
- Controlar bloqueos.
- Supervisar el escrutinio.
- Validar actas digitales.
- Firmar actas.
- Acceder al historial de auditoría.

El veedor **no debe poder modificar el voto de un jurado**.

---

### Administrador

Responsable de la configuración general de la competencia.

**Funciones:**

- Crear ediciones del Carnaval.
- Crear noches de competencia.
- Gestionar comparsas.
- Gestionar usuarios.
- Gestionar jurados.
- Gestionar jurados titulares y sustitutos.
- Asignar jurados por noche.
- Gestionar rubros.
- Gestionar subrubros.
- Configurar reglas de puntuación.
- Gestionar sanciones.
- Gestionar descuentos.
- Controlar el escrutinio.
- Resolver contingencias administrativas.
- Generar reportes.
- Generar actas.
- Consultar auditorías.

---

## Puntuación

Según el reglamento, la puntuación de los jurados utiliza una escala de **0 a 10 puntos**:

| Nota | Interpretación             |
| ---: | -------------------------- |
|    0 | Rubro no presentado        |
|  1–5 | Reconocimiento al esfuerzo |
|    6 | Regular                    |
|    7 | Bueno                      |
|    8 | Muy bueno                  |
|    9 | Distinguido                |
|   10 | Sobresaliente / excelencia |

La **nota cero debe reservarse exclusivamente para situaciones donde el rubro puntuable no se presenta**.

---

## Reglas principales

### Voto individual

Cada jurado emite sus puntuaciones individualmente. El voto permanece reservado hasta el momento del escrutinio.

### Rubros

El reglamento divide los rubros en dos grandes categorías.

#### Rubros nominativos

Compiten principalmente las comparsas de primera categoría:

- Reina de Comparsa / Reina Infantil
- Anunciadora / Anunciadora Infantil
- Comisión de Frente
- Bastonera Mayor / Bastonera Mayor Infantil
- Embajador/a / Embajador/a Infantil
- Portaestandarte Mayor
- Cordoneros/as
- Maestro de Sala y Porta Bandera
- Mejor Grupo de Pasistas
- Carro Destacado o Alegórico
- Portaestandarte de Batería
- Cordoneros/as de Batería
- Comisión de Fondo
- Reina o Bastonera de Batería
- Mejor Batería
- Carroza de Reina
- Mejor Coreografía
- Mejor Tema Inédito
- Mejor Presentador/a
- Diseño e Interpretación
- Mejor Grupo Musical en Vivo

#### Rubros aleatorios

Las comparsas pueden nominar participantes para categorías especiales:

- Reina del Carnaval / Primera Princesa / Segunda Princesa
- Embajador/a Infantil
- Rey del Carnaval / Espíritu del Carnaval
- Traje Femenino / Traje Masculino
- Mejor Bailarina / Mejor Bailarín / Mejor Pareja de Baile

---

## Cálculo de resultados

El sistema ejecuta automáticamente los cálculos correspondientes al reglamento vigente:

```
Puntuación Final
=
Puntuaciones válidas
- Penalizaciones
- Descuentos reglamentarios
```

Los algoritmos están versionados para que cambios futuros del reglamento no modifiquen los resultados históricos:

```
competition_rule_version = carnaval-goya-2027-v1
```

---

## Penalizaciones

El sistema permite registrar sanciones de forma independiente de las puntuaciones de los jurados. Incumplimientos previstos:

- Horarios (ingreso/salida fuera de horario: -0.50 pts/min)
- Tiempo de desfile
- Show de batería (-0.50 pts/min por exceso)
- Cantidad mínima de integrantes
- Presentación de rubros
- Otras infracciones reglamentarias

Las penalizaciones quedan registradas como entidades independientes y auditables. **Nunca se modifica manualmente una puntuación para representar una sanción.**

---

## Jurados sustitutos

El sistema soporta reemplazo de jurados titulares por sustitutos. Cada sustitución registra:

- Jurado original y sustituto
- Noche y rubro
- Motivo y usuario que autorizó
- Fecha y hora
- Estado de planillas existentes
- Registro de auditoría

Una sustitución **no elimina ni sobrescribe información histórica**.

---

## Offline First

La aplicación está diseñada para operar en el corsódromo, donde la conectividad puede ser inestable. **El voto debe persistirse primero en el dispositivo y luego sincronizarse con el servidor.**

**Flujo:**

```
Jurado ingresa puntuación
        ↓
Guardar localmente
        ↓
¿Hay conexión?
    ├── Sí → Enviar al servidor → Servidor valida → Confirmación → Marcar sincronizado
    └── No → Pendiente de sincronización → Detectar reconexión → Enviar al servidor
```

**Estado de conexión visible:**

```
🟢 Online
🟡 Sincronizando
🔴 Sin conexión
```

---

## Estados de una planilla

```
DRAFT → LOCAL_PENDING → SYNCED → CONFIRMED → LOCKED → UNDER_REVIEW
```

Una planilla en estado **LOCKED** no puede ser modificada.

---

## Inmutabilidad

Una vez confirmado definitivamente el voto (`vote.status = LOCKED`), **ningún usuario** debe poder editarlo directamente (jurado, administrador, veedor, escribano u operador de BD).

Las correcciones excepcionales se realizan mediante operaciones adicionales auditadas. El voto original permanece almacenado.

---

## Auditoría

Todas las acciones sensibles se registran en un log de auditoría con:

```text
id, actor_id, actor_role, action, entity_type, entity_id,
previous_state, new_state, reason, device_id, ip_address,
created_at, hash
```

**Eventos auditables:** login, logout, carga de puntuación, modificación, confirmación, bloqueo, sincronización, sustitución de jurado, sanción, escrutinio, actas, impugnaciones.

---

## Escrutinio

El reglamento establece que las puntuaciones permanecen reservadas hasta la apertura formal del escrutinio. Estados posibles:

```
SCORING_OPEN → SCORING_CLOSED → SCRUTINY_PENDING → SCRUTINY_OPEN → SCRUTINY_CLOSED → OFFICIAL_RESULTS
```

---

## Autenticación

El sistema de autenticación utiliza **Better Auth** con 2FA obligatorio, sesiones server-side y cookies HttpOnly.

Ver documentación completa en **[AUTH.md](AUTH.md)**.

---

## Seguridad

La aplicación maneja información crítica para el resultado oficial de la competencia. Implementa como mínimo:

- HTTPS obligatorio
- Autenticación segura con Better Auth
- 2FA obligatorio para todos los usuarios
- Control de acceso basado en roles (ADMIN, JUDGE, NOTARY, OBSERVER, OPERATOR)
- Sesiones con expiración y cookies HttpOnly
- Rate limiting (10 req/15min login, 5 req/15min recuperación)
- Protección CSRF
- Helmet (headers de seguridad)
- CORS restringido
- Validación estricta de payloads
- Queries parametrizadas (sin SQL injection)
- Auditoría completa
- Hash de documentos oficiales (SHA-256)
- Gestión segura de secretos (.env, nunca en Git)

---

## Idempotencia

Debido al funcionamiento offline, una misma operación puede enviarse varias veces. Cada operación incluye un `operation_id` único generado en el dispositivo. El servidor garantiza `operation_id UNIQUE` para evitar votos duplicados.

---

## Conflictos de sincronización

El servidor es la autoridad final. Flujo:

```
Dispositivo envía operación
    → ¿operation_id existe? → Sí → Devolver resultado anterior
    → No → ¿Planilla bloqueada? → Sí → Rechazar
    → No → Validar → Transacción DB → Registrar auditoría → Confirmar
```

---

## Contingencia

El sistema debe continuar operando ante: caída de Wi-Fi/Internet, reinicio del dispositivo, cierre del navegador, caída del servidor, corte eléctrico, reemplazo de jurado, dispositivo dañado, sincronización duplicada, voto fuera de horario o impugnación.

Las puntuaciones pendientes se conservan localmente hasta recibir confirmación del servidor.

---

## Actas oficiales

Formatos: **PDF** y **CSV**. Cada acta incluye: edición, fecha, noche, comparsas, jurados, rubros, puntuaciones, penalizaciones, totales, firmantes, identificador único y hash criptográfico (SHA-256).

---

## UX

La interfaz está pensada para uso nocturno dentro del corsódromo:

- Dark Mode por defecto
- Alto contraste y tipografía grande
- Botones táctiles amplios
- Indicador de conexión permanente
- Navegación simple
- Confirmaciones claras para acciones destructivas
- Feedback inmediato
- Recuperación automática de sesión

---

## Estructura del proyecto

```text
carnavales/
├── api/                              # Backend
│   └── src/
│       ├── auth/                     # Configuración Better Auth
│       ├── middleware/               # requireAuth, requireTwoFactor
│       ├── routes/                   # Endpoints protegidos
│       ├── services/                 # Email, plantillas
│       ├── tests/                    # Pruebas automatizadas
│       └── server.js                 # Express + Better Auth
├── client/                           # Frontend
│   └── src/
│       ├── lib/                      # auth-client, enable-two-factor
│       ├── components/               # Modal, AuthLink, ProtectedRoute
│       ├── pages/                    # Login, Register, VerifyCode, etc.
│       └── router/                   # Rutas y modales
├── docs/                             # Documentación técnica
├── AGENTS.md                         # Especificación técnica
├── AUTH.md                           # Documentación de autenticación
└── README.md                         # Este archivo
```

---

## Modelo de dominio conceptual

```text
USER ──┬── USER_ROLE (ADMIN, JUDGE, NOTARY, OBSERVER, OPERATOR)
       └── JUDGE ──── JUDGE_ASSIGNMENT ──── COMPETITION_NIGHT
                                                   │
CARNIVAL_EDITION ──┬── COMPETITION_NIGHT
                   └── COMPARSA ──── SCORE_SHEET ──── SCORE ──── SCORING_ITEM
                                    │
                                    └── AUDIT_EVENT
```

---

## Reglas de integridad

- Un jurado no puede tener dos asignaciones incompatibles
- Una planilla bloqueada no puede modificarse
- Una operación offline no puede procesarse dos veces
- Una puntuación debe estar dentro del rango 0-10
- Un jurado solo puntuar los rubros habilitados
- Una sanción no modifica directamente el voto original
- Los registros de auditoría no se eliminan
- Una comparsa solo tiene una planilla por jurado + noche + rubros

---

## Testing

### Unit tests
Cálculo de rubros, totales, penalizaciones, desempates, validación de puntuaciones, estados de planillas.

### Integration tests
Autenticación, persistencia, API, sincronización, control de concurrencia, idempotencia.

### E2E
Escenarios críticos: jurado puntúa → pierde conexión → continúa → recupera conexión → sincroniza → confirma → bloqueo → veedor verifica → escrutinio → acta.

---

## Principios de desarrollo

1. **El voto confirmado es inmutable** — Nunca sobrescribir
2. **Offline no significa inseguro** — Toda operación offline tiene identificación y validación posterior
3. **El servidor es la autoridad final** — Las reglas críticas nunca dependen del frontend
4. **Toda operación sensible deja trazabilidad** — No existen cambios silenciosos
5. **Los cálculos deben ser reproducibles** — Resultados reconstruibles con datos originales + reglas versionadas
6. **El reglamento debe estar versionado** — Ediciones independientes

---

## Documentación del proyecto

```text
docs/
├── architecture/       # Arquitectura del sistema, offline-sync
├── database/           # Schema, migraciones
├── security/           # Modelo de seguridad, threat model
├── business/           # Reglas de puntuación, penalizaciones, desempates
└── operations/         # Plan de contingencia, runbook de noche de corso
```

---

## Fuente reglamentaria

**Proyecto de Reglamento de Organización y Competencia del Carnaval de la Ciudad de Goya — Edición 2027.**

Ante una discrepancia entre la implementación y el reglamento oficial vigente, debe prevalecer la versión formal aprobada del reglamento.

---

## Estado del proyecto

```text
🚧 EN DESARROLLO — CARNAVALES 2027
```

| Módulo           | Estado           |
| ---------------- | ---------------- |
| Autenticación    | 🟡 En desarrollo |
| Usuarios y roles | 🟡 En desarrollo |
| Modelo de datos  | 🟡 En desarrollo |
| Comparsas        | ⚪ Pendiente      |
| Jurados          | ⚪ Pendiente      |
| Asignaciones     | ⚪ Pendiente      |
| Rubros           | ⚪ Pendiente      |
| Puntuación       | ⚪ Pendiente      |
| Offline / Sync   | ⚪ Pendiente      |
| Auditoría        | ⚪ Pendiente      |
| Penalizaciones   | ⚪ Pendiente      |
| Escrutinio       | ⚪ Pendiente      |
| Actas PDF        | ⚪ Pendiente      |
| Reportes         | ⚪ Pendiente      |

---

## Desarrollo local

### Requisitos

- Node.js 20.19 o superior
- npm
- PostgreSQL 14 o superior

### 1. Base de datos

```sql
CREATE DATABASE carnavales_dev;
```

### 2. API

```bash
cd api
npm install
npm run migrate   # Crea tablas de Better Auth
npm run dev       # http://localhost:3000
```

### 3. Cliente

```bash
cd client
npm install
npm run dev       # http://localhost:5173
```

### Importante

Abrí `http://localhost:5173` y **registrá una cuenta** desde `/register` antes de intentar iniciar sesión. No hay usuarios preexistentes.

Para más detalles de configuración de autenticación, ver **[AUTH.md](AUTH.md)**.

---

## Licencia

Proyecto desarrollado para la gestión del sistema de puntuación de **Carnavales Goya 2027**.

El esquema de licenciamiento y propiedad intelectual deberá definirse antes de la distribución o publicación del código fuente.
