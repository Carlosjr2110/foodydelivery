import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persistSession(data) {
    localStorage.setItem("token", data.token);
    const currentUser = { id: data.userId, name: data.name, email: data.email };
    localStorage.setItem("user", JSON.stringify(currentUser));
    setUser(currentUser);
  }

  async function login(credentials) {
    const data = await authApi.login(credentials);
    persistSession(data);
  }

  async function register(details) {
    const data = await authApi.register(details);
    persistSession(data);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
