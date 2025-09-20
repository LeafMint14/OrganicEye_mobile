import React, { createContext, useContext, useState, useEffect } from 'react';
import  AuthService  from '../services/AuthService';

const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Signup function
  const signup = async (email, password, First_Name, Last_Name, contact) => {
    return await AuthService.register(email, password, First_Name, Last_Name, contact);
  };

  // Login function
  const login = async (email, password) => {
    return await AuthService.login(email, password);
  };

  // Logout function
  const logout = async () => {
    return await AuthService.logout();
  };

  // Reset password function
  const resetPassword = async (email) => {
    return await AuthService.resetPassword(email);
  };

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};