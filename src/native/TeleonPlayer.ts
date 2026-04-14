// src/native/TeleonPlayer.ts
//
// TypeScript köprüsü — Kotlin tarafı: TeleonPlayerModule.kt
// Desteklenen motorlar: VLC (libvlc) | ExoPlayer (Media3)

import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

const {TeleonPlayerModule} = NativeModules;

if (!TeleonPlayerModule && Platform.OS === 'android') {
  console.warn(
    '[TeleonPlayer] Native module not found. ' +
    'Run `npx react-native run-android` to rebuild.',
  );
}

const emitter = TeleonPlayerModule
  ? new NativeEventEmitter(TeleonPlayerModule)
  : null;

export type PlayerEngine = 'vlc' | 'exo';

export interface AudioTrack {
  id:   number;
  name: string;
  lang: string;
}

export interface SubtitleTrack {
  id:   number;
  name: string;
  lang: string;
}

export interface PlayerInfo {
  position:    number;   // ms
  duration:    number;   // ms
  isPlaying:   boolean;
  isPaused:    boolean;
  isBuffering: boolean;
  videoWidth:  number;
  videoHeight: number;
  engine:      PlayerEngine;
}

// ── Event payloads ────────────────────────────────────────────────────────────
export type PlayerStateEvent = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export interface PlayerProgressEvent {
  position:  number;  // ms
  duration:  number;  // ms
  buffered:  number;  // ms
}

export interface PlayerErrorEvent {
  code:    number;
  message: string;
}

// ── API ───────────────────────────────────────────────────────────────────────
export const TeleonPlayer = {
  /**
   * Verilen URL'yi belirtilen motorla oynatmaya başlar.
   * engine: 'vlc' (varsayılan) veya 'exo'
   */
  play: (url: string, engine: PlayerEngine = 'vlc'): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.play(url, engine);
  },

  pause: (): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.pause();
  },

  resume: (): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.resume();
  },

  stop: (): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.stop();
  },

  seek: (positionMs: number): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.seek(positionMs);
  },

  seekRelative: (offsetMs: number): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.seekRelative(offsetMs);
  },

  setVolume: (volume: number): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.setVolume(Math.max(0, Math.min(200, volume)));
  },

  setSpeed: (speed: number): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.setSpeed(speed);
  },

  getInfo: (): Promise<PlayerInfo> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.getInfo();
  },

  getAudioTracks: (): Promise<AudioTrack[]> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.getAudioTracks();
  },

  setAudioTrack: (trackId: number): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.setAudioTrack(trackId);
  },

  getSubtitleTracks: (): Promise<SubtitleTrack[]> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.getSubtitleTracks();
  },

  setSubtitleTrack: (trackId: number): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.setSubtitleTrack(trackId);
  },

  enablePiP: (): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.enablePiP();
  },

  disablePiP: (): Promise<void> => {
    if (!TeleonPlayerModule) return Promise.reject(new Error('Native module not available'));
    return TeleonPlayerModule.disablePiP();
  },

  // ── Event listeners ─────────────────────────────────────────────────────────
  onStateChange: (cb: (state: PlayerStateEvent) => void) => {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onPlayerStateChange', cb);
  },

  onProgress: (cb: (data: PlayerProgressEvent) => void) => {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onPlayerProgress', cb);
  },

  onError: (cb: (err: PlayerErrorEvent) => void) => {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onPlayerError', cb);
  },

  onVideoSize: (cb: (data: {width: number; height: number}) => void) => {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onVideoSize', cb);
  },
} as const;
