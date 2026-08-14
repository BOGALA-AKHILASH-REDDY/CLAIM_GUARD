import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("claimguard_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("claimguard_token");
      const storedUser = localStorage.getItem("claimguard_user");
      
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch {
          localStorage.removeItem("claimguard_token");
          localStorage.removeItem("claimguard_user");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const res = await api.post("/auth/login", {
        username,
        password,
        remember_me: rememberMe,
      });
      const data = res.data;
      setToken(data.access_token);
      setUser(data);
      localStorage.setItem("claimguard_token", data.access_token);
      localStorage.setItem("claimguard_user", JSON.stringify(data));
      return { success: true, user: data };
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid provider ID / Insurance ID or password.";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("claimguard_token");
    localStorage.removeItem("claimguard_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
