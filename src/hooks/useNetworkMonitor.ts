// src/hooks/useNetworkMonitor.ts
import {useEffect, useRef, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

interface NetworkState {
  isConnected:  boolean;
  quality:      NetworkQuality;
  type:         'wifi' | 'cellular' | 'unknown' | 'none';
  isReachable:  boolean;
}

export function useNetworkMonitor() {
  const [network, setNetwork] = useState<NetworkState>({
    isConnected: true,
    quality:     'good',
    type:        'unknown',
    isReachable: true,
  });

  const appState   = useRef<AppStateStatus>(AppState.currentState);
  const pingTimer  = useRef<ReturnType<typeof setInterval>>();
  const pingTarget = 'https://www.google.com';

  const checkConnectivity = async (): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 5000);
      const start      = Date.now();
      const res        = await fetch(pingTarget, {method: 'HEAD', signal: controller.signal});
      clearTimeout(timeout);
      const latencyMs  = Date.now() - start;

      let quality: NetworkQuality = 'excellent';
      if (latencyMs > 500)       quality = 'good';
      if (latencyMs > 1500)      quality = 'poor';
      if (!res.ok)               quality = 'poor';

      setNetwork((prev) => ({
        ...prev,
        isConnected:  true,
        isReachable:  true,
        quality,
      }));
    } catch {
      setNetwork((prev) => ({
        ...prev,
        isConnected:  false,
        isReachable:  false,
        quality:      'offline',
      }));
    }
  };

  useEffect(() => {
    // İlk kontrol
    checkConnectivity();

    // 30 saniyede bir kontrol
    pingTimer.current = setInterval(checkConnectivity, 30_000);

    // App foreground'a gelince kontrol
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkConnectivity();
      }
      appState.current = nextState;
    });

    return () => {
      clearInterval(pingTimer.current);
      sub.remove();
    };
  }, []);

  return network;
}
