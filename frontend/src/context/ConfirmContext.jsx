import { createContext, useCallback, useContext, useRef, useState } from "react";
import Modal from "../components/Modal";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setRequest({ message, ...options });
    });
  }, []);

  function respond(result) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <Modal onClose={() => respond(false)} className="modal-panel-sm">
          <div className="confirm-dialog">
            {request.title && <h2>{request.title}</h2>}
            <p className="confirm-dialog-message">{request.message}</p>
            <div className="confirm-dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => respond(false)}>
                {request.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                className={`btn ${request.danger ? "btn-danger" : "btn-primary"}`}
                onClick={() => respond(true)}
              >
                {request.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm deve ser usado dentro de um ConfirmProvider");
  }
  return confirm;
}
