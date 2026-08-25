# Skill: Better Auth Integration

Integración de Better Auth con Express (backend) y React (frontend).

## Archivos relevantes

- `api/src/auth/auth.js` — Configuración Better Auth
- `api/src/server.js` — Integración con Express
- `api/src/middleware/auth.middleware.js` — Extracción de sesión
- `api/src/services/email.service.js` — Email adapter
- `client/src/lib/auth-client.js` — Cliente React

## Backend: Integración con Express

### Inicialización
```js
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { twoFactor } from "better-auth/plugins";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.FRONTEND_URL],
  // ...
});
```

### Rutas automáticas
```js
// server.js — Delega TODA la auth a Better Auth
app.all("/api/auth/*", toNodeHandler(auth));
```

**IMPORTANTE**: `express.json()` va DESPUÉS de esta línea porque Better Auth necesita raw body para verificar signatures.

### Extracción de sesión
```js
import { fromNodeHeaders } from "better-auth/node";

const session = await auth.api.getSession({
  headers: fromNodeHeaders(req.headers),
});
```

### Plugin twoFactor
```js
twoFactor({
  skipVerificationOnEnable: false, // El usuario sigue pendiente hasta verificar OTP
  otpOptions: {
    storeOTP: "encrypted",
    async sendOTP({ user, otp }) {
      await emailService.send({
        to: user.email,
        subject: "Tu código de verificación - Carnavales",
        otp,
        html: `<p>Tu código es <strong>${otp}</strong></p>`,
      });
    },
  },
});
```

### Password Reset
```js
emailAndPassword: {
  revokeSessionsOnPasswordReset: true,
  resetPasswordTokenExpiresIn: 1800,
  sendResetPassword: async ({ user, url, token }, request) => {
    const resetUrl = `${frontendBase}/reset-password?token=${token}`;
    await emailService.send({ to: user.email, resetUrl, html: ... });
  },
}
```

El adaptador `console` muestra el enlace en desarrollo. El adaptador `smtp`
lo envia por correo cuando se configura `EMAIL_PROVIDER=smtp`.

## Frontend: Cliente React

### Inicialización
```js
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [twoFactorClient()],
});
```

### Uso de hooks y funciones
```js
const { signIn, signUp, signOut, useSession } = authClient;

// Login
const data = await signIn.email({ email, password });
if (data.twoFactorRedirect) navigate("/verify-code");

// Registro
await signUp.email({ name, email, password });

// Sesión
const { data: session } = useSession();

// Logout
await signOut();
```

## Migraciones

```bash
cd api
npm run migrate
```

Better Auth crea/modifica sus tablas automáticamente:
- `user` — Usuarios
- `session` — Sesiones
- `account` — Cuentas de auth
- `verification` — Tokens, OTP, verificaciones
- `twoFactor` — Datos 2FA

## Variables de entorno requeridas

| Backend | Frontend |
|---------|----------|
| DATABASE_URL | VITE_API_URL |
| BETTER_AUTH_SECRET | |
| BETTER_AUTH_URL | |
| FRONTEND_URL | |

## Errores comunes

1. **`express.json()` antes de Better Auth**: Better Auth recibe body parseado y falla
2. **CORS sin credentials**: Cookies no funcionan
3. **SECRET corto**: Better Auth requiere mínimo 32 caracteres
4. **trustedOrigins incorrecto**: requests bloqueados
5. **Pool sin close**: cerrar pools creados manualmente para tareas o tests
