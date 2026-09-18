import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("smartbills_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me()
      .then((currentUser) => setUser(currentUser))
      .catch(() => {
        localStorage.removeItem("smartbills_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      register: async (payload) => {
        const data = await api.register(payload);
        localStorage.setItem("smartbills_token", data.token);
        setUser(data.user);
        return data.user;
      },
      login: async (credentials) => {
        const data = await api.login(credentials);
        localStorage.setItem("smartbills_token", data.token);
        setUser(data.user);
        return data.user;
      },
      logout: () => {
        localStorage.removeItem("smartbills_token");
        setUser(null);
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
