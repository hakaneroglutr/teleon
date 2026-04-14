// src/components/player/TeleonPlayerView.tsx
//
// VLC video çıkışını gösteren native view bileşeni.
// Kotlin: TeleonSurfaceView + TeleonPlayerViewManager
//
// Kullanım:
//   <TeleonPlayerView
//     style={StyleSheet.absoluteFill}
//     playerId="main"
//     engine="vlc"
//   />

import React, {useEffect, useRef} from 'react';
import {
  requireNativeComponent,
  StyleSheet,
  View,
  ViewStyle,
  Platform,
} from 'react-native';
import {Colors} from '@theme/colors';

// ── Native view tanımı ────────────────────────────────────────────────────────
interface NativePlayerViewProps {
  style?:    ViewStyle;
  playerId?: string;
}

// Android'de native view, iOS'ta placeholder
const NativeTeleonVideoView = Platform.OS === 'android'
  ? requireNativeComponent<NativePlayerViewProps>('TeleonVideoView')
  : null;

// ── Props ─────────────────────────────────────────────────────────────────────
interface TeleonPlayerViewProps {
  style?:      ViewStyle;
  playerId?:   string;
  engine?:     'vlc' | 'exo';
  isVisible?:  boolean;
  onReady?:    () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TeleonPlayerView({
  style,
  playerId = 'main',
  engine   = 'vlc',
  isVisible = true,
  onReady,
}: TeleonPlayerViewProps) {

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  if (!isVisible) return null;

  // ExoPlayer: kendi SurfaceView'ini dahili yönetir,
  // React Native içinde overlay UI yeterli
  if (engine === 'exo' || Platform.OS !== 'android' || !NativeTeleonVideoView) {
    return (
      <View style={[styles.base, style, {backgroundColor: Colors.playerBg}]} />
    );
  }

  // VLC: SurfaceView gerekli
  return (
    <NativeTeleonVideoView
      style={[styles.base, style]}
      playerId={playerId}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: '#000',
  },
});
