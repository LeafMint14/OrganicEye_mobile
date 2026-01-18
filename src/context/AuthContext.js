import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, First_Name, Last_Name, contact) => {
    return await AuthService.register(email, password, First_Name, Last_Name, contact);
  };

  // --- UPDATED LOGIN (Removed logs) ---
  const login = async (email, password) => {
    // We just return the result; the LoginScreen will handle showing the Alert
    return await AuthService.login(email, password);
  };

  const logout = async () => {
    return await AuthService.logout();
  };

  const resetPassword = async (email) => {
    return await AuthService.resetPassword(email);
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await AuthService.changePassword(currentPassword, newPassword);
  };

  useEffect(() => {
    // Removed setup log
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      // Removed "Auth state changed" log to keep console clean
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    changePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};