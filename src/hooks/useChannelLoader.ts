// src/hooks/useChannelLoader.ts
//
// Aktif sunucudan kanal + kategori listesini çeker,
// Zustand store'a yazar ve SQLite önbelleğine kaydeder.

import {useCallback, useEffect, useRef} from 'react';
import {useServerStore} from '@store/serverStore';
import {useChannelStore} from '@store/channelStore';
import {XtreamService} from '@services/XtreamService';
import {M3UParser} from '@services/M3UParser';
import {StalkerService} from '@services/StalkerService';
import {TeleonDatabase} from '@native/TeleonDatabase';
import {Channel, Category} from '@store/types';

export interface LoadResult {
  channels:   number;
  categories: number;
  error?:     string;
}

export function useChannelLoader() {
  const activeServer  = useServerStore((s) => s.activeServer);
  const setChannels   = useChannelStore((s) => s.setChannels);
  const setCategories = useChannelStore((s) => s.setCategories);
  const setLoading    = useChannelStore((s) => s.setLoading);
  const channels      = useChannelStore((s) => s.channels);
  const abortRef      = useRef(false);

  // ── Ana yükleme fonksiyonu ─────────────────────────────────────────────────
  const loadChannels = useCallback(async (force = false): Promise<LoadResult> => {
    if (!activeServer) return {channels: 0, categories: 0, error: 'Aktif sunucu yok'};

    abortRef.current = false;
    setLoading(true);

    try {
      let result: {channels: Channel[]; categories: Category[]};

      switch (activeServer.type) {
        case 'xtream':
          result = await loadXtream(activeServer, abortRef);
          break;
        case 'm3u':
          result = await loadM3U(activeServer);
          break;
        case 'stalker':
          result = await loadStalker(activeServer);
          break;
        default:
          throw new Error(`Bilinmeyen sunucu türü: ${activeServer.type}`);
      }

      if (abortRef.current) return {channels: 0, categories: 0};

      // Kategori isimlerini kanallara ata
      const catMap = new Map(result.categories.map((c) => [c.categoryId, c.categoryName]));
      const enriched = result.channels.map((ch) => ({
        ...ch,
        categoryName: catMap.get(ch.categoryId) ?? ch.categoryName,
      }));

      // Store güncelle
      setCategories(result.categories);
      setChannels(enriched);

      // SQLite önbellek (arkaplanda)
      persistToDb(activeServer.id, enriched).catch(() => {});

      return {channels: enriched.length, categories: result.categories.length};

    } catch (err: any) {
      const msg = err?.message ?? 'Bilinmeyen hata';
      return {channels: 0, categories: 0, error: msg};
    } finally {
      setLoading(false);
    }
  }, [activeServer, setChannels, setCategories, setLoading]);

  // ── Sunucu değişince otomatik yükle ───────────────────────────────────────
  useEffect(() => {
    if (activeServer && channels.length === 0) {
      loadChannels();
    }
    return () => { abortRef.current = true; };
  }, [activeServer?.id]);

  return {loadChannels, isLoading: false};
}

// ── Xtream yükleyici ──────────────────────────────────────────────────────────
async function loadXtream(
  server: NonNullable<ReturnType<typeof useServerStore.getState>['activeServer']>,
  abortRef: React.MutableRefObject<boolean>,
): Promise<{channels: Channel[]; categories: Category[]}> {
  const svc = new XtreamService({
    host:     server.host,
    port:     server.port ?? 8080,
    username: server.username ?? '',
    password: server.password ?? '',
    serverId: server.id,
  });

  // Kategorileri çek
  const categories = await svc.getLiveCategories();
  if (abortRef.current) return {channels: [], categories: []};

  // Tüm kanalları çek (tüm kategoriler birden)
  const channels = await svc.getLiveStreams();
  if (abortRef.current) return {channels: [], categories: []};

  return {channels, categories};
}

// ── M3U yükleyici ─────────────────────────────────────────────────────────────
async function loadM3U(
  server: NonNullable<ReturnType<typeof useServerStore.getState>['activeServer']>,
): Promise<{channels: Channel[]; categories: Category[]}> {
  if (!server.m3uUrl) throw new Error('M3U URL eksik');
  const parser = new M3UParser(server.id);
  const result = await parser.parseFromUrl(server.m3uUrl);
  return {channels: result.channels, categories: result.categories};
}

// ── Stalker yükleyici ─────────────────────────────────────────────────────────
async function loadStalker(
  server: NonNullable<ReturnType<typeof useServerStore.getState>['activeServer']>,
): Promise<{channels: Channel[]; categories: Category[]}> {
  if (!server.mac) throw new Error('Stalker MAC adresi eksik');
  const svc = new StalkerService({
    portalUrl: `http://${server.host}`,
    mac:       server.mac,
    serverId:  server.id,
  });
  await svc.authenticate();
  const categories = await svc.getLiveCategories();
  const channels   = await svc.getLiveStreams();
  return {channels, categories};
}

// ── SQLite önbellek ───────────────────────────────────────────────────────────
async function persistToDb(serverId: number, channels: Channel[]) {
  await TeleonDatabase.clearChannels(serverId);
  // Toplu insert — 500'er parça
  const BATCH = 500;
  for (let i = 0; i < channels.length; i += BATCH) {
    const slice = channels.slice(i, i + BATCH);
    await Promise.all(
      slice.map((ch) =>
        TeleonDatabase.insertChannel(serverId, JSON.stringify(ch))
      )
    );
  }
}
