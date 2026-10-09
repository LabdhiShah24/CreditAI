import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

interface User {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  date_joined: string;
  profile_picture?: string | null;
  theme?: string;
  reduce_motion?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await fetchApi('/user/me/');
      setUser(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout/', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial CSRF fetch then check auth
    fetchApi('/csrf/')
      .then(() => checkAuth())
      .catch(() => checkAuth());
  }, []);

  useEffect(() => {
    const applyTheme = (themePref: string | undefined) => {
      if (themePref === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (themePref === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Default to light if no explicit preference
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(user?.theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!user?.theme || user.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    if (user?.reduce_motion === 'on') {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
