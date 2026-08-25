import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authClient, signIn } from "../lib/auth-client";
import { enableRequiredTwoFactor } from "../lib/enable-two-factor";
import { resetOtpSent } from "./VerifyCode";
import AuthLink from "../components/AuthLink";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn.email({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.status === 429 || signInError.statusCode === 429) {
          setError("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
        } else {
          setError("Credenciales inválidas");
        }
        return;
      }

      if (data?.twoFactorRedirect) {
        resetOtpSent();
        const state = location.state?.backgroundLocation
          ? { backgroundLocation: location.state.backgroundLocation }
          : undefined;
        navigate("/verify-code", { state });
        return;
      }

      const { data: session, error: sessionError } = await authClient.getSession();
      if (sessionError || !session) {
        setError("La sesión no pudo confirmarse. Intenta iniciar sesión nuevamente.");
        return;
      }

      if (session.user?.twoFactorEnabled !== true) {
        try {
          await enableRequiredTwoFactor({ apiBase: API_BASE, password });
        } catch {
          setError("No se pudo activar la verificación en dos pasos. Intenta nuevamente.");
          return;
        }

        resetOtpSent();
        navigate("/verify-code");
        return;
      }

      navigate("/home");
    } catch (err) {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
          <div className="password-field">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4 10 8a14.8 14.8 0 0 1-3.1 5.1M6.2 6.2C3.9 7.8 2.5 10.1 2 12c1.3 4 4.8 8 10 8 1.1 0 2.1-.2 3.1-.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Iniciar sesión"}
        </button>
      </form>
      <p>
         ¿No tienes cuenta? <AuthLink to="/register">Regístrate</AuthLink>
      </p>
      <p>
        <AuthLink to="/forgot-password">¿Olvidaste tu contraseña?</AuthLink>
      </p>
    </div>
  );
}
