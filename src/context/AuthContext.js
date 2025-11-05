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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Signup function
  const signup = async (email, password, First_Name, Last_Name, contact) => {
    return await AuthService.register(email, password, First_Name, Last_Name, contact);
  };

  // Login function
  const login = async (email, password) => {
    console.log('AuthContext: Login attempt for:', email);
    const result = await AuthService.login(email, password);
    console.log('AuthContext: Login result:', result.success ? 'success' : 'failed');
    return result;
  };

  // Logout function
  const logout = async () => {
    return await AuthService.logout();
  };

  // Reset password function
  const resetPassword = async (email) => {
    return await AuthService.resetPassword(email);
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    return await AuthService.changePassword(currentPassword, newPassword);
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      console.log('AuthContext: Auth state changed, user:', user ? user.email : 'null');
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