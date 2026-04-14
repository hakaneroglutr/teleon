// src/hooks/useFavourites.ts
// Favori işlemlerini Zustand + SQLite ile senkronize eder

import {useCallback} from 'react';
import {useChannelStore} from '@store/channelStore';
import {TeleonDatabase} from '@native/TeleonDatabase';
import {Channel, VodItem, Series} from '@store/types';

export function useFavourites() {
  const favouriteIds = useChannelStore((s) => s.favouriteIds);
  const toggle       = useChannelStore((s) => s.toggleFavourite);

  const toggleLive = useCallback(async (channel: Channel) => {
    const isFav = favouriteIds.has(channel.streamId);
    toggle(channel.streamId);
    const json = JSON.stringify(channel);
    try {
      if (isFav) {
        await TeleonDatabase.removeFavourite(json);
      } else {
        await TeleonDatabase.addFavourite(json);
      }
    } catch {/* DB hatası sessizce atla */}
  }, [favouriteIds, toggle]);

  const toggleVod = useCallback(async (item: VodItem, currentlyFav: boolean) => {
    const json = JSON.stringify(item);
    try {
      if (currentlyFav) {
        await TeleonDatabase.removeVodFavourite(json);
      } else {
        await TeleonDatabase.addVodFavourite(json);
      }
    } catch {}
  }, []);

  const toggleSeries = useCallback(async (item: Series, currentlyFav: boolean) => {
    const json = JSON.stringify(item);
    try {
      if (currentlyFav) {
        await TeleonDatabase.removeSeriesFavourite(json);
      } else {
        await TeleonDatabase.addSeriesFavourite(json);
      }
    } catch {}
  }, []);

  const isFav = useCallback((streamId: number) => favouriteIds.has(streamId), [favouriteIds]);

  return {toggleLive, toggleVod, toggleSeries, isFav};
}
