// src/hooks/useEPG.ts
import {useState, useCallback, useRef} from 'react';
import {useServerStore} from '@store/serverStore';
import {XtreamService} from '@services/XtreamService';
import {EPGProgram} from '@store/types';

// streamId → EPGProgram[]
type EPGCache = Map<number, EPGProgram[]>;

export function useEPG() {
  const activeServer = useServerStore((s) => s.activeServer);
  const cacheRef     = useRef<EPGCache>(new Map());
  const [loading, setLoading] = useState<Set<number>>(new Set());

  const buildService = useCallback((): XtreamService | null => {
    if (!activeServer || activeServer.type !== 'xtream') return null;
    return new XtreamService({
      host:     activeServer.host,
      port:     activeServer.port ?? 8080,
      username: activeServer.username ?? '',
      password: activeServer.password ?? '',
      serverId: activeServer.id,
    });
  }, [activeServer]);

  const getEPG = useCallback(async (streamId: number, limit = 4): Promise<EPGProgram[]> => {
    // Önbellekten dön
    if (cacheRef.current.has(streamId)) {
      return cacheRef.current.get(streamId)!;
    }

    const svc = buildService();
    if (!svc) return [];

    setLoading((s) => new Set(s).add(streamId));
    try {
      const programs = await svc.getShortEPG(streamId, limit);
      cacheRef.current.set(streamId, programs);
      return programs;
    } catch {
      return [];
    } finally {
      setLoading((s) => { const n = new Set(s); n.delete(streamId); return n; });
    }
  }, [buildService]);

  const getFullEPG = useCallback(async (streamId: number): Promise<EPGProgram[]> => {
    const svc = buildService();
    if (!svc) return [];
    try {
      const programs = await svc.getFullEPG(streamId);
      cacheRef.current.set(streamId, programs);
      return programs;
    } catch {
      return [];
    }
  }, [buildService]);

  const clearCache = useCallback(() => { cacheRef.current.clear(); }, []);

  const isLoading = useCallback((streamId: number) => loading.has(streamId), [loading]);

  return {getEPG, getFullEPG, clearCache, isLoading};
}
