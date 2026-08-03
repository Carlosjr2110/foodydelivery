import { useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "./icons";

export default function Modal({ onClose, children, className = "" }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Renderiza num portal para o body: garante overlay em tela cheia mesmo quando
  // o modal é aberto a partir de um elemento com transform (ex.: hover de card),
  // já que "position: fixed" passa a ser relativo a esse ancestral em vez do viewport.
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-panel ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
          <XIcon />
        </button>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
