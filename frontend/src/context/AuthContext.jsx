import React, { createContext, useContext, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ng_admin_token");
    if (!token) { setLoading(false); return; }
    adminApi
      .me()
      .then((d) => setEmail(d.email))
      .catch(() => localStorage.removeItem("ng_admin_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (e, p) => {
    const data = await adminApi.login(e, p);
    localStorage.setItem("ng_admin_token", data.token);
    setEmail(data.email);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ng_admin_token");
    setEmail(null);
  };

  const applyAuth = (token, newEmail) => {
    localStorage.setItem("ng_admin_token", token);
    setEmail(newEmail);
  };

  return (
    <AuthContext.Provider value={{ email, isAuthed: !!email, loading, login, logout, applyAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
