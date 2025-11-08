'use client'

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  };

  const theme = {
    isDark,
    toggleTheme,
    // Background colors
    bg: {
      primary: isDark ? 'bg-dark-bg-primary' : 'bg-gradient-to-br from-slate-50 to-slate-100',
      secondary: isDark ? 'bg-dark-bg-secondary' : 'bg-white',
      tertiary: isDark ? 'bg-dark-bg-tertiary' : 'bg-slate-50',
      canvas: isDark ? 'bg-dark-bg-primary' : 'bg-slate-50',
      hover: isDark ? 'hover:bg-dark-bg-tertiary' : 'hover:bg-slate-50',
      modal: isDark ? 'bg-dark-bg-secondary' : 'bg-white',
    },
    // Text colors
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-400' : 'text-gray-500',
      muted: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    // Border colors
    border: {
      primary: isDark ? 'border-dark-border-primary' : 'border-slate-200',
      secondary: isDark ? 'border-dark-border-secondary' : 'border-gray-300',
    },
    // Component-specific colors
    components: {
      card: {
        bg: isDark ? 'bg-dark-bg-tertiary' : 'bg-white',
        border: isDark ? 'border-dark-border-primary' : 'border-gray-300',
        hover: isDark ? 'hover:bg-dark-bg-tertiary' : 'hover:bg-slate-50',
      },
      progressBar: {
        bg: isDark ? 'bg-dark-border-primary' : 'bg-gray-200',
        border: isDark ? 'border-dark-border-secondary' : 'border-gray-300',
      },
      input: {
        bg: isDark ? 'bg-dark-bg-tertiary' : 'bg-white',
        border: isDark ? 'border-dark-border-primary' : 'border-gray-300',
        text: isDark ? 'text-white' : 'text-gray-900',
      },
      completedLesson: {
        bg: isDark ? 'bg-green-900/30' : 'bg-green-50/50',
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

