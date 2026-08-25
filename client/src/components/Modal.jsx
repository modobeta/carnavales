import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

export default function Modal({ children, dismissible = true, label = "Autenticación" }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    document.body.classList.add("modal-open");

    const firstFocusable = dialogRef.current?.querySelector(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    return () => {
      document.body.classList.remove("modal-open");
      previousFocusRef.current?.focus?.();
    };
  }, []);

  const close = () => {
    if (location.state?.backgroundLocation) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && dismissible) {
      close();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])];
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleBackdropClick = (event) => {
    if (dismissible && event.target === event.currentTarget) close();
  };

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <section
        ref={dialogRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {dismissible && (
          <button type="button" className="modal-close" onClick={close} aria-label="Cerrar">
            <span aria-hidden="true">×</span>
          </button>
        )}
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}
