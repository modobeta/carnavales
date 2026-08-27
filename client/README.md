# Carnavales Client

Frontend React con autenticación, 2FA y modales controlados por rutas para el sistema de votación digital Carnavales 2027.

## Inicio rápido

```bash
npm install
npm run dev   # http://localhost:5173
```

Requiere que la API esté corriendo en `http://localhost:3000`.
Consultá el [README raíz](../README.md) para el paso a paso completo.

## Documentación

- [README principal](../README.md) — Visión general del proyecto
- [AUTH.md](../AUTH.md) — Documentación detallada de autenticación
- [AGENTS.md](../AGENTS.md) — Especificación técnica

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm test` | Pruebas unitarias de utilidades |

## Estructura

```text
src/
├── lib/
│   ├── auth-client.js        # Cliente Better Auth
│   └── enable-two-factor.js  # Activación de 2FA
├── components/
│   ├── Modal.jsx             # Modal accesible por rutas
│   ├── AuthLink.jsx          # Enlaces dentro de modales
│   └── ProtectedRoute.jsx    # Guard de rutas (solo UX)
├── pages/
│   ├── Landing.jsx           # Página pública
│   ├── Login.jsx             # Inicio de sesión
│   ├── Register.jsx          # Registro
│   ├── VerifyCode.jsx        # Verificación OTP
│   ├── ForgotPassword.jsx    # Solicitud de recuperación
│   ├── ResetPassword.jsx     # Nueva contraseña
│   └── Home.jsx              # Panel autenticado
└── router/Router.jsx         # Rutas y modales
```
