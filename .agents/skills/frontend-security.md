# Skill: Frontend Security

Seguridad del frontend React en el proyecto Carnavales.

## Archivos relevantes

- `client/src/components/ProtectedRoute.jsx` — Guard de rutas
- `client/src/components/Modal.jsx` — Modal accesible controlado por rutas
- `client/src/components/AuthLink.jsx` — Enlaces que conservan el fondo modal
- `client/src/lib/auth-client.js` — Cliente Better Auth
- `client/src/pages/Login.jsx` — Formulario login
- `client/src/pages/Register.jsx` — Formulario registro
- `client/src/pages/VerifyCode.jsx` — Verificación OTP
- `client/src/pages/ForgotPassword.jsx` — Solicitud reset
- `client/src/pages/ResetPassword.jsx` — Nueva contraseña
- `client/src/pages/Home.jsx` — Dashboard
- `client/src/router/Router.jsx` — Definición de rutas

## ProtectedRoute

```jsx
// components/ProtectedRoute.jsx
export default function ProtectedRoute({ children }) {
  const { data: session, isPending, refetch } = useSession();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    let isActive = true;

    setHasCheckedSession(false);
    refetch().finally(() => {
      if (isActive) setHasCheckedSession(true);
    });

    return () => {
      isActive = false;
    };
  }, [refetch]);

  if (isPending || !hasCheckedSession) return <div>Cargando...</div>;

  if (!session) return <Navigate to="/login" replace />;
  return children;
}
```

`ProtectedRoute` también exige `session.user.twoFactorEnabled`, pero esto sigue
siendo solo UX. El backend SIEMPRE verifica mediante `requireTwoFactor`.

## Variables de entorno

```js
// auth-client.js
baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000"
```

- Preferir URLs configuradas por entorno; el código actual conserva un fallback
  local para desarrollo
- Usar `VITE_` prefix para exponer al cliente

## Autenticación

```js
const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  fetchOptions: { credentials: "include" },  // Cookies HttpOnly
});
const { signIn, signUp, signOut, useSession } = authClient;
```

- `credentials: "include"` para cookies cross-origin
- No almacenar tokens en localStorage/sessionStorage
- Better Auth maneja cookies automáticamente

## Formularios

### Login
- `autoComplete="email"` en email y `autoComplete="current-password"` en password
- Toggle password visibility con aria-label
- Error messages genéricos ("Credenciales inválidas")
- `disabled` en botón durante loading

### Register
- `maxLength={50}` en nombres
- `minLength={8}` en password
- Validación client-side: passwords coinciden
- El registro intenta habilitar 2FA automáticamente después de crear el usuario
- Si esa llamada falla, el registro queda bloqueado y muestra un error para reintentar

### VerifyCode
- Input filtra solo dígitos (max 6)
- Cooldown 30s para reenvío
- Errores específicos: expired, attempts limit, incorrect

### ForgotPassword
- Siempre muestra "Correo enviado" (anti user enumeration)
- Mensaje: "Si existe una cuenta asociada..."

### ResetPassword
- Token se toma de `searchParams.get("token")`
- Sin token → "Enlace inválido"
- Validación: passwords coinciden, >=8 chars
- `autoComplete="new-password"` en ambos campos de contraseña

### Modal y rutas
- Las rutas públicas de autenticación abren modales sobre `/`.
- El estado `backgroundLocation` conserva la pantalla base al cambiar entre modales.
- El acceso directo a una ruta renderiza el modal a pantalla completa.
- `Modal` gestiona foco, Escape, backdrop y bloqueo de scroll.

## Protecciones implementadas

| Protección | Estado |
|---|---|
| No localStorage para tokens | ✅ |
| No sessionStorage para datos sensibles | ✅ |
| No dangerouslySetInnerHTML | ✅ |
| URL configurable por entorno | ✅; existe fallback local de desarrollo |
| ProtectedRoute (UX) | ✅ |
| Input validation client-side | ✅ |
| Error messages genéricos | ✅ |
| autoComplete hints | ✅ |
| React escaping por defecto | ✅ |

## Reglas obligatorias

1. NUNCA usar localStorage/sessionStorage para tokens
2. NUNCA usar dangerouslySetInnerHTML con input del usuario
3. NUNCA añadir URLs hardcodeadas para entornos no locales
4. NUNCA confiar en guards de React como seguridad real
5. SIEMPRE usar variables de entorno para URLs
6. SIEMPRE usar autoComplete hints
7. SIEMPRE validar input client-side (pero NUNCA confiar solo en ello)
