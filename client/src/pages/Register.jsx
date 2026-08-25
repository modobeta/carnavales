import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, signUp } from "../lib/auth-client";
import { enableRequiredTwoFactor } from "../lib/enable-two-factor";
import AuthLink from "../components/AuthLink";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || trimmedFirst.length < 1) {
      setError("El nombre es obligatorio");
      return;
    }

    if (trimmedFirst.length > 50) {
      setError("El nombre no puede tener más de 50 caracteres");
      return;
    }

    if (!trimmedLast || trimmedLast.length < 1) {
      setError("El apellido es obligatorio");
      return;
    }

    if (trimmedLast.length > 50) {
      setError("El apellido no puede tener más de 50 caracteres");
      return;
    }

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
      const { error: signUpError } = await signUp.email({
        email,
        password,
        name: `${trimmedFirst} ${trimmedLast}`,
      });

      if (signUpError) {
        setError(signUpError.message || "Error al registrar usuario");
        return;
      }

      try {
        await enableRequiredTwoFactor({ apiBase: API_BASE, password });
      } catch {
        try {
          await signOut();
        } catch {
          // The API also blocks protected data until 2FA is enabled.
        }
        setError(
          "La cuenta fue creada, pero no se pudo activar el segundo factor. " +
          "Inicia sesión para reintentar.",
        );
        return;
      }

      navigate("/verify-code", { replace: true });
    } catch (err) {
      setError("Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            maxLength={50}
            placeholder="Juan"
          />
        </div>
        <div>
          <label>Apellido</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            maxLength={50}
            placeholder="Pérez"
          />
        </div>
        <div>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Crear cuenta"}
        </button>
      </form>
      <p>
         ¿Ya tienes cuenta? <AuthLink to="/login">Inicia sesión</AuthLink>
      </p>
    </div>
  );
}
