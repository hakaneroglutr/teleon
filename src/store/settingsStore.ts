// src/store/settingsStore.ts
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';

interface Settings {
  playerEngine:       'vlc' | 'exo' | 'auto';
  hwDecoding:         boolean;
  bufferSize:         number;       // KB
  reconnectOnError:   boolean;
  reconnectAttempts:  number;
  defaultAudioTrack:  string;
  defaultSubtitle:    string;
  channelCacheTTL:    number;       // seconds
  epgCacheTTL:        number;       // seconds
  epgDaysAhead:       number;
  theme:              'dark' | 'system';
  language:           'tr' | 'en';
  showChannelNumbers: boolean;
  showEpgBar:         boolean;
  autoPlayNext:       boolean;
  skipIntroSeconds:   number;
  parentalLock:       boolean;
  parentalPin:        string;
}

interface SettingsStore {
  settings: Settings;
  update:   (patch: Partial<Settings>) => void;
  reset:    () => void;
}

const defaults: Settings = {
  playerEngine:       'auto',
  hwDecoding:         true,
  bufferSize:         1024,
  reconnectOnError:   true,
  reconnectAttempts:  3,
  defaultAudioTrack:  'auto',
  defaultSubtitle:    'off',
  channelCacheTTL:    86400,
  epgCacheTTL:        21600,
  epgDaysAhead:       3,
  theme:              'dark',
  language:           'tr',
  showChannelNumbers: true,
  showEpgBar:         true,
  autoPlayNext:       true,
  skipIntroSeconds:   0,
  parentalLock:       false,
  parentalPin:        '',
};

export const useSettingsStore = create<SettingsStore>()(
  immer((set) => ({
    settings: {...defaults},

    update: (patch) =>
      set((s) => { Object.assign(s.settings, patch); }),

    reset: () =>
      set((s) => { s.settings = {...defaults}; }),
  })),
);
