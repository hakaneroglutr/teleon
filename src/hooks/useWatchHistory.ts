// src/hooks/useWatchHistory.ts
// VOD izleme pozisyonunu kaydeder ve geri yükler

import {useCallback} from 'react';
import {TeleonDatabase} from '@native/TeleonDatabase';

export function useWatchHistory() {
  // VOD pozisyonunu kaydet (ms cinsinden)
  const savePosition = useCallback(async (
    name: string,
    positionMs: number,
    durationMs: number,
  ) => {
    try {
      const time      = String(Math.floor(positionMs / 1000));
      const totalTime = String(Math.floor(durationMs  / 1000));
      await TeleonDatabase.upsertRecent(name, time, totalTime);
    } catch {}
  }, []);

  // Kaydedilmiş pozisyonu oku (ms cinsinden, null = yok)
  const getSavedPosition = useCallback(async (name: string): Promise<number | null> => {
    try {
      const r = await TeleonDatabase.getRecent(name);
      if (!r) return null;
      const secs = parseInt(r.TIME, 10);
      const total = parseInt(r.TOTALTIME, 10);
      // Son %95'ini bitirdiyse baştan başlat
      if (total > 0 && secs / total > 0.95) return null;
      return secs * 1000;
    } catch {
      return null;
    }
  }, []);

  // Dizi ilerleme
  const saveSeriesProgress = useCallback(async (
    seriesName: string,
    seasonName: string,
    episodeName: string,
  ) => {
    try {
      await TeleonDatabase.upsertSeriesProgress(seriesName, seasonName, episodeName);
    } catch {}
  }, []);

  const getSeriesProgress = useCallback(async (seriesName: string) => {
    try {
      return await TeleonDatabase.getSeriesProgress(seriesName);
    } catch {
      return null;
    }
  }, []);

  return {savePosition, getSavedPosition, saveSeriesProgress, getSeriesProgress};
}
