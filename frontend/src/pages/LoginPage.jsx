import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import FieldError from "../components/FieldError";
import { MailIcon } from "../components/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};

  if (!form.email.trim()) {
    errors.email = "Informe seu e-mail";
  } else if (!EMAIL_RE.test(form.email)) {
    errors.email = "Informe um e-mail válido";
  }

  if (!form.password) {
    errors.password = "Informe sua senha";
  }

  return errors;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fieldErrors = validate(form);
  const isValid = Object.keys(fieldErrors).length === 0;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleBlur(e) {
    setTouched({ ...touched, [e.target.name]: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message ?? "Não foi possível fazer login");
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <img src="/logo.png" alt="Foody Delivery" className="auth-logo-mobile" />
        <div className="auth-header">
          <h1>Bem-vindo de volta</h1>
          <p className="auth-subtitle">Entre para acompanhar seus pedidos</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          E-mail
          <div className="input-group">
            <MailIcon className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="voce@exemplo.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.email && !!fieldErrors.email}
            />
          </div>
          <FieldError message={touched.email && fieldErrors.email} />
        </label>
        <label>
          Senha
          <PasswordInput
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.password && !!fieldErrors.password}
          />
          <FieldError message={touched.password && fieldErrors.password} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading || !isValid}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="auth-switch">
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
