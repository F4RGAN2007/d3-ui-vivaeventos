import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          🎟 <span style={styles.logoText}>VivaEventos</span>
        </Link>

        {/* Links */}
        <div style={styles.links}>
          <Link to="/" style={isActive("/") && location.pathname === "/" ? styles.linkActive : styles.link}>
            Eventos
          </Link>

          {user?.role === "CLIENT" && (
            <>
              <Link to="/cart" style={isActive("/cart") ? styles.linkActive : styles.link}>
                🛒 Carrito
              </Link>
              <Link to="/payments" style={isActive("/payments") ? styles.linkActive : styles.link}>
                Pagos
              </Link>
              <Link to="/my-tickets" style={isActive("/my-tickets") ? styles.linkActive : styles.link}>
                🎫 Mis Boletas
              </Link>
            </>
          )}

          {user?.role === "ORGANIZER" && (
            <>
              <Link to="/organizer/events" style={isActive("/organizer/events") ? styles.linkActive : styles.link}>
                Mis Eventos
              </Link>
              <Link to="/organizer/discounts" style={isActive("/organizer/discounts") ? styles.linkActive : styles.link}>
                Descuentos
              </Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <Link to="/payments" style={isActive("/payments") ? styles.linkActive : styles.link}>
              Pagos
            </Link>
          )}
        </div>

        {/* User section */}
        <div style={styles.user}>
          {user ? (
            <>
              <span style={styles.username}>
                {user.firstName || user.username}
                <span style={styles.roleBadge}>{user.role}</span>
              </span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.authLink}>Iniciar sesión</Link>
              <Link to="/register" style={styles.registerBtn}>Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    zIndex: 900,
    background: "rgba(13,13,15,0.92)",       // --bg-base con alpha
    borderBottom: "1px solid #2e2e38",        // --border
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    height: "64px",                           // --nav-height
    display: "flex",
    alignItems: "center",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1.5rem",
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Bebas Neue', sans-serif",   // --font-display
    fontWeight: 400,
    fontSize: "1.4rem",
    letterSpacing: "0.06em",
    background: "linear-gradient(135deg, #ff5c35, #7c4dff)", // accent → purple
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    flex: 1,
    flexWrap: "wrap",
  },
  link: {
    color: "#9999b0",                         // --text-secondary
    textDecoration: "none",
    fontSize: "0.88rem",
    fontWeight: 600,
    fontFamily: "'Nunito', sans-serif",       // --font-body
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",                      // --radius-sm
    transition: "all 0.18s ease",
  },
  linkActive: {
    color: "#ff5c35",                         // --accent
    textDecoration: "none",
    fontSize: "0.88rem",
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",
    background: "rgba(255,92,53,0.12)",       // --accent-dim
    transition: "all 0.18s ease",
  },
  user: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexShrink: 0,
    marginLeft: "auto",
  },
  username: {
    fontSize: "0.85rem",
    color: "#f0f0f5",                         // --text-primary
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  roleBadge: {
    fontSize: "0.7rem",
    padding: "0.15rem 0.5rem",
    background: "rgba(124,77,255,0.20)",      // --purple-dim
    color: "#7c4dff",                         // --purple
    borderRadius: "9999px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    border: "1px solid rgba(124,77,255,0.35)",
    fontFamily: "'Nunito', sans-serif",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #2e2e38",              // --border
    color: "#9999b0",                         // --text-secondary
    padding: "0.35rem 0.875rem",
    borderRadius: "6px",
    fontSize: "0.83rem",
    fontWeight: 600,
    fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  authLink: {
    color: "#9999b0",                         // --text-secondary
    textDecoration: "none",
    fontSize: "0.88rem",
    fontWeight: 600,
    fontFamily: "'Nunito', sans-serif",
  },
  registerBtn: {
    background: "#ff5c35",                    // --accent
    color: "#fff",
    textDecoration: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    letterSpacing: "0.04em",
    transition: "all 0.18s ease",
  },
};