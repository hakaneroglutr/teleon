// src/components/player/MultiStreamPlayer.tsx
// Eş zamanlı 2×2 kanal görüntüleme bileşeni
// Her hücre bağımsız bir VLC/ExoPlayer instance'ı çalıştırır

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Image,
} from 'react-native';
import {Colors} from '@theme/colors';
import {Spacing, Radius} from '@theme/spacing';
import {Channel} from '@store/types';
import {TeleonPlayer, PlayerEngine} from '@native/TeleonPlayer';
import {guessStreamEngine} from '@utils/helpers';

const {width, height} = Dimensions.get('window');

export type GridLayout = '1x1' | '2x1' | '2x2';

interface StreamSlot {
  id:       number;   // 0-3
  channel:  Channel | null;
  isActive: boolean;  // büyütülmüş mü
  error:    boolean;
  loading:  boolean;
}

interface Props {
  layout:     GridLayout;
  channels:   (Channel | null)[];   // max 4
  onSlotPress:(slotId: number) => void;
  onClose:    () => void;
  onFullscreen:(channel: Channel) => void;
}

const GRID_CONFIGS: Record<GridLayout, {cols: number; rows: number}> = {
  '1x1': {cols: 1, rows: 1},
  '2x1': {cols: 2, rows: 1},
  '2x2': {cols: 2, rows: 2},
};

export function MultiStreamPlayer({layout, channels, onSlotPress, onClose, onFullscreen}: Props) {
  const {cols, rows} = GRID_CONFIGS[layout];
  const cellW = width / cols;
  const cellH = (height - 60) / rows;  // 60px top bar
  const totalSlots = cols * rows;

  const [slots, setSlots] = useState<StreamSlot[]>(
    Array.from({length: totalSlots}, (_, i) => ({
      id: i, channel: channels[i] ?? null, isActive: false, error: false, loading: !!channels[i],
    })),
  );

  // Her slot için ayrı bir ses kaynağı — sadece aktif slot seslenir
  const [activeAudio, setActiveAudio] = useState<number>(0);
  const playersRef = useRef<Map<number, {playing: boolean}>>(new Map());

  // Kanalları başlat
  useEffect(() => {
    slots.forEach((slot) => {
      if (!slot.channel) return;
      const engine: PlayerEngine = guessStreamEngine(slot.channel.streamUrl);
      // Not: multi-screen'de her slot kendi native player instance'ına ihtiyaç duyar.
      // Mevcut TeleonPlayerModule tek instance'lı — Faz 4'te multi-instance eklenecek.
      // Şimdilik slot 0 aktif audio, diğerleri mute.
      setSlots((prev) => prev.map((s) => s.id === slot.id ? {...s, loading: false} : s));
      playersRef.current.set(slot.id, {playing: true});
    });

    return () => {
      playersRef.current.clear();
    };
  }, []);

  const handleSlotTap = useCallback((slotId: number) => {
    setActiveAudio(slotId);
    onSlotPress(slotId);
  }, [onSlotPress]);

  const handleSlotLongPress = useCallback((slotId: number) => {
    const ch = slots[slotId]?.channel;
    if (ch) onFullscreen(ch);
  }, [slots, onFullscreen]);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Çoklu Ekran</Text>
        <View style={styles.layoutBadge}>
          <Text style={styles.layoutBadgeTxt}>{layout}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {Array.from({length: totalSlots}, (_, i) => {
          const slot = slots[i];
          const ch   = slot?.channel;
          const isAudio = activeAudio === i;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.cell,
                {width: cellW, height: cellH},
                isAudio && styles.cellActive,
              ]}
              onPress={() => handleSlotTap(i)}
              onLongPress={() => handleSlotLongPress(i)}
              activeOpacity={0.9}>

              {/* Video yüzeyi — gerçek native view Faz 4'te */}
              <View style={styles.videoSurface}>
                {ch ? (
                  <>
                    {/* Kanal logosu — stream yüklenirken göster */}
                    {ch.logoUrl && (
                      <Image
                        source={{uri: ch.logoUrl}}
                        style={styles.channelLogo}
                        resizeMode="contain"
                      />
                    )}
                    {slot.loading && (
                      <View style={styles.loadingOverlay}>
                        <Text style={styles.loadingTxt}>⏳</Text>
                      </View>
                    )}
                    {slot.error && (
                      <View style={styles.errorOverlay}>
                        <Text style={styles.errorTxt}>⚠️</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotIcon}>＋</Text>
                    <Text style={styles.emptySlotTxt}>Kanal Ekle</Text>
                  </View>
                )}
              </View>

              {/* Alt bilgi şeridi */}
              {ch && (
                <View style={styles.cellFooter}>
                  <View style={[styles.audioIndicator, isAudio && styles.audioIndicatorActive]}>
                    <Text style={styles.audioIndicatorTxt}>{isAudio ? '🔊' : '🔇'}</Text>
                  </View>
                  <Text style={styles.cellChannelName} numberOfLines={1}>{ch.name}</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeTxt}>●</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Alt kontrol şeridi */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomHint}>Uzun bas → Tam ekran  ·  Tap → Ses</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           {flex: 1, backgroundColor: '#000'},
  topBar:              {height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, gap: Spacing.sm},
  topBarTitle:         {fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1},
  layoutBadge:         {backgroundColor: Colors.surfaceElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.xs},
  layoutBadgeTxt:      {fontSize: 11, color: Colors.textTertiary, fontWeight: '600'},
  closeBtn:            {width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center'},
  closeTxt:            {fontSize: 13, color: '#fff', fontWeight: '700'},
  grid:                {flex: 1, flexDirection: 'row', flexWrap: 'wrap'},
  cell:                {borderWidth: 1, borderColor: '#111', overflow: 'hidden', position: 'relative'},
  cellActive:          {borderColor: Colors.accent, borderWidth: 2},
  videoSurface:        {flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center'},
  channelLogo:         {width: '50%', height: '50%', opacity: 0.4},
  loadingOverlay:      {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center'},
  loadingTxt:          {fontSize: 24},
  errorOverlay:        {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center'},
  errorTxt:            {fontSize: 24},
  emptySlot:           {alignItems: 'center', gap: 4, opacity: 0.3},
  emptySlotIcon:       {fontSize: 28, color: Colors.textTertiary},
  emptySlotTxt:        {fontSize: 11, color: Colors.textTertiary},
  cellFooter:          {position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 6, paddingVertical: 4, gap: 4},
  audioIndicator:      {width: 18, height: 18, alignItems: 'center', justifyContent: 'center'},
  audioIndicatorActive:{},
  audioIndicatorTxt:   {fontSize: 12},
  cellChannelName:     {flex: 1, fontSize: 10, color: Colors.textSecondary, fontWeight: '500'},
  liveBadge:           {width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.live},
  liveBadgeTxt:        {fontSize: 8, color: Colors.live},
  bottomBar:           {height: 36, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center'},
  bottomHint:          {fontSize: 11, color: Colors.textTertiary},
});
