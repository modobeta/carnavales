# Skill: Security Testing

Tests de seguridad del proyecto Carnavales.

## Archivos relevantes

- `api/src/tests/auth.test.js` — Tests de autenticación (18 tests)
- `api/src/tests/security.test.js` — Tests de seguridad (11 tests)
- `api/src/tests/password-reset.test.js` — Tests de recuperación (25 tests)
- `api/src/tests/helpers.js` — Utilidades de test

## Ejecución

```bash
cd api
npm test
# Equivale a: cross-env NODE_ENV=test node --test src/tests/*.test.js
```

## Helpers de test

```js
// helpers.js
- request(method, path, body, cookies) — Cliente HTTP con cookies
- register(email, password, firstName, lastName) — Wrapper de registro
- login(email, password) — Wrapper de login
- logout(cookies) — Wrapper de logout
- getSession(cookies) — Wrapper de sesión
- getMe(cookies) — Wrapper de /api/me
- generateEmail() — Generador de emails de prueba
- forgotPassword(email) — Wrapper de solicitud reset
- resetPassword(token, newPassword) — Wrapper de reset
- createRateLimitedClient(max) — Cliente para tests de rate limiting
```

## Cobertura de tests

### auth.test.js (21 tests)
- [x] Login correcto/incorrecto
- [x] User enumeration (mismo error)
- [x] Sesiones (con cookies, con nombre, sin cookies)
- [x] 2FA (habilitación, OTP correcto y sesión final)
- [x] Logout (exitoso, sesión invalidada)
- [x] `/api/me` (registro directo bloqueado, enrolamiento bloqueado, sesiones previas revocadas, sesión 2FA, nombre, sin sesión y logout)
- [x] Registro (exitoso, con nombre, password débil, email inválido)

### security.test.js (11 tests)
- [x] Rate limiting (429 después de max)
- [x] SQL injection (login, email)
- [x] User enumeration (mismo error)
- [x] Input validation (body vacío, email inválido)
- [x] Protected routes (401, no expone datos sensibles)
- [x] Headers (Helmet)
- [x] CORS
- [x] Health check

### password-reset.test.js (25 tests)
- [x] Request reset: success, mismo response para no existente, no retorna token
- [x] Request reset: rechaza email inválido, crea token en DB
- [x] Request reset: no crea token para no existente, invalida tokens previos
- [x] Request reset: rate limiting
- [x] Reset password: success con token válido, login con nueva contraseña
- [x] Reset password: rechaza contraseña vieja, token inválido/vacío/usado/corto
- [x] Reset password: token expirado, invalida sesiones
- [x] Reset password: concurrent token usage (race condition)
- [x] Security: mismo response, token no reutilizable, token no expuesto

### email.service.test.js (3 tests)
- [x] OTP por consola solo en desarrollo
- [x] Producción falla de forma segura sin SMTP
- [x] Fallos SMTP de recuperación no permiten enumerar cuentas

### client/src/lib/enable-two-factor.test.js (2 tests)
- [x] Activación 2FA fail-closed
- [x] Envío de credenciales y contraseña a `/api/enable-2fa`

## Tests pendientes

- [ ] IDOR (acceso a recursos de otros usuarios)
- [ ] Autorización por rol
- [ ] Sesión expirada (timeout)
- [ ] Tests de componentes y hooks del frontend

## Patrones de testing

### Servidor de test
```js
const app = createApp({ rateLimitEnabled: false });
const server = app.listen(0);  // Random port
```

### Requests con cookies
```js
const response = await request(
  "POST",
  "/api/auth/sign-in/email",
  { email, password },
);
const cookies = response.cookies;
```

Los wrappers `register`, `login`, `forgotPassword` y `resetPassword` aplican
un intervalo interno entre solicitudes. Las llamadas directas a `request` no
aplican ese intervalo.

### Rate limiting test
```js
const client = await createRateLimitedClient(2);
// ... hacer requests hasta max
// Verificar 429
```

## Reglas para escribir tests

1. SIEMPRE usar `createApp({ rateLimitEnabled: false })` excepto en tests de rate limiting
2. SIEMPRE cerrar el servidor al finalizar
3. Controlar el ritmo entre requests cuando se prueben límites por IP
4. SIEMPRE verificar mensajes de error genéricos
5. SIEMPRE testear que passwords no se exponen
6. SIEMPRE testear que tokens no se exponen
