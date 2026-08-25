import { useState } from "react";
import { authClient } from "../lib/auth-client";
import AuthLink from "../components/AuthLink";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || "Error al procesar la solicitud");
        return;
      }

      setSent(true);
    } catch (err) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="container">
        <h1>Correo enviado</h1>
        <p>
          Si existe una cuenta asociada a ese correo, recibirás instrucciones
          para restablecer tu contraseña.
        </p>
        <p>
          <AuthLink to="/login">Volver al inicio de sesión</AuthLink>
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Recuperar contraseña</h1>
      <p>Ingresa tu correo electrónico para recibir un enlace de recuperación.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar enlace de recuperación"}
        </button>
      </form>
      <p>
        <AuthLink to="/login">Volver al inicio de sesión</AuthLink>
      </p>
    </div>
  );
}
