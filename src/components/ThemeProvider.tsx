// ThemeProvider.tsx
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check localStorage or system preference on initial load
    const storedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      setTheme(storedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document and save preference
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}