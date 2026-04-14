// src/theme/colors.ts
// Teleon Design System — Dark IPTV Theme

export const Colors = {
  // Core Backgrounds
  background:       '#0F1923',  // Ana arka plan — en koyu
  surface:          '#16213E',  // Card, modal, panel arka planı
  surfaceElevated:  '#1A2744',  // Yükseltilmiş yüzeyler
  surfaceBorder:    '#243055',  // Kart kenarlığı

  // Primary Brand
  primary:          '#0F3460',  // Marka ana rengi
  primaryLight:     '#1A4A7A',  // Hover, pressed
  accent:           '#E94560',  // Vurgu — CTA, aktif, canlı gösterge
  accentDim:        '#C73550',  // Basılı vurgu

  // Gold — premium/featured
  gold:             '#F5A623',
  goldDim:          '#CC8A1A',

  // Text
  textPrimary:      '#FFFFFF',
  textSecondary:    '#A8A8B3',
  textTertiary:     '#6B6B7A',
  textDisabled:     '#3D3D4A',

  // Status
  success:          '#27AE60',
  successSurface:   '#1A3D2A',
  warning:          '#F5A623',
  warningSurface:   '#3D2E0D',
  error:            '#E74C3C',
  errorSurface:     '#3D1A1A',
  info:             '#3498DB',
  infoSurface:      '#1A2D3D',

  // Live indicator
  live:             '#E94560',
  liveSurface:      '#3D1520',

  // Navigation
  tabActive:        '#E94560',
  tabInactive:      '#555566',
  tabBackground:    '#111827',

  // Player
  playerBg:         '#000000',
  playerOverlay:    'rgba(0,0,0,0.7)',
  playerControls:   'rgba(15,25,35,0.9)',
  progressBar:      '#E94560',
  progressBg:       'rgba(255,255,255,0.2)',
  progressBuffer:   'rgba(255,255,255,0.35)',

  // EPG
  epgHeader:        '#111827',
  epgRow:           '#16213E',
  epgRowAlt:        '#131D35',
  epgCurrentTime:   '#E94560',
  epgProgram:       '#1E2D50',
  epgProgramActive: '#1A4A7A',

  // Transparent helpers
  overlay20:        'rgba(0,0,0,0.20)',
  overlay40:        'rgba(0,0,0,0.40)',
  overlay60:        'rgba(0,0,0,0.60)',
  overlay80:        'rgba(0,0,0,0.80)',
  white10:          'rgba(255,255,255,0.10)',
  white20:          'rgba(255,255,255,0.20)',
  white30:          'rgba(255,255,255,0.30)',
} as const;

export type ColorKey = keyof typeof Colors;
