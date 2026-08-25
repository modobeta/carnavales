import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import AuthLink from "../components/AuthLink";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="container">
        <h1>Enlace inválido</h1>
        <p>El enlace de recuperación no es válido o ha expirado.</p>
        <p>
          <AuthLink to="/forgot-password">Solicitar nuevo enlace</AuthLink>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        const msg = resetError.message || "";
        if (msg.includes("expired") || msg.includes("expirado")) {
          setError("El enlace ha expirado. Solicita uno nuevo.");
        } else if (msg.includes("invalid") || msg.includes("inválido") || msg.includes("INVALID_TOKEN")) {
          setError("El enlace no es válido o ya fue utilizado.");
        } else {
          setError("No se pudo restablecer la contraseña. Solicita un nuevo enlace.");
        }
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container">
        <h1>Contraseña actualizada</h1>
        <p>Tu contraseña ha sido restablecida correctamente.</p>
        <p>
          <AuthLink to="/login">Iniciar sesión</AuthLink>
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Nueva contraseña</h1>
      <p>Ingresa tu nueva contraseña.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div>
          <label>Confirmar contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Actualizando..." : "Restablecer contraseña"}
        </button>
      </form>
      <p>
        <AuthLink to="/login">Volver al inicio de sesión</AuthLink>
      </p>
    </div>
  );
}
