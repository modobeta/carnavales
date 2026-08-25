# Skill: Authorization

Gestión de permisos y control de acceso en el proyecto Carnavales.

## Archivos relevantes

- `api/src/middleware/auth.middleware.js` — requireAuth middleware
- `api/src/routes/protected.routes.js` — Endpoints protegidos

## Estado actual

El proyecto actualmente implementa **autenticación** (¿quién eres?) pero no **autorización** (¿qué puedes hacer?).

### Implementado
- `requireAuth` middleware: verifica sesión válida
- Endpoints protegidos requieren sesión activa
- Health check no requiere auth (correcto)

### No implementado
- RBAC (Role-Based Access Control)
- Roles de usuario (admin, user, etc.)
- Permisos granulares
- Ownership verification para recursos
- Protección contra IDOR

## Middleware requireAuth

```js
// auth.middleware.js
export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.session = session;
  req.user = session.user;
  next();
}
```

- Extrae sesión de Better Auth
- Retorna 401 genérico si no hay sesión
- Adjunta `req.session` y `req.user` para uso posterior
- No loguea errores sensibles

## Uso en rutas

```js
// protected.routes.js
router.get("/me", requireAuth, async (req, res) => {
  const { id, email, name } = req.user;
  res.json({ id, email, name });
});

router.post("/enable-2fa", requireAuth, async (req, res) => {
  // Requiere password como verificación adicional
});
```

## Reglas obligatorias

1. SIEMPRE verificar autorización en el backend
2. NUNCA confiar en guards del frontend como seguridad real
3. NUNCA exponer datos de otros usuarios
4. SIEMPRE verificar ownership para recursos
5. Frontend es UX, no seguridad

## Pendiente para producción

- [ ] Definir roles (admin, user, etc.)
- [ ] Implementar middleware `requireRole(roles...)`
- [ ] Agregar ownership verification
- [ ] Tests de IDOR
- [ ] Tests de autorización por rol
