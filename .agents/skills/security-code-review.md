# Skill: Security Code Review

Guía para revisar código de seguridad en el proyecto Carnavales.

## Archivos a revisar

### Backend
- `api/src/server.js` — Configuración de seguridad del servidor
- `api/src/auth/auth.js` — Configuración Better Auth
- `api/src/middleware/auth.middleware.js` — Middleware de autenticación
- `api/src/routes/protected.routes.js` — Rutas protegidas
- `api/src/services/email.service.js` — Servicio de email
- `api/src/tests/` — Tests de seguridad

### Frontend
- `client/src/lib/auth-client.js` — Cliente Better Auth
- `client/src/components/ProtectedRoute.jsx` — Guard de rutas
- `client/src/pages/` — Formularios de auth

### Configuración
- `api/.env.example` — Variables de entorno
- `api/.gitignore` — Exclusión de .env
- `client/.env.example` — Variables de entorno frontend

## Checklist de revisión

### Autenticación
- [ ] ¿Better Auth gestiona passwords (hashing)?
- [ ] ¿Sesiones son server-side (no JWT en localStorage)?
- [ ] ¿Cookies son HttpOnly, Secure, SameSite?
- [ ] ¿Rate limiting en endpoints de auth?
- [ ] ¿Mensajes genéricos sin user enumeration?
- [ ] ¿2FA implementado correctamente?
- [ ] ¿Password reset con token seguro y expiración?

### Autorización
- [ ] ¿Endpoints protegidos usan requireAuth?
- [ ] ¿No se exponen datos de otros usuarios?
- [ ] ¿No se confía en datos del frontend para autorización?

### Input validation
- [ ] ¿Se valida body, params, query?
- [ ] ¿Se usan parameterized queries?
- [ ] ¿No hay SQL injection?
- [ ] ¿No hay XSS (dangerouslySetInnerHTML)?

### Configuración
- [ ] ¿Helmet habilitado?
- [ ] ¿CORS restringido (no "*")?
- [ ] ¿Variables de entorno en .env (no hardcoded)?
- [ ] ¿.env no versionado?
- [ ] ¿Secretos mínimo 32 caracteres?

### Errores
- [ ] ¿Mensajes genéricos en producción?
- [ ] ¿No se exponen stack traces?
- [ ] ¿Logging interno de errores?

### Dependencies
- [ ] ¿Dependencias actualizadas?
- [ ] ¿No hay dependencias con vulnerabilidades conocidas?

## Patrones de código seguros

### SQL
```js
// SEGURO
pool.query('SELECT * FROM "user" WHERE id = $1', [userId]);

// PELIGROSO - NUNCA hacer
pool.query(`SELECT * FROM user WHERE id = '${userId}'`);
```

### Error handling
```js
// SEGURO
catch (error) {
  console.error("Internal error:", error);  // Log interno
  res.status(500).json({ error: "Internal server error" });  // Genérico
}

// PELIGROSO
catch (error) {
  res.status(500).json({ error: error.message });  // Expone info
}
```

### Respuestas
```js
// SEGURO
const { id, email, name } = user;
res.json({ id, email, name });

// PELIGROSO
res.json({ ...user });  // Expone password, tokens, etc.
```

## Vulnerabilidades comunes a buscar

1. **SQL Injection**: Concatenación de strings en queries
2. **XSS**: dangerouslySetInnerHTML con input del usuario
3. **CSRF**: Tokens faltantes en state-changing operations
4. **IDOR**: Acceso a recursos sin verificar ownership
5. **User Enumeration**: Diferentes errores para email existente/inexistente
6. **Sensitive Data Exposure**: Passwords o tokens en respuestas/logs
7. **Broken Auth**: Rate limiting faltante, sesiones no invalidadas
8. **Security Misconfiguration**: Helmet deshabilitado, CORS "*"

## Herramientas de revisión

- `grep -r "console.log" api/src/` — Buscar logs sensibles
- `grep -r "localStorage" client/src/` — Buscar uso de localStorage
- `grep -r "dangerouslySetInnerHTML" client/src/` — Buscar XSS
- `grep -r "eval(" api/src/` — Buscar eval
- `grep -r "concat" api/src/` — Buscar posible SQL injection
