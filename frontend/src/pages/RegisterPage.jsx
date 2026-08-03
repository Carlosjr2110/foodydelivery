import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import FieldError from "../components/FieldError";
import { MailIcon, UserIcon } from "../components/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Informe seu nome";
  } else if (form.name.trim().length < 2) {
    errors.name = "O nome deve ter pelo menos 2 caracteres";
  }

  if (!form.email.trim()) {
    errors.email = "Informe seu e-mail";
  } else if (!EMAIL_RE.test(form.email)) {
    errors.email = "Informe um e-mail válido";
  }

  if (!form.password) {
    errors.password = "Informe uma senha";
  } else if (form.password.length < 6) {
    errors.password = "A senha deve ter pelo menos 6 caracteres";
  }

  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("form"); // form | success | entering

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
    setTouched({ name: true, email: true, password: true });
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      await register(form);
      setStage("success");
    } catch (err) {
      setError(err.response?.data?.message ?? "Não foi possível criar a conta");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (stage === "success") {
      const t = setTimeout(() => setStage("entering"), 1600);
      return () => clearTimeout(t);
    }
    if (stage === "entering") {
      const t = setTimeout(() => navigate("/"), 1100);
      return () => clearTimeout(t);
    }
  }, [stage, navigate]);

  if (stage !== "form") {
    return (
      <AuthLayout>
        <div className="auth-success">
          {stage === "success" ? (
            <>
              <div className="success-check">✓</div>
              <h1>Conta criada!</h1>
              <p className="auth-subtitle">
                Obrigado por se cadastrar, {form.name.split(" ")[0]}!
              </p>
            </>
          ) : (
            <>
              <div className="spinner" />
              <p className="auth-subtitle">Entrando...</p>
            </>
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <img src="/logo.png" alt="Foody Delivery" className="auth-logo-mobile" />
        <div className="auth-header">
          <h1>Criar conta</h1>
          <p className="auth-subtitle">Cadastre-se para começar a pedir</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          Nome
          <div className="input-group">
            <UserIcon className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder="Seu nome"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={touched.name && !!fieldErrors.name}
            />
          </div>
          <FieldError message={touched.name && fieldErrors.name} />
        </label>
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
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={touched.password && !!fieldErrors.password}
          />
          <FieldError message={touched.password && fieldErrors.password} />
        </label>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !isValid}
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
        <p className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
