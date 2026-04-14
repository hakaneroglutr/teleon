// src/config/constants.ts

export const APP_VERSION   = '1.0.0';
export const APP_NAME      = 'Teleon';
export const APP_BUNDLE_ID = 'com.teleon.app';

// Cache TTL (saniye)
export const CACHE = {
  CHANNELS:    60 * 60 * 24,   // 24 saat
  EPG:         60 * 60 * 6,    // 6 saat
  VOD:         60 * 60 * 2,    // 2 saat
  SERIES:      60 * 60 * 2,    // 2 saat
  AUTH:        60 * 60 * 12,   // 12 saat
} as const;

// Oynatıcı
export const PLAYER = {
  BUFFER_MS:         3000,
  RECONNECT_DELAY:   5000,
  RECONNECT_ATTEMPTS: 3,
  CONTROL_HIDE_MS:   4000,
  SEEK_STEP_MS:      10_000,  // 10 saniye
  LONG_SEEK_STEP_MS: 30_000,  // 30 saniye
} as const;

// UI
export const UI = {
  GRID_COLS:         3,
  EPG_PX_PER_MIN:    4,
  EPG_CHANNEL_H:     56,
  EPG_HEADER_H:      44,
  CHANNEL_LOGO_SIZE: 44,
  POSTER_RATIO:      1.5,   // yükseklik / genişlik
} as const;

// Network
export const NETWORK = {
  TIMEOUT_MS:   15_000,
  USER_AGENT:   'Teleon/1.0 Android',
} as const;

// Kanal sayfa boyutu (FlashList için)
export const PAGE_SIZE = 50;
