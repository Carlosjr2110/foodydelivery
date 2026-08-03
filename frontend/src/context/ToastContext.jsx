import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback(
    (message, type = "success") => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const success = useCallback((message) => show(message, "success"), [show]);
  const error = useCallback((message) => show(message, "error"), [show]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => dismiss(toast.id)}
          >
            <span className="toast-icon">{toast.type === "success" ? "✓" : "!"}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}
