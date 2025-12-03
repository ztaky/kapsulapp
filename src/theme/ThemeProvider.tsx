import React, { createContext, useContext, ReactNode } from 'react';
import { LandingPageTheme } from '@/config/landingPageSchema';

interface ThemeContextType {
  theme: LandingPageTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  theme: LandingPageTheme;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={{ theme }}>
      <div
        style={{
          '--color-primary': theme.colors.primary,
          '--color-primary-dark': theme.colors.primaryDark,
          '--color-bg-dark': theme.colors.bgDark,
          '--color-bg-light': theme.colors.bgLight,
          '--color-text-dark': theme.colors.textDark,
          '--color-text-light': theme.colors.textLight,
          '--color-accent-green': theme.colors.accentGreen,
          '--color-accent-red': theme.colors.accentRed,
          '--font-family': 'Inter',
          '--font-heading-weight': theme.fonts.heading,
          '--font-body-weight': theme.fonts.body,
        } as React.CSSProperties}
        className="landing-page-theme"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper pour générer un gradient CSS avec les couleurs du thème
export function getGradientStyle(theme: LandingPageTheme): string {
  return `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`;
}

// Helper pour obtenir une classe Tailwind avec la couleur du thème
export function getColorClasses(theme: LandingPageTheme) {
  return {
    primary: `[color:var(--color-primary)]`,
    primaryDark: `[color:var(--color-primary-dark)]`,
    bgDark: `[background-color:var(--color-bg-dark)]`,
    bgLight: `[background-color:var(--color-bg-light)]`,
    textDark: `[color:var(--color-text-dark)]`,
    textLight: `[color:var(--color-text-light)]`,
    accentGreen: `[color:var(--color-accent-green)]`,
    accentRed: `[color:var(--color-accent-red)]`,
  };
}
