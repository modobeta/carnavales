# AGENTS.md

## Project: Carnavales

Este proyecto implementa un sistema de autenticación y autorización
seguro para una aplicación web.

El objetivo principal es proporcionar autenticación robusta, sesiones
seguras, verificación de identidad (2FA) y una base arquitectónica
preparada para autorización basada en roles.

---

# 1. Stack tecnológico

## Frontend

- React 18
- Vite 8
- JavaScript (ESM)
- React Router v7
- better-auth/react (cliente)
- CSS

## Backend

- Node.js (ESM modules, `"type": "module"`)
- Express 4.21
- JavaScript (ESM)
- Better Auth 1.6.x
- express-rate-limit
- Helmet
- CORS
- REST API

## Database

- PostgreSQL 14+
- pg Pool (sin ORM)
- Better Auth gestiona sus propias tablas

## Authentication

- Better Auth (fuente principal de verdad)
- Session-based authentication (cookies HttpOnly)
- Email/password
- 2FA/OTP via plugin twoFactor
- Sesiones server-side
- El alta de 2FA permanece pendiente hasta verificar un OTP; la verificación rota la sesión

En desarrollo, el adaptador `console` imprime el código OTP. En producción,
la aplicación exige el adaptador `smtp`, nunca registra el código y almacena
el OTP cifrado mediante Better Auth.

---

# 2. Principios obligatorios

Todas las decisiones técnicas deben seguir:

1. Security by Design
2. Defense in Depth
3. Principle of Least Privilege
4. Secure Defaults
5. Fail Securely
6. Explicit validation
7. Separation of concerns
8. Auditability
9. Minimal exposure of sensitive information
10. No secrets committed to Git

La seguridad tiene prioridad sobre la comodidad de implementación.

---

# 3. Reglas críticas

## Secrets

Nunca:

- hardcodear contraseñas
- hardcodear API keys
- hardcodear secrets de Better Auth
- hardcodear database credentials
- subir `.env`
- imprimir secrets en logs

Utilizar:

- `.env`
- `.env.example`
- secret managers en producción

## Backend prohibiciones

- `eval()`, `Function()`, `new Function()`
- SQL construido mediante concatenación
- `console.log` de passwords, tokens o datos sensibles en producción
- Exponer stack traces al cliente en producción
- Confiar en datos del frontend para autorización
- Deshabilitar Helmet en producción
- CORS `origin: "*"` con credentials

## Frontend prohibiciones

- `localStorage` para tokens/credenciales
- `sessionStorage` para datos sensibles
- `dangerouslySetInnerHTML` con input del usuario
- Hardcodear URLs de API de producción; solo se permite el fallback local de desarrollo
- Confiar en guards de React como seguridad real

---

# 4. Authentication

La autenticación debe utilizar Better Auth como componente principal.

No implementar manualmente:

- generación de sesiones
- hashing de passwords
- tokens de recuperación
- tokens de verificación
- rotación de sesiones
- envío de OTP

si Better Auth ya proporciona una implementación segura para ello.

La contraseña nunca debe almacenarse en texto plano.

Better Auth gestiona el hashing seguro de passwords; no debe implementarse manualmente.

---

# 5. Sessions

Sesiones server-side gestionadas por Better Auth.

Las cookies de autenticación deben utilizar:

- HttpOnly (default de Better Auth)
- Secure en producción
- SameSite lax (default)
- expiración razonable
- rotación/invalidez cuando corresponda

Nunca almacenar tokens de autenticación sensibles en:

- localStorage
- sessionStorage
- cookies accesibles mediante JavaScript

---

# 6. Backend Architecture

```
api/
├── src/
│   ├── auth/
│   │   └── auth.js            # Configuración Better Auth
│   ├── middleware/
│   │   └── auth.middleware.js  # requireAuth y requireTwoFactor
│   ├── routes/
│   │   └── protected.routes.js # Rutas /api/me, /api/enable-2fa, /api/health
│   ├── services/
│   │   └── email.service.js    # Adaptadores console y SMTP
│   └── server.js               # Express + Better Auth
├── .env
├── .env.example
└── package.json
```

El backend debe mantener separación entre:

- routes → definen endpoints, delegan a controllers
- controllers → lógica HTTP, validación, respuestas
- services → lógica de negocio
- middleware → cross-cutting concerns (auth, logging)

---

# 7. Frontend Architecture

```
client/
├── src/
│   ├── lib/
│   │   └── auth-client.js     # Cliente Better Auth
│   ├── components/
│   │   ├── AuthLink.jsx         # Enlaces que conservan el fondo del modal
│   │   ├── Modal.jsx             # Modal accesible controlado por rutas
│   │   └── ProtectedRoute.jsx    # Guard de rutas (solo UX)
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── VerifyCode.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   └── Home.jsx
│   ├── router/
│   │   └── Router.jsx
│   ├── App.jsx
│   └── main.jsx
├── .env
└── package.json
```

El frontend es UX, no seguridad. El backend SIEMPRE verifica.

Las rutas públicas de autenticación (`/login`, `/register`, `/verify-code`,
`/forgot-password` y `/reset-password`) se renderizan como modales controlados
por React Router sobre la pantalla base `/`. El acceso directo a una ruta sigue
siendo válido y muestra el modal a pantalla completa.

---

# 8. Database

- PostgreSQL 14+
- pg Pool (sin ORM)
- Better Auth crea/modifica sus tablas mediante `npm run migrate` en `api`
- Parameterized queries (`$1, $2...`) siempre
- Constraints, foreign keys, índices para integridad
- No almacenar passwords en texto plano
- Better Auth gestiona los OTP; no implementar almacenamiento manual

---

# 9. API Design

## Endpoints Better Auth (automáticos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/sign-up/email | Registro |
| POST | /api/auth/sign-in/email | Login |
| POST | /api/auth/sign-out | Logout |
| GET | /api/auth/get-session | Obtener sesión |
| POST | /api/auth/two-factor/send-otp | Enviar OTP |
| POST | /api/auth/two-factor/verify-otp | Verificar OTP |
| POST | /api/auth/request-password-reset | Solicitar recuperación |
| POST | /api/auth/reset-password | Restablecer contraseña |

## Endpoints personalizados

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | /api/me | ✓ + 2FA | Info del usuario |
| POST | /api/enable-2fa | ✓ | Habilitar 2FA |
| GET | /api/health | ✗ | Health check |

## Rate limiting

- 10 requests/15min en login y registro
- 5 requests/15min en recuperación de contraseña
- Rate limiting por IP

---

# 10. Security

## Headers de seguridad

- Helmet habilitado en todas las rutas
- CORS restringido a `FRONTEND_URL`

## Autenticación

- Better Auth para toda operación de auth
- Mensajes de error genéricos (sin user enumeration)
- Rate limiting en endpoints de auth
- 2FA/OTP con expiración y límite de intentos

## Autorización

- `requireAuth` protege los endpoints personalizados actuales
- RBAC, permisos granulares y ownership todavía no están implementados
- Frontend solo UX, no seguridad

## Input

- Validar body, params, query
- Parameterized queries (pg)
- No mass assignment

## Errores

- Mensajes genéricos en producción
- Stack traces no expuestos al cliente
- Logging interno de errores

---

# 11. Environment Variables

## Backend (.env)

| Variable | Descripción |
|----------|-------------|
| DATABASE_URL | Conexión PostgreSQL |
| BETTER_AUTH_SECRET | Secreto Better Auth (mín. 32 chars) |
| BETTER_AUTH_URL | URL del backend |
| FRONTEND_URL | URL del frontend (CORS) |
| SMTP_HOST | Servidor SMTP |
| SMTP_PORT | Puerto SMTP |
| SMTP_USER | Usuario SMTP |
| SMTP_PASSWORD | Contraseña SMTP |
| EMAIL_PROVIDER | `console` en desarrollo o `smtp` en producción |
| EMAIL_FROM | Email remitente |
| PASSWORD_RESET_TOKEN_TTL | TTL del token de recuperación |
| MAIL_FROM | Email remitente |
| NODE_ENV | development/production |
| PORT | Puerto del servidor |

## Frontend (.env)

| Variable | Descripción |
|----------|-------------|
| VITE_API_URL | URL del backend |

---

# 12. Skills

Las Skills de seguridad están en `.agents/skills/`:

| Skill | Responsabilidad |
|-------|-----------------|
| backend-security | Node.js, Express, Helmet, CORS, rate limiting |
| authentication | Login, logout, sesiones, brute force |
| authorization | RBAC, roles, permisos, IDOR |
| better-auth-integration | Configuración Better Auth, Express, React |
| api-security | Validación, SQL injection, XSS, CSRF |
| database-security | PostgreSQL, parameterized queries |
| frontend-security | ProtectedRoute, XSS, localStorage |
| security-testing | Tests de auth, authz, vulnerabilidades |
| security-code-review | Auditoría de código, clasificación |

Usar estas Skills al desarrollar, modificar o revisar código.

---

# 13. Testing

## Tests pendientes

- [x] Login correcto/incorrecto
- [x] User enumeration
- [x] Rutas protegidas con sesión
- [x] Rutas de negocio bloqueadas hasta habilitar 2FA
- [x] Rate limiting
- [x] Input inválido
- [x] SQL injection
- [ ] IDOR
- [ ] Sesiones expiradas por timeout
- [x] Logout
- [x] 2FA/OTP backend: habilitación, envío, verificación y sesión final

## Framework

- Node.js test runner en API y cliente
- Tests de API en `api/src/tests/`
- Tests del cliente en `client/src/lib/*.test.js`

---

# 14. Deployment

## Pre-requisitos

- Node.js 20.19+ (o 22.12+)
- PostgreSQL 14+
- SMTP server (producción)

## Comandos

```bash
# Backend
cd api
npm install
npm run migrate
npm run dev

# Frontend
cd client
npm install
npm run dev
```

## Producción

- `BETTER_AUTH_SECRET` con valor fuerte
- `NODE_ENV=production`
- HTTPS habilitado
- SMTP real configurado
- Helmet habilitado
- CORS restringido
