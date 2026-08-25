# Skill: Authentication

Sistema de autenticación completo: login, registro, logout, sesiones, 2FA, recuperación de contraseña.

## Archivos relevantes

- `api/src/auth/auth.js` — Configuración Better Auth, 2FA, password reset
- `api/src/middleware/auth.middleware.js` — Extracción de sesión
- `api/src/routes/protected.routes.js` — Endpoints protegidos
- `client/src/lib/auth-client.js` — Cliente Better Auth
- `client/src/pages/Login.jsx` — Formulario login
- `client/src/pages/Register.jsx` — Formulario registro
- `client/src/pages/VerifyCode.jsx` — Verificación OTP
- `client/src/pages/Home.jsx` — Dashboard autenticado
- `client/src/pages/ForgotPassword.jsx` — Solicitud reset
- `client/src/pages/ResetPassword.jsx` — Nueva contraseña
- `client/src/pages/Landing.jsx` — Pantalla pública base
- `client/src/components/Modal.jsx` — Modal de autenticación
- `client/src/components/AuthLink.jsx` — Enlaces con background location
- `client/src/components/ProtectedRoute.jsx` — Guard de rutas

## Flujo de autenticación

### Registro
```
Register.jsx → signUp.email() → Better Auth crea usuario →
llama /api/enable-2fa (POST, credentials: include) →
redirige a /verify-code → verifica OTP → habilita 2FA y rota la sesión
```
- Nombre y apellido se combinan en campo `name` de Better Auth
- El frontend intenta habilitar 2FA automáticamente después del registro
- Si la llamada para habilitar 2FA falla, el frontend cierra la sesión y permite reintentar al iniciar sesión
- El backend exige `twoFactorEnabled` mediante `requireTwoFactor` en las rutas de negocio protegidas
- Al verificar el OTP se revocan las demás sesiones del usuario y se conserva solo la sesión recién rotada

### Login de cuenta pendiente de 2FA
```
Login.jsx → signIn.email() → Better Auth retorna sesión →
activa el enrolamiento pendiente → navigate("/verify-code") → verifica OTP
```

### Login (con 2FA habilitado)
```
Login.jsx → signIn.email() → data.twoFactorRedirect = true →
resetOtpSent() → navigate("/verify-code") →
VerifyCode.jsx auto-envía OTP → usuario ingresa código →
verifyOtp({code, trustDevice:false}) → getSession() → navigate("/home")
```
- El OTP usa el adaptador `console` solo en desarrollo y SMTP en producción
- El OTP se almacena cifrado mediante `storeOTP: "encrypted"`
- Cooldown 30s para reenvío
- Input filtra solo dígitos, max 6 caracteres
- `ProtectedRoute` fuerza un refetch antes de redirigir para evitar usar una sesión cacheada como `null`

### Modal de autenticación
- `/` renderiza la pantalla pública base.
- `/login`, `/register`, `/verify-code`, `/forgot-password` y `/reset-password` se muestran como modales controlados por rutas.
- `backgroundLocation` conserva la pantalla base al navegar entre modales.
- Un acceso directo a una ruta muestra el modal a pantalla completa.

### Password Reset
```
ForgotPassword.jsx → authClient.requestPasswordReset({email, redirectTo}) →
Backend genera token → email service usa console o SMTP →
ResetPassword.jsx lee token de URL →
authClient.resetPassword({newPassword, token}) →
Better Auth revoca todas las sesiones
```
- Token criptográfico gestionado por Better Auth
- Expira en 30 minutos (configurable)
- Uso único
- Invalida todas las sesiones al cambiar

### Logout
```
Home.jsx → signOut() → resetOtpSent() → navigate("/login")
```

## Endpoints de autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | /api/auth/sign-up/email | No | Registro |
| POST | /api/auth/sign-in/email | No | Login |
| POST | /api/auth/sign-out | No | Logout |
| GET | /api/auth/get-session | Cookie | Obtener sesión |
| POST | /api/auth/two-factor/send-otp | Cookie | Enviar OTP |
| POST | /api/auth/two-factor/verify-otp | Cookie | Verificar OTP |
| POST | /api/auth/request-password-reset | No | Solicitar reset |
| POST | /api/auth/reset-password | No | Restablecer contraseña |

## Configuración Better Auth

```js
// auth.js
betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,  // Invalida sesiones al resetear
    resetPasswordTokenExpiresIn: 1800,     // 30 minutos
  },
  plugins: [twoFactor({ skipVerificationOnEnable: false })],
});
```

## Seguridad de sesiones

- Cookies HttpOnly (default Better Auth)
- Secure en producción
- SameSite lax (default)
- Server-side storage
- Rotación/invalidación automática
- La verificación OTP revoca todas las sesiones anteriores del usuario

## Anti user-enumeration

- Login: mismo error para email existente/inexistente
- Password reset: mismo response siempre ("Correo enviado")
- Mensajes genéricos en todos los errores de auth

## Reglas obligatorias

1. NUNCA almacenar tokens en localStorage/sessionStorage
2. NUNCA exponer passwords en respuestas o logs
3. NUNCA permitir login sin rate limiting
4. SIEMPRE usar cookies HttpOnly para sesiones
5. SIEMPRE invalidar sesiones al cambiar contraseña
6. SIEMPRE verificar sesión en cada request protegido
7. SIEMPRE usar mensajes genéricos (sin user enumeration)
