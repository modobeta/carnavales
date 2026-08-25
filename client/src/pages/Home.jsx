import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";
import { resetOtpSent } from "./VerifyCode";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      resetOtpSent();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  if (isPending) {
    return (
      <div className="container">
        <p>Cargando...</p>
      </div>
    );
  }

  const name = session?.user?.name || "";
  const firstName = name.split(" ")[0] || "";

  return (
    <div className="container">
      <h1>{firstName ? `Bienvenido, ${firstName}` : "Bienvenido"}</h1>
      {session?.user?.email && <p>{session.user.email}</p>}
      <button onClick={handleLogout} onKeyDown={handleLogoutKeyDown} disabled={loading}>
        {loading ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </div>
  );
}
