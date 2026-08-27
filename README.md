# Carnavales

Aplicación web con autenticación integrada mediante React, Express, Better Auth y PostgreSQL.

## Estructura

```text
carnavales/
├── api/       # Node.js, Express, Better Auth y PostgreSQL
└── client/    # React, Vite y React Router
```

## Funcionalidades de autenticación

- Registro con nombre, apellido, correo y contraseña.
- Inicio y cierre de sesión mediante cookies HttpOnly.
- Verificación en dos pasos mediante código OTP.
- OTP cifrado en la base de datos y entrega por consola solo en desarrollo o por SMTP.
- Rutas protegidas y consulta de la sesión actual.
- Las rutas de negocio rechazan sesiones cuya cuenta todavía no tenga 2FA habilitado.
- La sesión de enrolamiento solo obtiene acceso después de verificar el OTP y ser rotada por Better Auth.
- Al completar el OTP se revocan las demás sesiones previas del usuario.
- Recuperación y restablecimiento de contraseña.
- Rate limiting, Helmet y CORS restringido por configuración.

## Requisitos

- Node.js 20.19 o superior (Vite 8 requiere Node 20.19+ o 22.12+).
- npm.
- PostgreSQL 14 o superior.

## Desarrollo local

### 1. API

```bash
cd api
npm install
```

Copia `api/.env.example` como `api/.env` y configura al menos:

```env
DATABASE_URL=postgres://postgres:your-password@localhost:5432/carnavales_dev
BETTER_AUTH_SECRET=un-secreto-aleatorio-de-al-menos-32-caracteres
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
EMAIL_PROVIDER=console
NODE_ENV=development
PORT=3000
```

La base de datos PostgreSQL debe existir antes de ejecutar la migración. Créala
manualmente con PostgreSQL (por ejemplo, desde `psql` o pgAdmin):

```sql
CREATE DATABASE carnavales_dev;
```

Usa el mismo nombre de base de datos que aparece en `DATABASE_URL`. Después,
ejecuta la migración para crear las tablas de Better Auth e inicia la API:

```bash
npm run migrate
npm run dev
```

En Windows PowerShell, si `npm run migrate` falla porque la ejecución de
`npm.ps1` está deshabilitada, ejecuta el mismo script mediante el lanzador de
Windows:

```powershell
npm.cmd run migrate
```

Este error pertenece a la política de ejecución de PowerShell, no a Better
Auth. El comando debe ejecutarse desde el directorio `api`, igual que el
comando original.

La API queda disponible por defecto en `http://localhost:3000`.

### 2. Cliente

En otra terminal:

```bash
cd client
npm install
```

Copia `client/.env.example` como `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Inicia el cliente:

```bash
npm run dev
```

El cliente queda disponible por defecto en `http://localhost:5173`.

Una vez que ambos servidores estén corriendo, abre `http://localhost:5173` y
**registrá una cuenta** desde `/register` antes de intentar iniciar sesión.
No hay usuarios preexistentes en la base de datos; la primera sesión se crea
desde el formulario de registro.

## Verificación

Pruebas automatizadas de la API:

```bash
cd api
npm test
```

Pruebas del cliente:

```bash
cd client
npm test
```

Build de producción del cliente:

```bash
cd client
npm run build
```

## Variables sensibles

No se deben versionar archivos `.env`, secretos de Better Auth, credenciales de PostgreSQL ni credenciales SMTP. Los archivos `.env.example` contienen únicamente valores de referencia.

## Antes de producción

La configuración incluida permite desarrollar y probar localmente. Antes de habilitar usuarios reales se debe:

- Configurar `EMAIL_PROVIDER=smtp` y credenciales de un proveedor transaccional; la aplicación falla de forma segura si se intenta usar el adaptador de consola en producción.
- Usar HTTPS y cookies `Secure`.
- Completar la protección CSRF para la topología de despliegue elegida.
- Confirmar la política definitiva de 2FA para cada rol y aplicarla también a las rutas de negocio que se agreguen a la API.
- Gestionar secretos desde el proveedor de despliegue.
- Ejecutar las pruebas y una revisión de seguridad en un entorno de staging.
