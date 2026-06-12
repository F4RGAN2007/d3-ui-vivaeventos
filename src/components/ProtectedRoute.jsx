import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Wraps routes that require authentication and optionally a specific role.
 * @param {string[]} roles — list of allowed roles. Empty = any authenticated user.
 */
export default function ProtectedRoute({ roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}