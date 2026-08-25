import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

const COOLDOWN = 30;

// Use globalThis to persist across HMR and StrictMode remounts
const OTP_KEY = "__carnavales_otp_sent__";
const COOLDOWN_KEY = "__carnavales_otp_cooldown__";

if (typeof globalThis[OTP_KEY] === "undefined") {
  globalThis[OTP_KEY] = false;
  globalThis[COOLDOWN_KEY] = 0;
}

export function resetOtpSent() {
  globalThis[OTP_KEY] = false;
  globalThis[COOLDOWN_KEY] = 0;
}

function getSendErrorMessage(error) {
  if (error?.status === 429 || error?.statusCode === 429) {
    return "Demasiados intentos. Espera unos segundos antes de reenviar el código.";
  }
  return error?.message || "Error al enviar código";
}

export default function VerifyCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (globalThis[OTP_KEY]) {
      setCooldown(Math.max(0, globalThis[COOLDOWN_KEY]));
      return;
    }

    globalThis[OTP_KEY] = true;

    const sendCodeOnMount = async () => {
      setSending(true);
      try {
        const { error: sendError } = await authClient.twoFactor.sendOtp();
        if (sendError) {
          globalThis[OTP_KEY] = false;
          setError(getSendErrorMessage(sendError));
        } else {
          globalThis[COOLDOWN_KEY] = COOLDOWN;
          setCooldown(COOLDOWN);
        }
      } catch (err) {
        globalThis[OTP_KEY] = false;
        setError("Error al enviar código");
      } finally {
        setSending(false);
      }
    };
    sendCodeOnMount();
  }, []);

  const handleSendCode = async () => {
    setSending(true);
    setError("");
    try {
      const { error: sendError } = await authClient.twoFactor.sendOtp();
      if (sendError) {
        setError(getSendErrorMessage(sendError));
      } else {
        globalThis[COOLDOWN_KEY] = COOLDOWN;
        setCooldown(COOLDOWN);
      }
    } catch (err) {
      setError("Error al enviar código");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: verifyError } = await authClient.twoFactor.verifyOtp({
        code,
        trustDevice: false,
      });

      if (verifyError) {
        const msg = verifyError.message || "";
        if (msg.includes("expired") || msg.includes("expirado")) {
          setError("El código ha expirado. Solicita uno nuevo.");
        } else if (msg.includes("attempts") || msg.includes("intentos")) {
          setError("Demasiados intentos fallidos. Solicita un nuevo código.");
        } else {
          setError("Código incorrecto. Verifica e intenta de nuevo.");
        }
        return;
      }

      const { data: session, error: sessionError } = await authClient.getSession();
      if (sessionError || !session) {
        setError("La sesión no pudo confirmarse. Intenta autenticarte nuevamente.");
        return;
      }

      resetOtpSent();
      navigate("/home");
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    resetOtpSent();
    const state = location.state?.backgroundLocation
      ? { backgroundLocation: location.state.backgroundLocation }
      : undefined;
    navigate("/login", { state });
  };

  return (
    <div className="container">
      <h1>Verificar código</h1>
      {sending ? (
        <p>Enviando código a tu correo electrónico...</p>
      ) : !error ? (
        <p>Revisa tu correo. Si el código no llega, intenta reenviarlo.</p>
      ) : null}

      <button onClick={handleSendCode} disabled={sending || cooldown > 0} style={{ marginBottom: "1rem" }}>
        {sending ? "Enviando..." : cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
      </button>

      <form onSubmit={handleVerify}>
        <div>
          <label>Código de 6 dígitos</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            placeholder="000000"
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading || code.length !== 6}>
          {loading ? "Verificando..." : "Verificar código"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        <button onClick={handleGoBack} style={{ background: "none", border: "none", color: "#0066cc", cursor: "pointer", textDecoration: "underline" }}>
          Volver al login
        </button>
      </p>
    </div>
  );
}
