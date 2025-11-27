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
 * Generate a complete dynamic color palette from 3 base colors
 */
export function generateDynamicPalette(colors: string[]) {
  const [primary, secondary, tertiary] = colors;
  
  return {
    primary,
    secondary,
    tertiary,
    // Very light background derived from primary (for Hero, Method sections)
    lightBg: adjustLightness(primary, 97),
    // Very dark background derived from secondary (for Problem section)
    darkBg: adjustLightness(secondary, 10),
    // Medium dark background derived from secondary (for Expert section)
    mediumDarkBg: adjustLightness(secondary, 18),
    // Light accent color derived from tertiary (for badges, highlights)
    accentLight: adjustLightness(tertiary, 92),
    // Very light versions for cards
    primaryLight: adjustLightness(primary, 94),
    secondaryLight: adjustLightness(secondary, 94),
    // Slightly darker versions for hover states
    primaryDark: adjustLightness(primary, 35),
    secondaryDark: adjustLightness(secondary, 35),
  };
}

/**
 * Generate gradient string for CTA buttons
 */
export function generateGradient(color1: string, color2: string): string {
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}
