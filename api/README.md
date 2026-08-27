# Carnavales API

Backend de autenticación con Express, Better Auth y PostgreSQL.

## Inicio rápido

```bash
npm install
npm run migrate   # crea las tablas de Better Auth
npm run dev       # http://localhost:3000
```

La base de datos `carnavales_dev` debe existir antes de ejecutar la migración.
Consultá el [README raíz](../README.md) para el paso a paso completo.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo (con `--watch`) |
| `npm start` | Servidor en producción |
| `npm run migrate` | Ejecuta migraciones de Better Auth |
| `npm run backfill-names` | Rellena nombres faltantes desde el email |
| `npm test` | Ejecuta la suite de pruebas |
