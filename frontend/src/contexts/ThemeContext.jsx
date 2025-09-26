import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage if present, otherwise default to light
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Debug logging
    console.log('Theme context: Setting theme to', theme);
    console.log('HTML classes after setting:', root.className);
    console.log('CSS variables test - --black:', getComputedStyle(root).getPropertyValue('--black'));
    console.log('CSS variables test - --white:', getComputedStyle(root).getPropertyValue('--white'));
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
