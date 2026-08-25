# Skill: API Security

Seguridad en endpoints API: validación, protección contra inyección, XSS, CSRF.

## Archivos relevantes

- `api/src/server.js` — Configuración de seguridad
- `api/src/routes/protected.routes.js` — Endpoints protegidos
- `api/src/middleware/auth.middleware.js` — Validación de sesión
- `api/src/tests/security.test.js` — Tests de seguridad API

## Protecciones implementadas

### Rate Limiting
```js
// Auth: 10 intentos/15min
app.use(["/api/auth/sign-in/email", "/api/auth/sign-up/email"], authLimiter);

// Password reset: 5 intentos/15min
app.use(["/api/auth/request-password-reset", "/api/auth/reset-password"], passwordResetLimiter);
```

### Headers de seguridad
```js
app.use(helmet());
```
- x-content-type-options: nosniff
- x-frame-options: DENY
- x-xss-protection
- strict-transport-security (producción)
- content-security-policy (considerar configurar explícitamente)

### CORS
```js
cors({
  origin: process.env.FRONTEND_URL,  // Nunca "*"
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
})
```

### Validación de input

**Frontend:**
- `required` en campos obligatorios
- `minLength={8}` en passwords
- `maxLength={50}` en nombres
- `type="email"` en emails
- Filtro de OTP: solo dígitos, max 6

**Backend (Better Auth):**
- Validación de formato de email
- Validación de strength de password
- Sanitización de inputs

### SQL Injection
- Better Auth usa parameterized queries internamente
- Proyecto usa pg pool con `$1, $2...` para queries custom
- NUNCA concatenar strings en SQL

### Protección contra user enumeration
- Login: mismo error para email existente/inexistente
- Password reset: mismo response siempre
- Mensajes genéricos en todos los errores

### XSS
- React escaping por defecto (no dangerouslySetInnerHTML)
- Helmet headers mitigan XSS reflejado
- No se inserta HTML del usuario en el DOM

### CSRF
- Las cookies usan las protecciones configuradas por Better Auth y `SameSite`.
- `trustedOrigins` restringe los orígenes permitidos.
- No hay tokens CSRF explícitos implementados en la aplicación.
- **Pendiente**: evaluar e implementar protección CSRF explícita para producción.

## Endpoints y su seguridad

| Endpoint | Auth | Rate Limit | Validación |
|----------|------|------------|------------|
| POST /api/auth/sign-up/email | No | 10/15min | Better Auth |
| POST /api/auth/sign-in/email | No | 10/15min | Better Auth |
| POST /api/auth/sign-out | Cookie | No | Better Auth |
| GET /api/auth/get-session | Cookie | No | Better Auth |
| POST /api/auth/two-factor/verify-otp | Cookie | No | Better Auth |
| POST /api/auth/request-password-reset | No | 5/15min | Better Auth |
| POST /api/auth/reset-password | No | 5/15min | Better Auth |
| GET /api/me | RequireAuth | No | Manual |
| POST /api/enable-2fa | RequireAuth | No | Manual |
| GET /api/health | No | No | Ninguna |

## Reglas obligatorias

1. SIEMPRE validar input antes de procesar
2. SIEMPRE usar parameterized queries
3. SIEMPRE retornar mensajes de error genéricos
4. NUNCA exponer stack traces en producción
5. NUNCA confiar en datos del frontend para autorización
6. SIEMPRE usar HTTPS en producción
7. SIEMPRE configurar CORS con orígenes específicos

## Tests de seguridad existentes

- Rate limiting (429 después de max)
- SQL injection (login, email)
- User enumeration (mismo error)
- Input validation (body vacío, email inválido)
- Protected routes (401, no expone datos sensibles)
- Headers (Helmet)
- CORS
