import { Link, useLocation } from "react-router-dom";

export default function Landing() {
  const location = useLocation();
  const modalState = { backgroundLocation: location };

  return (
    <main className="landing-page">
      <section className="landing-shell" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="landing-eyebrow">CARNAVALES</p>
          <h1 id="landing-title">Una entrada segura a Carnavales.</h1>
          <p>
            Gestiona tu cuenta con sesiones protegidas, verificación en dos pasos
            y recuperación de contraseña.
          </p>
        </div>

        <div className="landing-card">
          <p className="landing-card-label">Área de usuario</p>
          <h2>Comienza aquí</h2>
          <p>Inicia sesión o crea una cuenta nueva para continuar.</p>
          <div className="landing-actions">
            <Link className="button-link" to="/login" state={modalState}>
              Iniciar sesión
            </Link>
            <Link className="button-link secondary" to="/register" state={modalState}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
