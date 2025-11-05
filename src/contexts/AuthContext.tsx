"use client";

import { useState, useEffect, createContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DeviceInfo } from '@/lib/types';

interface User {
  username: string;
}

interface AuthContextType {
  user: User;
  deviceInfo: DeviceInfo | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  signup: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  deviceInfo: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('ephemeral-user');
      const storedDevice = sessionStorage.getItem('ephemeral-device');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedDevice) {
        setDeviceInfo(JSON.parse(storedDevice));
      }
    } catch (e) {
      console.error("Failed to parse from session storage", e);
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
      const resData = await response.json();
      const userData = { username };
      const deviceData = { ip: resData.ip, userAgent: resData.userAgent };

      sessionStorage.setItem('ephemeral-user', JSON.stringify(userData));
      sessionStorage.setItem('ephemeral-device', JSON.stringify(deviceData));
      setUser(userData);
      setDeviceInfo(deviceData);
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
      // After signup, we log in to get device info
      await login(username, pass);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Signup failed');
    }
  }, [login]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('ephemeral-user');
    sessionStorage.removeItem('ephemeral-device');
    setUser(null);
    setDeviceInfo(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, deviceInfo, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
