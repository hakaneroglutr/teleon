// src/hooks/useVodLoader.ts
import {useState, useCallback} from 'react';
import {useServerStore} from '@store/serverStore';
import {XtreamService} from '@services/XtreamService';
import {VodItem, Category} from '@store/types';

export function useVodLoader() {
  const activeServer  = useServerStore((s) => s.activeServer);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [items,       setItems]       = useState<VodItem[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

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
    setError(null);
    try {
      const cats = await svc.getVodCategories();
      setCategories(cats);
    } catch (e: any) {
      setError(e?.message ?? 'Hata');
    } finally {
      setIsLoading(false);
    }
  }, [buildService]);

  const loadItems = useCallback(async (categoryId?: string) => {
    const svc = buildService();
    if (!svc) return;
    setIsLoading(true);
    setError(null);
    try {
      const vods = await svc.getVodStreams(categoryId);
      setItems(vods);
    } catch (e: any) {
      setError(e?.message ?? 'Hata');
    } finally {
      setIsLoading(false);
    }
  }, [buildService]);

  return {categories, items, isLoading, error, loadCategories, loadItems};
}
