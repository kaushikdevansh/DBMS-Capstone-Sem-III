import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("auth:logout", onLogout);

    if (getToken()) {
      api
        .get("/auth/me")
        .then((result) => setUser(result.user))
        .catch(() => clearToken())
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }

    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = async (username, password) => {
    const result = await api.post("/auth/login", { username, password });
    setToken(result.token);
    setUser(result.user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}
