import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

/* Decode JWT payload without a library */
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/* Extract role from Keycloak token.
   Keycloak puts custom roles in realm_access.roles.
   The registration body uses {"role":"CLIENT"} so Spring may also copy it
   to a top-level "role" claim. We check both. */
function extractRole(payload) {
  if (!payload) return null;

  // Custom claim set by Spring / API Gateway
  if (payload.role) return payload.role;

  // Keycloak realm roles
  const realmRoles = payload.realm_access?.roles ?? [];
  for (const r of ["ADMIN", "ORGANIZER", "CLIENT"]) {
    if (realmRoles.includes(r)) return r;
  }

  // Resource-level roles (fallback)
  const resourceRoles = Object.values(payload.resource_access ?? {})
    .flatMap((res) => res.roles ?? []);
  for (const r of ["ADMIN", "ORGANIZER", "CLIENT"]) {
    if (resourceRoles.includes(r)) return r;
  }

  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);   // { username, email, role, sub, token }
  const [loading, setLoading] = useState(true);

  /* Restore session on mount */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({
          token,
          sub:      payload.sub,
          username: payload.preferred_username ?? payload.username ?? "",
          email:    payload.email ?? "",
          firstName:payload.given_name  ?? "",
          lastName: payload.family_name ?? "",
          role:     extractRole(payload),
        });
      } else {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const token = res.data.token ?? res.data.access_token ?? res.data.accessToken;
    if (!token) throw new Error("No se recibió token del servidor.");

    localStorage.setItem("token", token);
    const payload = decodeJwt(token);
    const newUser = {
      token,
      sub:      payload?.sub ?? "",
      username: payload?.preferred_username ?? username,
      email:    payload?.email ?? "",
      firstName:payload?.given_name  ?? "",
      lastName: payload?.family_name ?? "",
      role:     extractRole(payload),
    };
    setUser(newUser);
    return newUser;
  }, []);

  const register = useCallback(async (data) => {
    // data: { username, email, firstName, lastName, password, role }
    const res = await api.post("/auth/register", data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}