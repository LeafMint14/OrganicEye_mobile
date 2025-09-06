import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  theme: 'light',
  colors: {
    bg: '#ffffff',
    text: '#1f2937',
    card: '#ffffff',
    muted: '#6b7280',
    primary: '#1f7a4f',
  },
  setTheme: () => {},
  toggleTheme: () => {},
});

const lightPalette = {
  bg: '#ffffff',
  text: '#1f2937',
  card: '#ffffff',
  muted: '#6b7280',
  primary: '#1f7a4f',
};

const darkPalette = {
  bg: '#0f172a',
  text: '#f3f4f6',
  card: '#111827',
  muted: '#9ca3af',
  primary: '#10b981',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('app_theme');
      if (saved === 'dark' || saved === 'light') setTheme(saved);
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('app_theme', theme).catch(() => {});
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    colors: theme === 'dark' ? darkPalette : lightPalette,
    setTheme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
