# Skill: Database Security

Seguridad de base de datos PostgreSQL en el proyecto Carnavales.

## Archivos relevantes

- `api/src/auth/auth.js` — Pool de conexión
- `api/src/server.js` — Verificación de conexión
- `api/scripts/backfill-names.js` — Migración con parameterized queries
- `api/src/tests/helpers.js` — Tests con DB

## Conexión

```js
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
```

- Pool gestiona conexiones automáticamente
- Better Auth usa el pool configurado en `auth.js`
- `server.js` crea otro pool únicamente para comprobar la conexión al iniciar
- Variables de entorno para credenciales (nunca hardcoded)

## Tablas (creadas por Better Auth)

| Tabla | Descripción |
|-------|-------------|
| user | Usuarios (id, email, name, emailVerified, twoFactorEnabled) |
| session | Sesiones activas |
| account | Cuentas de autenticación |
| verification | Tokens, OTP, verificaciones |
| twoFactor | Datos de 2FA |

## Migraciones

```bash
cd api
npm run migrate
```

- Better Auth gestiona sus propias tablas
- No usar ORM (pg pool directo)
- Parameterized queries siempre

## Parameterized Queries

```js
// CORRECTO
const result = await pool.query(
  'SELECT id, email, name FROM "user" WHERE id = $1',
  [userId]
);

// NUNCA hacer esto
const result = await pool.query(
  `SELECT * FROM user WHERE id = '${userId}'`  // SQL INJECTION
);
```

## Patrón en backfill-names.js

```js
const client = await pool.connect();
try {
  const { rows: usersWithoutName } = await client.query(
    `SELECT id, email FROM "user" WHERE name IS NULL OR name = ''`,
  );
  for (const user of usersWithoutName) {
    const derivedName = deriveNameFromEmail(user.email);
    await client.query(
      `UPDATE "user" SET name = $1 WHERE id = $2`,
      [derivedName, user.id],
    );
  }
} catch (error) {
  throw error;
} finally {
  client.release();
}
```

- Las consultas usan parámetros `$1`, `$2`.
- `client.release()` se ejecuta siempre en `finally`.
- El script actual no usa una transacción explícita; si el backfill debe ser
  atómico, hay que añadir `BEGIN`, `COMMIT` y `ROLLBACK`.

## Seguridad de datos

### En respuestas API
- `/me`: solo expone `id`, `email`, `name`
- NUNCA exponer password, tokens, o datos sensibles
- Better Auth filtra automáticamente passwords

### En logs
- NUNCA loguear passwords
- NUNCA loguear tokens
- NUNCA loguear datos sensibles
- Console email adapter no loguea HTML completo

### En tests
- Tests usan DATABASE_URL de test
- `NODE_ENV=test` para tests
- Los pools creados por los tests deben cerrarse explícitamente al finalizar

## Reglas obligatorias

1. SIEMPRE usar parameterized queries (`$1, $2...`)
2. NUNCA construir SQL con concatenación
3. NUNCA loguear passwords o tokens
4. Usar transacciones cuando una operación de varios pasos deba ser atómica
5. SIEMPRE cerrar pools en tests
6. SIEMPRE usar variables de entorno para credenciales
7. NUNCA subir .env a Git
