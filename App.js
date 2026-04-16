import React from 'react';
import { DeviceProvider } from './src/screens/DeviceContext'; 
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

// Down in your render/return function:
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* ADD THE DEVICE PROVIDER HERE */}
        <DeviceProvider>
          <AppNavigator />
        </DeviceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}