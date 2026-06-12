import React, { createContext, useContext, useEffect, useState } from "react";
import { getStoredUser, logout as authLogout, StoredUser } from "../services/auth";
import { loginUser } from "../services/api";

type AuthContextType = {
  user: StoredUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    setUser(res.user);
  };

  const signOut = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
