// src/hooks/useSeriesLoader.ts
import {useState, useCallback} from 'react';
import {useServerStore} from '@store/serverStore';
import {XtreamService} from '@services/XtreamService';
import {Series, Episode, Category} from '@store/types';

export function useSeriesLoader() {
  const activeServer = useServerStore((s) => s.activeServer);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList]  = useState<Series[]>([]);
  const [episodes,   setEpisodes]    = useState<Record<string, Episode[]>>({});
  const [isLoading,  setIsLoading]   = useState(false);
  const [error,      setError]       = useState<string | null>(null);

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

  const loadCategories = useCallback(async () => {
    const svc = buildService();
    if (!svc) return;
    setIsLoading(true);
    try {
      const cats = await svc.getSeriesCategories();
      setCategories(cats);
    } catch (e: any) { setError(e?.message); }
    finally { setIsLoading(false); }
  }, [buildService]);

  const loadSeries = useCallback(async (categoryId?: string) => {
    const svc = buildService();
    if (!svc) return;
    setIsLoading(true);
    try {
      const list = await svc.getSeries(categoryId);
      setSeriesList(list);
    } catch (e: any) { setError(e?.message); }
    finally { setIsLoading(false); }
  }, [buildService]);

  const loadEpisodes = useCallback(async (seriesId: number) => {
    const svc = buildService();
    if (!svc) return {};
    try {
      const {seasons} = await svc.getSeriesInfo(seriesId);
      setEpisodes(seasons);
      return seasons;
    } catch { return {}; }
  }, [buildService]);

  return {
    categories, seriesList, episodes, isLoading, error,
    loadCategories, loadSeries, loadEpisodes,
  };
}
