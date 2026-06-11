import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CLIENT",
  });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.username || !form.email || !form.password || !form.confirmPassword)
      return "Completa todos los campos.";
    if (!/\S+@\S+\.\S+/.test(form.email))
      return "Ingresa un email válido.";
    if (form.password.length < 8)
      return "La contraseña debe tener al menos 8 caracteres.";
    if (form.password !== form.confirmPassword)
      return "Las contraseñas no coinciden.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      setSuccess("¡Cuenta creada! Redirigiendo al login…");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.userMessage ?? "Error al registrar. Intenta con otro usuario o email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <div className="auth-header">
          <span className="auth-emoji">✨</span>
          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-subtitle">Únete a VivaEventos hoy</p>
        </div>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-input"
              placeholder="nombre_usuario"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Tipo de cuenta</label>
            <select
              id="role"
              name="role"
              className="form-input"
              value={form.role}
              onChange={handleChange}
            >
              <option value="CLIENT">Cliente — comprar boletas</option>
              <option value="ORGANIZER">Organizador — crear eventos</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="auth-link">Ingresa aquí</Link>
        </p>
      </div>
    </div>
  );
}