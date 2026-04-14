// src/hooks/useAppInit.ts
// Uygulama açılış sırası:
// 1. MMKV'den server listesini geri yükle
// 2. Aktif sunucu varsa kanal listesini SQLite önbelleğinden yükle
// 3. Arka planda güncel kanalları çek

import {useEffect, useRef} from 'react';
import {useServerStore} from '@store/serverStore';
import {useChannelStore} from '@store/channelStore';
import {useChannelLoader} from './useChannelLoader';
import {TeleonDatabase} from '@native/TeleonDatabase';

export function useAppInit() {
  const activeServer  = useServerStore((s) => s.activeServer);
  const setChannels   = useChannelStore((s) => s.setChannels);
  const channels      = useChannelStore((s) => s.channels);
  const {loadChannels} = useChannelLoader();
  const initialized   = useRef(false);

  useEffect(() => {
    if (initialized.current || !activeServer) return;
    initialized.current = true;

    async function init() {
      // 1. SQLite önbelleğinden anında yükle (hızlı)
      try {
        const cached = await TeleonDatabase.getChannels(activeServer!.id);
        if (cached.length > 0) {
          const parsed = cached
            .map((s) => { try { return JSON.parse(s); } catch { return null; } })
            .filter(Boolean);
          if (parsed.length > 0) {
            setChannels(parsed);
          }
        }
      } catch {/* önbellek yoksa atla */}

      // 2. Arka planda sunucudan güncel listeyi çek
      loadChannels(false).catch(() => {});
    }

    init();
  }, [activeServer?.id]);
}
