// // Authentication Context for managing user state
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { AuthService } from '../services/AuthService';

// const AuthContext = createContext({
//   user: null,
//   loading: true,
//   signIn: () => {},
//   signUp: () => {},
//   signOut: () => {},
//   resetPassword: () => {},
// });

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Listen to authentication state changes
//     const unsubscribe = AuthService.onAuthStateChanged((user) => {
//       setUser(user);
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

//   const signIn = async (email, password) => {
//     setLoading(true);
//     try {
//       const result = await AuthService.signIn(email, password);
//       return result;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signUp = async (email, password, fullName) => {
//     setLoading(true);
//     try {
//       const result = await AuthService.register(email, password, fullName);
//       return result;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signOut = async () => {
//     setLoading(true);
//     try {
//       const result = await AuthService.signOut();
//       return result;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetPassword = async (email) => {
//     try {
//       const result = await AuthService.resetPassword(email);
//       return result;
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   };

//   const value = {
//     user,
//     loading,
//     signIn,
//     signUp,
//     signOut,
//     resetPassword,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
