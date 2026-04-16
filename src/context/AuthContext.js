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

  
  const login = async (email, password) => {
    
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
    
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      
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