"use client";

import { useState, useEffect, createContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('ephemeral-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    // In a real app, never do this!
    if (email.toLowerCase() === 'test' && pass === 'test123') {
      const userData = { email };
      localStorage.setItem('ephemeral-user', JSON.stringify(userData));
      setUser(userData);
    } else {
      throw new Error('Invalid credentials. Use test/test123');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ephemeral-user');
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
