# Autenticación — Carnavales 2027

Documentación del módulo de autenticación del sistema de votación digital.

---

## Better Auth

El sistema utiliza **Better Auth 1.6.x** como motor de autenticación. Better Auth gestiona:

- Creación y hashes de contraseñas (bcrypt)
- Sesiones server-side con cookies HttpOnly
- Verificación en dos pasos (2FA/OTP)
- Tokens de recuperación de contraseña
- Rotación de sesiones
- Revocación de sesiones

### Tablas gestionadas por Better Auth

Better Admin crea y administra sus propias tablas mediante `npm run migrate`:

```text
user        → Cuentas de usuario
session     → Sesiones activas
account     → Cuentas vinculadas
verification → Tokens y OTP
```

> **No se recomienda modificar directamente estas tablas.** El dominio del Carnaval referencia al usuario mediante su identificador.

---

## Configuración

### Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `api/src/auth/auth.js` | Configuración de Better Auth, 2FA, recuperación |
| `api/src/middleware/auth.middleware.js` | `requireAuth` y `requireTwoFactor` |
| `api/src/services/email.service.js` | Envío de OTP y emails de recuperación |
| `api/src/services/email-templates.js` | Plantillas HTML profesionales |
| `client/src/lib/auth-client.js` | Cliente Better Auth para React |

### Variables de entorno (auth)

```env
# Backend (api/.env)
BETTER_AUTH_SECRET=un-secreto-de-al-menos-32-caracteres
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
EMAIL_PROVIDER=console          # "console" en dev, "smtp" en producción
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASSWORD=tu-contraseña
PASSWORD_RESET_TOKEN_TTL=1800   # 30 minutos
```

> **Nunca commitear `.env` a Git.** Usar `.env.example` como referencia.

---

## Flujo de registro

```text
1. Usuario completa formulario (nombre, apellido, email, contraseña)
        ↓
2. Better Auth crea cuenta + hashea contraseña (bcrypt)
        ↓
3. Se habilita 2FA automáticamente
        ↓
4. Se envía código OTP (6 dígitos) al email
        ↓
5. Usuario verifica OTP
        ↓
6. Sesión se rota y se revocan sesiones previas
        ↓
7. Usuario queda autenticado con 2FA activo
```

### Validaciones del registro

- Nombre y apellido: obligatorios, máx. 50 caracteres
- Email: formato válido
- Contraseña: mínimo 8 caracteres
- Confirmación de contraseña: debe coincidir

---

## Flujo de inicio de sesión

```text
1. Usuario ingresa email + contraseña
        ↓
2. Better Auth verifica credenciales
        ↓
3. ¿Credenciales correctas?
    ├── No → Error genérico "Credenciales inválidas"
    └── Sí ↓
4. ¿2FA activo?
    ├── No → Forzar activación de 2FA → Redirigir a /verify-code
    └── Sí ↓
5. Redirigir a /verify-code
        ↓
6. Se envía nuevo código OTP al email
        ↓
7. Usuario verifica OTP
        ↓
8. Sesión establecida con cookies HttpOnly
        ↓
9. Redirigir a /home
```

### Anti-enumeración

Los mensajes de error son genéricos para prevenir *user enumeration*:

- Email no existe → "Credenciales inválidas"
- Contraseña incorrecta → "Credenciales inválidas"

---

## Verificación en dos pasos (2FA)

### Características

- Código OTP de **6 dígitos**
- Expiración: **5 minutos**
- Almacenamiento: **cifrados** en la tabla `verification` (`storeOTP: "encrypted"`)
- Límite de intentos
- En desarrollo: código impreso en consola
- En producción: enviado por email (SMTP)

### Al verificar un OTP exitosamente

1. La sesión se rota (nuevo token)
2. Se revocan **todas las sesiones anteriores** del usuario
3. El usuario queda completamente autenticado

### Flujo en el frontend

```text
/verify-code
    → Auto-envío de OTP al montar (si no se envió previamente)
    → Timer de cooldown: 30 segundos entre envíos
    → Input: solo 6 dígitos numéricos
    → Verificar → Si es correcto → /home
    → Si expiró → Reenviar código
```

---

## Recuperación de contraseña

```text
1. Usuario va a /forgot-password
        ↓
2. Ingresa su email
        ↓
3. Better Auth genera token único
        ↓
4. Se envía email con enlace de recuperación
        ↓
5. Usuario hace clic en el enlace
        ↓
6. Redirige a /reset-password?token=xxx
        ↓
7. Usuario ingresa nueva contraseña
        ↓
8. Better Auth valida token + actualiza contraseña
        ↓
9. TODAS las sesiones activas se invalidan
```

### Seguridad de recuperación

- Token expira en **30 minutos**
- Token no se puede reutilizar
- Mismo mensaje de éxito si el email existe o no (anti-enumeración)
- Al restablecer, se invalidan todas las sesiones

---

## Endpoints de la API

### Better Auth (automáticos)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Registro |
| POST | `/api/auth/sign-in/email` | Login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/get-session` | Obtener sesión actual |
| POST | `/api/auth/two-factor/send-otp` | Enviar código OTP |
| POST | `/api/auth/two-factor/verify-otp` | Verificar código OTP |
| POST | `/api/auth/request-password-reset` | Solicitar recuperación |
| POST | `/api/auth/reset-password` | Restablecer contraseña |

### Personalizados

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/me` | Requiere 2FA | Info del usuario |
| POST | `/api/enable-2fa` | Requiere auth | Habilitar 2FA |
| GET | `/api/health` | Público | Health check |

---

## Seguridad

### Rate limiting

| Endpoint | Límite |
|----------|--------|
| Login y registro | 10 requests / 15 minutos |
| Recuperación de contraseña | 5 requests / 15 minutos |

### Headers (Helmet)

Helmet está habilitado en todas las rutas, configurando headers como:
`x-content-type-options`, `x-frame-options`, `strict-transport-security`, etc.

### CORS

Restringido solo a `FRONTEND_URL`. Nunca se usa `origin: "*"` con credenciales.

### Cookies

- **HttpOnly**: siempre (default de Better Auth)
- **Secure**: en producción
- **SameSite**: lax (default)

### Errores

Los mensajes de error son genéricos en producción. Los stack traces nunca se exponen al cliente.

---

## Roles de usuario

El dominio del Carnaval extiende el usuario con roles:

```text
ADMIN    → Administrador del sistema
JUDGE    → Jurado (Baile, Vestuario, Batería)
NOTARY   → Escribano / Veedor
OBSERVER → Observador
OPERATOR → Operador
```

> Los roles se implementarán con RBAC en una fase posterior. Actualmente `requireAuth` y `requireTwoFactor` protegen los endpoints personalizados.

---

## Troubleshooting

### "Credenciales inválidas"

**Causa:** El usuario no existe en la base de datos o la contraseña es incorrecta.

**Solución:**
1. Verificar que la tabla `"user"` tenga datos: `SELECT id, email FROM "user";`
2. Si está vacía, registrarse desde `/register`
3. Si la tabla no existe, ejecutar `npm run migrate` en `api/`

### "User not found" en el servidor

**Causa:** Better Auth no encuentra el email en la base de datos.

**Solución:** Mismo que "Credenciales inválidas" — verificar que el usuario esté registrado.

### OTP no llega por email

**Causas posibles:**
1. `EMAIL_PROVIDER=console` → El código se imprime en la consola del servidor
2. `EMAIL_PROVIDER=smtp` → Verificar configuración SMTP en `.env`
3. En producción, el adaptador `console` lanza error (fail-closed)

**Verificar logs del servidor** para ver si el OTP se generó correctamente.

### "Demasiados intentos" (429)

**Causa:** Se superó el límite de rate limiting (10 req/15min).

**Solución:** Esperar 15 minutos o reiniciar el servidor (en desarrollo).

### Sesión no se mantiene

**Causas posibles:**
1. Cookies no configuradas correctamente
2. `FRONTEND_URL` no coincide con la URL del cliente
3. `CORS` bloqueando las credenciales

**Verificar:** `FRONTEND_URL` en `.env` del backend debe ser exactamente `http://localhost:5173` (sin `/` al final).

---

## En desarrollo vs. producción

| Aspecto | Desarrollo | Producción |
|---------|-----------|------------|
| `EMAIL_PROVIDER` | `console` | `smtp` |
| OTP | Impreso en consola | Enviado por email |
| `NODE_ENV` | `development` | `production` |
| HTTPS | No requerido | Obligatorio |
| Cookies `Secure` | Opcional | Obligatorio |
| `BETTER_AUTH_SECRET` | Cualquier valor | Valor fuerte y único |
