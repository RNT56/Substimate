import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';
export type VisualStyle =
  | 'neumorphic'
  | 'glassmorphic'
  | 'minimal'
  | 'brutalist'
  | 'neobrutalist'
  | 'modern'
  | 'claymorphism'
  | 'aurora'
  | 'retro'
  | 'base';

interface ThemeContextType {
  theme: Theme;
  visualStyle: VisualStyle;
  toggleTheme: () => void;
  setVisualStyle: (style: VisualStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'dark';
  });

  const [visualStyle, setVisualStyleInternal] = useState<VisualStyle>(() => {
    const savedStyle = localStorage.getItem('visualStyle');
    // Default to neumorphic or another preferred default
    return (savedStyle as VisualStyle) || 'modern';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('visualStyle', visualStyle);
    document.documentElement.setAttribute('data-visual-style', visualStyle);
  }, [visualStyle]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setVisualStyle = (style: VisualStyle) => {
    setVisualStyleInternal(style);
  };

  return (
    <ThemeContext.Provider value={{ theme, visualStyle, toggleTheme, setVisualStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { // Keep hook name or rename to useAppTheme etc. if preferred
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const visualStyles: VisualStyle[] = [
  'neumorphic',
  'glassmorphic',
  'minimal',
  'brutalist',
  'neobrutalist',
  'modern',
  'claymorphism',
  'aurora',
  'retro',
];