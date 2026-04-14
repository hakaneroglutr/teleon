// src/utils/usePlayer.ts
// Oynatıcı state'ini ve kontrol fonksiyonlarını tek hook'ta birleştirir

import {useCallback, useEffect, useRef} from 'react';
import {usePlayerStore} from '@store/playerStore';
import {TeleonPlayer, PlayerEngine} from '@native/TeleonPlayer';

export function usePlayer() {
  const nowPlaying    = usePlayerStore((s) => s.nowPlaying);
  const playerState   = usePlayerStore((s) => s.state);
  const setNowPlaying = usePlayerStore((s) => s.setNowPlaying);
  const updateState   = usePlayerStore((s) => s.updateState);
  const setBuffering  = usePlayerStore((s) => s.setBuffering);
  const setError      = usePlayerStore((s) => s.setError);
  const clearError    = usePlayerStore((s) => s.clearError);
  const reset         = usePlayerStore((s) => s.reset);

  const subscriptions = useRef<Array<{remove: () => void}>>([]);

  // ── Event listener kurulumu ────────────────────────────────────────────────
  useEffect(() => {
    const stateSub = TeleonPlayer.onStateChange((state) => {
      updateState({
        isPlaying:   state === 'playing',
        isPaused:    state === 'paused',
        isBuffering: state === 'loading',
        isError:     state === 'error',
      });
    });

    const progressSub = TeleonPlayer.onProgress(({position, duration}) => {
      updateState({position, duration});
    });

    const errorSub = TeleonPlayer.onError(({message}) => {
      setError(message);
    });

    subscriptions.current = [stateSub, progressSub, errorSub];

    return () => {
      subscriptions.current.forEach((s) => s.remove());
      subscriptions.current = [];
    };
  }, []);

  // ── Kontrol fonksiyonları ──────────────────────────────────────────────────
  const play = useCallback(
    async (url: string, title: string, engine: PlayerEngine = 'vlc', options?: {
      streamId?: number;
      posterUrl?: string;
      type?: 'live' | 'vod' | 'series';
    }) => {
      clearError();
      setNowPlaying({
        streamUrl: url,
        title,
        streamId:  options?.streamId,
        posterUrl: options?.posterUrl,
        type:      options?.type ?? 'live',
      });
      await TeleonPlayer.play(url, engine);
    },
    [clearError, setNowPlaying],
  );

  const pause   = useCallback(() => TeleonPlayer.pause(),   []);
  const resume  = useCallback(() => TeleonPlayer.resume(),  []);
  const stop    = useCallback(async () => {
    await TeleonPlayer.stop();
    reset();
  }, [reset]);

  const seek    = useCallback((ms: number)     => TeleonPlayer.seek(ms),           []);
  const forward = useCallback((ms = 10_000)    => TeleonPlayer.seekRelative(ms),   []);
  const rewind  = useCallback((ms = 10_000)    => TeleonPlayer.seekRelative(-ms),  []);
  const setVol  = useCallback((v: number)      => TeleonPlayer.setVolume(v),       []);
  const setSpd  = useCallback((s: number)      => TeleonPlayer.setSpeed(s),        []);

  // ── Progress hesabı ───────────────────────────────────────────────────────
  const progress = playerState.duration > 0
    ? playerState.position / playerState.duration
    : 0;

  return {
    // State
    nowPlaying,
    isPlaying:   playerState.isPlaying,
    isPaused:    playerState.isPaused,
    isBuffering: playerState.isBuffering,
    isError:     playerState.isError,
    errorMsg:    playerState.errorMsg,
    position:    playerState.position,
    duration:    playerState.duration,
    progress,
    engine:      playerState.engine,
    volume:      playerState.volume,
    // Actions
    play, pause, resume, stop,
    seek, forward, rewind,
    setVolume: setVol,
    setSpeed:  setSpd,
  };
}
