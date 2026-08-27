# Carnavales API

Backend de autenticación y servicios para el sistema de votación digital Carnavales 2027.

## Inicio rápido

```bash
npm install
npm run migrate   # crea las tablas de Better Auth
npm run dev       # http://localhost:3000
```

La base de datos `carnavales_dev` debe existir antes de ejecutar la migración.
Consultá el [README raíz](../README.md) para el paso a paso completo.

## Documentación

- [README principal](../README.md) — Visión general del proyecto
- [AUTH.md](../AUTH.md) — Documentación detallada de autenticación
- [AGENTS.md](../AGENTS.md) — Especificación técnica

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo (con `--watch`) |
| `npm start` | Servidor en producción |
| `npm run migrate` | Ejecuta migraciones de Better Auth |
| `npm run backfill-names` | Rellena nombres faltantes desde el email |
| `npm test` | Ejecuta la suite de pruebas |

## Estructura

```text
src/
├── auth/auth.js           # Configuración Better Auth, 2FA, recuperación
├── middleware/auth.js      # requireAuth y requireTwoFactor
├── routes/protected.js    # /api/me, /api/enable-2fa, /api/health
├── services/
│   ├── email.service.js   # Adaptadores console y SMTP
│   └── email-templates.js # Plantillas HTML (OTP, Reset)
├── tests/                 # Pruebas automatizadas
└── server.js              # Express + Better Auth
```
