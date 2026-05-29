import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('fdphub_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { /* invalid stored data */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const userData = { ...res.data.user, token: res.data.token };
    setUser(userData);
    localStorage.setItem('fdphub_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const newUser = { ...res.data.user, token: res.data.token };
    setUser(newUser);
    localStorage.setItem('fdphub_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fdphub_user');
  };

  const updateProfile = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('fdphub_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
