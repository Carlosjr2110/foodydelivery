import { AlertIcon } from "./icons";

export default function FieldError({ message }) {
  return (
    <span className={`field-error ${message ? "field-error-visible" : ""}`}>
      {message && (
        <>
          <AlertIcon />
          {message}
        </>
      )}
    </span>
  );
}
