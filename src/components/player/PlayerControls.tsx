// src/components/player/PlayerControls.tsx
import React, {useCallback} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import {Colors} from '@theme/colors';
import {Spacing, Radius} from '@theme/spacing';
import {formatDuration} from '@utils/helpers';

const {width} = Dimensions.get('window');

interface Props {
  title:       string;
  isPlaying:   boolean;
  isBuffering: boolean;
  isLive:      boolean;
  position:    number;   // ms
  duration:    number;   // ms
  engine:      string;
  opacity:     Animated.Value;
  visible:     boolean;
  onClose:     () => void;
  onPlayPause: () => void;
  onSeekBack:  () => void;
  onSeekFwd:   () => void;
  onSettings:  () => void;
  onPiP:       () => void;
  onSeekTo:    (ratio: number) => void;
}

export function PlayerControls({
  title, isPlaying, isBuffering, isLive,
  position, duration, engine, opacity, visible,
  onClose, onPlayPause, onSeekBack, onSeekFwd,
  onSettings, onPiP, onSeekTo,
}: Props) {

  const progress = duration > 0 ? position / duration : 0;

  const handleProgressTap = useCallback((evt: any) => {
    const bar = evt.nativeEvent;
    const ratio = bar.locationX / (width - Spacing.lg * 2 - 80);
    onSeekTo(Math.max(0, Math.min(1, ratio)));
  }, [onSeekTo]);

  return (
    <Animated.View
      style={[styles.container, {opacity}]}
      pointerEvents={visible ? 'box-none' : 'none'}>

      {/* ── Üst bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
          <Text style={styles.iconTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          {isLive && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTxt}>CANLI</Text>
            </View>
          )}
          <Text style={styles.titleTxt} numberOfLines={1}>{title}</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={onSettings}>
          <Text style={styles.iconTxt}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* ── Merkez kontroller ────────────────────────────────────────────── */}
      <View style={styles.centerRow}>
        {/* Geri 10s */}
        <TouchableOpacity style={styles.seekBtn} onPress={onSeekBack}>
          <Text style={styles.seekIcon}>↩</Text>
          <Text style={styles.seekLabel}>10s</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          style={[styles.playBtn, isBuffering && styles.playBtnDim]}
          onPress={onPlayPause}
          disabled={isBuffering}
          activeOpacity={0.8}>
          {isBuffering
            ? <Text style={styles.playIcon}>⏳</Text>
            : <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          }
        </TouchableOpacity>

        {/* İleri 10s */}
        <TouchableOpacity style={styles.seekBtn} onPress={onSeekFwd}>
          <Text style={styles.seekIcon}>↪</Text>
          <Text style={styles.seekLabel}>10s</Text>
        </TouchableOpacity>
      </View>

      {/* ── Alt bar ─────────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {/* Progress — sadece VOD */}
        {duration > 0 && (
          <TouchableOpacity
            style={styles.progressWrap}
            onPress={handleProgressTap}
            activeOpacity={1}>
            <Text style={styles.timeTxt}>{formatDuration(position)}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, {width: `${progress * 100}%`}]} />
              <View style={[styles.thumb, {left: `${progress * 100}%`}]} />
            </View>
            <Text style={styles.timeTxt}>{formatDuration(duration)}</Text>
          </TouchableOpacity>
        )}

        {/* Alt eylemler */}
        <View style={styles.actionsRow}>
          <View style={styles.engineBadge}>
            <Text style={styles.engineTxt}>{engine.toUpperCase()}</Text>
          </View>
          <View style={{flex: 1}} />
          <ActionBtn label="⧉ PiP"  onPress={onPiP} />
          <ActionBtn label="🔊"      onPress={() => {}} />
          <ActionBtn label="CC"      onPress={() => {}} />
        </View>
      </View>
    </Animated.View>
  );
}

function ActionBtn({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <Text style={styles.actionTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:   {...StyleSheet.absoluteFillObject, justifyContent: 'space-between'},

  // Top
  topBar:      {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: 'rgba(0,0,0,0.55)'},
  iconBtn:     {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  iconTxt:     {fontSize: 16, color: Colors.textPrimary},
  titleWrap:   {flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.sm, gap: Spacing.xs},
  livePill:    {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, gap: 3},
  liveDot:     {width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff'},
  liveTxt:     {fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.8},
  titleTxt:    {flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary},

  // Center
  centerRow:   {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40},
  seekBtn:     {alignItems: 'center', gap: 2},
  seekIcon:    {fontSize: 26, color: Colors.textPrimary},
  seekLabel:   {fontSize: 10, color: Colors.textSecondary},
  playBtn:     {width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center'},
  playBtnDim:  {opacity: 0.5},
  playIcon:    {fontSize: 26, color: Colors.textPrimary},

  // Bottom
  bottomBar:   {paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, backgroundColor: 'rgba(0,0,0,0.55)'},
  progressWrap:{flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, paddingVertical: Spacing.xs},
  timeTxt:     {fontSize: 11, color: Colors.textSecondary, minWidth: 38},
  track:       {flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative'},
  fill:        {height: '100%', backgroundColor: Colors.accent, borderRadius: 2},
  thumb:       {position: 'absolute', top: -4, width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.accent, marginLeft: -5},
  actionsRow:  {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  engineBadge: {backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3},
  engineTxt:   {fontSize: 10, color: Colors.textTertiary, fontWeight: '600'},
  actionBtn:   {backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.xs},
  actionTxt:   {fontSize: 12, color: Colors.textPrimary},
});
