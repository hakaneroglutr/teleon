// src/store/playerStore.ts
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {PlayerState} from './types';

interface NowPlaying {
  streamUrl:  string;
  title:      string;
  streamId?:  number;
  posterUrl?: string;
  type:       'live' | 'vod' | 'series';
}

interface PlayerStore {
  state:       PlayerState;
  nowPlaying:  NowPlaying | null;
  preferredEngine: 'vlc' | 'exo';

  // Actions
  setNowPlaying:    (item: NowPlaying | null) => void;
  updateState:      (patch: Partial<PlayerState>) => void;
  setPosition:      (ms: number) => void;
  setBuffering:     (v: boolean) => void;
  setError:         (msg: string) => void;
  clearError:       () => void;
  setEngine:        (e: 'vlc' | 'exo') => void;
  setPreferredEngine:(e: 'vlc' | 'exo') => void;
  reset:            () => void;
}

const defaultState: PlayerState = {
  isPlaying:   false,
  isPaused:    false,
  isBuffering: false,
  isError:     false,
  errorMsg:    '',
  position:    0,
  duration:    0,
  speed:       1.0,
  engine:      'vlc',
  volume:      100,
};

export const usePlayerStore = create<PlayerStore>()(
  immer((set) => ({
    state:           {...defaultState},
    nowPlaying:      null,
    preferredEngine: 'vlc',

    setNowPlaying: (item) =>
      set((s) => {
        s.nowPlaying = item;
        s.state = {...defaultState, engine: s.preferredEngine};
      }),

    updateState: (patch) =>
      set((s) => { Object.assign(s.state, patch); }),

    setPosition: (ms) =>
      set((s) => { s.state.position = ms; }),

    setBuffering: (v) =>
      set((s) => { s.state.isBuffering = v; }),

    setError: (msg) =>
      set((s) => {
        s.state.isError  = true;
        s.state.errorMsg = msg;
        s.state.isPlaying = false;
      }),

    clearError: () =>
      set((s) => {
        s.state.isError  = false;
        s.state.errorMsg = '';
      }),

    setEngine: (e) =>
      set((s) => { s.state.engine = e; }),

    setPreferredEngine: (e) =>
      set((s) => { s.preferredEngine = e; }),

    reset: () =>
      set((s) => {
        s.state      = {...defaultState};
        s.nowPlaying = null;
      }),
  })),
);
