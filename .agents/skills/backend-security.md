# Skill: Backend Security

Seguridad del servidor Node.js + Express en el proyecto Carnavales.

## Archivos relevantes

- `api/src/server.js` — Express app factory, Helmet, CORS, rate limiting
- `api/src/middleware/auth.middleware.js` — requireAuth middleware
- `api/src/routes/protected.routes.js` — Rutas protegidas
- `api/src/services/email.service.js` — Adapter pattern para email
- `api/.env` — Variables de entorno (nunca versionar)

## Patrones implementados

### Express App Factory
```js
// server.js — createApp() permite deshabilitar rate limiting en tests
export function createApp({ rateLimitEnabled = true, authRateLimitMax = 10 } = {})
```
- `express.json()` va DESPUÉS de `app.all("/api/auth/*", toNodeHandler(auth))` porque Better Auth necesita raw body

### Helmet
```js
app.use(helmet());
```
- Habilitado en todas las rutas
- Headers: x-content-type-options, x-frame-options, etc.
- En producción, considerar CSP explícito

### CORS
```js
cors({
  origin: process.env.FRONTEND_URL,  // Nunca "*"
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
})
```
- Origen restringido a FRONTEND_URL
- Credentials permitidos para cookies HttpOnly

### Rate Limiting
```js
// Auth: 10 intentos/15min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset: 5 intentos/15min
const passwordResetLimiter = rateLimit({ max: 5 });
```
- Por IP (default de express-rate-limit)
- Middlewares separados para auth y password reset

### Error Handler
```js
app.use((err, req, res, next) => {
  const message = process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message;
  return res.status(statusCode).json({ error: message });
});
```
- Último middleware
- Nunca expone stack traces en producción
- Mensajes genéricos

### Autenticación de dos factores obligatoria
```js
router.get("/me", requireAuth, requireTwoFactor, handler);
```
- `requireAuth` valida la sesión.
- `requireTwoFactor` exige `user.twoFactorEnabled === true`.
- La ruta `/api/enable-2fa` usa solo `requireAuth` para permitir completar el alta.

## Reglas obligatorias

1. NUNCA usar `eval()`, `Function()`, `new Function()`
2. NUNCA construir SQL con concatenación
3. NUNCA loguear passwords, tokens o datos sensibles
4. NUNCA exponer stack traces al cliente en producción
5. NUNCA confiar en datos del frontend para autorización
6. NUNCA deshabilitar Helmet en producción
7. NUNCA usar CORS `origin: "*"` con credentials
8. SIEMPRE usar parameterized queries (`$1, $2...`)
9. SIEMPRE validar body, params, query antes de procesar
10. SIEMPRE retornar mensajes de error genéricos

## Dependencias de seguridad

| Paquete | Versión | Uso |
|---------|---------|-----|
| helmet | ^8.0.0 | Headers de seguridad HTTP |
| cors | ^2.8.5 | Control de acceso cross-origin |
| express-rate-limit | ^8.6.2 | Rate limiting por IP |
| dotenv | ^16.4.5 | Variables de entorno |

## Checklist al modificar backend

- [ ] ¿El endpoint requiere autenticación? → Agregar `requireAuth`
- [ ] ¿Es un endpoint de auth? → Verificar rate limiting
- [ ] ¿Retorna datos del usuario? → No exponer password ni tokens
- [ ] ¿Maneja errores? → Mensajes genéricos, log interno
- [ ] ¿Usa SQL? → Parameterized queries
- [ ] ¿Acepta input? → Validar antes de procesar
