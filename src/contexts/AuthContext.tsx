"use client";

import { useState, useEffect, createContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  signup: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('ephemeral-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from session storage", e);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, pass: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass }),
    });

    if (response.ok) {
      const userData = { username };
      sessionStorage.setItem('ephemeral-user', JSON.stringify(userData));
      setUser(userData);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
  }, []);

  const signup = useCallback(async (username: string, pass: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass }),
    });

    if (response.ok) {
      const userData = { username };
      sessionStorage.setItem('ephemeral-user', JSON.stringify(userData));
      setUser(userData);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Signup failed');
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('ephemeral-user');
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
