// src/theme/typography.ts
import {Platform, TextStyle} from 'react-native';
import {Colors} from './colors';

const fontFamily = Platform.select({
  android: 'Inter',
  default: 'System',
});

const monoFamily = Platform.select({
  android: 'JetBrainsMono',
  default: 'Courier',
});

export const Typography: Record<string, TextStyle> = {
  // Display
  displayLarge: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Headings
  h1: {fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28, color: Colors.textPrimary},
  h2: {fontFamily, fontSize: 18, fontWeight: '600', lineHeight: 24, color: Colors.textPrimary},
  h3: {fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 22, color: Colors.textPrimary},
  h4: {fontFamily, fontSize: 14, fontWeight: '600', lineHeight: 20, color: Colors.textPrimary},

  // Body
  bodyLarge:  {fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 24, color: Colors.textPrimary},
  body:       {fontFamily, fontSize: 14, fontWeight: '400', lineHeight: 20, color: Colors.textPrimary},
  bodySmall:  {fontFamily, fontSize: 12, fontWeight: '400', lineHeight: 18, color: Colors.textSecondary},

  // Labels
  labelLarge:  {fontFamily, fontSize: 14, fontWeight: '500', lineHeight: 20, color: Colors.textPrimary},
  label:       {fontFamily, fontSize: 12, fontWeight: '500', lineHeight: 16, color: Colors.textSecondary},
  labelSmall:  {fontFamily, fontSize: 10, fontWeight: '500', lineHeight: 14, color: Colors.textTertiary, letterSpacing: 0.4},

  // Caption
  caption: {fontFamily, fontSize: 11, fontWeight: '400', lineHeight: 14, color: Colors.textTertiary},

  // Mono
  mono: {fontFamily: monoFamily, fontSize: 13, lineHeight: 20, color: Colors.textSecondary},
} as const;
