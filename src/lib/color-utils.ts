/**
 * Utility functions for generating dynamic color palettes
 */

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): HSL {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust lightness of a color
 */
function adjustLightness(hex: string, targetLightness: number): string {
  const hsl = hexToHSL(hex);
  return hslToHex(hsl.h, hsl.s, targetLightness);
}

/**
 * Theme-aware text colors
 */
export interface ThemeColors {
  bodyText: string;
  subtitleText: string;
  mutedText: string;
  background: string;
  cardBackground: string;
  cardBackgroundAlt: string;
}

export function getThemeColors(theme: 'light' | 'dark'): ThemeColors {
  if (theme === 'dark') {
    return {
      bodyText: '#f5f5f5',      // White text for dark mode
      subtitleText: '#d1d5db',   // Gray-300 for subtitles
      mutedText: '#9ca3af',      // Gray-400 for muted
      background: '#0f0f1a',     // Very dark background
      cardBackground: 'rgba(255, 255, 255, 0.05)',
      cardBackgroundAlt: 'rgba(255, 255, 255, 0.08)',
    };
  }
  return {
    bodyText: '#1a1a1a',         // Dark text for light mode
    subtitleText: '#4b5563',     // Gray-600 for subtitles
    mutedText: '#6b7280',        // Gray-500 for muted
    background: '#ffffff',       // White background
    cardBackground: 'rgba(255, 255, 255, 0.95)',
    cardBackgroundAlt: '#f9fafb',
  };
}

/**
 * Generate a complete dynamic color palette from 2 base colors + theme
 */
export function generateDynamicPalette(colors: string[], theme: 'light' | 'dark' = 'light') {
  const [primary, secondary] = colors;
  const tertiary = secondary || primary; // Fallback for tertiary
  const themeColors = getThemeColors(theme);
  
  return {
    // Main brand colors
    primary,
    secondary: secondary || primary,
    tertiary,
    
    // Theme-aware text colors
    ...themeColors,
    
    // Backgrounds based on theme
    lightBg: theme === 'dark' ? '#0f0f1a' : adjustLightness(primary, 97),
    darkBg: theme === 'dark' ? '#0a0a12' : adjustLightness(secondary || primary, 10),
    mediumDarkBg: theme === 'dark' ? '#151524' : adjustLightness(secondary || primary, 18),
    
    // Accent colors
    accentLight: adjustLightness(tertiary, theme === 'dark' ? 25 : 92),
    
    // Card backgrounds
    primaryLight: adjustLightness(primary, theme === 'dark' ? 15 : 94),
    secondaryLight: adjustLightness(secondary || primary, theme === 'dark' ? 15 : 94),
    
    // Darker variants for hover states
    primaryDark: adjustLightness(primary, theme === 'dark' ? 65 : 35),
    secondaryDark: adjustLightness(secondary || primary, theme === 'dark' ? 65 : 35),
  };
}

/**
 * Generate gradient string for CTA buttons
 */
export function generateGradient(color1: string, color2: string): string {
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

/**
 * Glass effect utility for modern card designs
 */
export function getGlassStyle(opacity: number = 0.95, theme: 'light' | 'dark' = 'light') {
  return {
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    backgroundColor: theme === 'dark' 
      ? `rgba(255, 255, 255, ${opacity * 0.05})` 
      : `rgba(255, 255, 255, ${opacity})`,
  };
}
