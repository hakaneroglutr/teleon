// src/screens/PlayerScreen.tsx  (Faz 2 — tam implementasyon)
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View, StyleSheet, StatusBar, Animated,
  PanResponder, Dimensions, Text, TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {PlayerRouteProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {Spacing, Radius} from '@theme/spacing';
import {TeleonPlayerView} from '@components/player/TeleonPlayerView';
import {PlayerControls} from '@components/player/PlayerControls';
import {usePlayer} from '@utils/usePlayer';
import {useChannelStore} from '@store/channelStore';
import {guessStreamEngine, formatDuration} from '@utils/helpers';

const {width, height} = Dimensions.get('window');
const CTRL_TIMEOUT = 4000;

export default function PlayerScreen() {
  const navigation  = useNavigation();
  const route       = useRoute<PlayerRouteProp>();
  const {streamUrl, title, streamId, engine, posterUrl} = route.params;

  const addToHistory = useChannelStore((s) => s.addToHistory);
  const {
    play, pause, resume, stop, forward, rewind, seek,
    isPlaying, isBuffering, isError, errorMsg,
    position, duration, engine: activeEngine,
  } = usePlayer();

  const resolvedEngine = engine ?? guessStreamEngine(streamUrl);

  // ── Control visibility ─────────────────────────────────────────────────────
  const ctrlOpacity = useRef(new Animated.Value(1)).current;
  const ctrlTimer   = useRef<ReturnType<typeof setTimeout>>();
  const [ctrlVisible, setCtrlVisible] = useState(true);

  const showControls = useCallback(() => {
    clearTimeout(ctrlTimer.current);
    setCtrlVisible(true);
    Animated.timing(ctrlOpacity, {toValue: 1, duration: 180, useNativeDriver: true}).start();
    ctrlTimer.current = setTimeout(() => {
      Animated.timing(ctrlOpacity, {toValue: 0, duration: 500, useNativeDriver: true})
        .start(() => setCtrlVisible(false));
    }, CTRL_TIMEOUT);
  }, [ctrlOpacity]);

  // ── Gesture (seek / volume / brightness) ──────────────────────────────────
  const gestureRef  = useRef<{startX: number; startY: number; startPos: number} | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8,
      onPanResponderGrant: (e) => {
        gestureRef.current = {
          startX: e.nativeEvent.pageX,
          startY: e.nativeEvent.pageY,
          startPos: position,
        };
        showControls();
      },
      onPanResponderMove: (_, gs) => {
        const g = gestureRef.current;
        if (!g) return;
        if (Math.abs(gs.dx) > Math.abs(gs.dy) && duration > 0) {
          const secs = Math.round((gs.dx / width) * (duration / 1000));
          setHint(`${secs >= 0 ? '+' : ''}${secs}s`);
        } else {
          const isLeft = g.startX < width / 2;
          const pct    = Math.round(-gs.dy / (height * 0.4) * 100);
          setHint(isLeft ? `☀ ${Math.abs(pct)}%` : `🔊 ${Math.abs(pct)}%`);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const g = gestureRef.current;
        if (g && Math.abs(gs.dx) > Math.abs(gs.dy) && duration > 0) {
          const delta  = (gs.dx / width) * duration;
          const newPos = Math.max(0, Math.min(duration, g.startPos + delta));
          seek(newPos);
        }
        gestureRef.current = null;
        setTimeout(() => setHint(null), 700);
      },
    }),
  ).current;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    StatusBar.setHidden(true, 'slide');
    showControls();
    play(streamUrl, title, resolvedEngine, {streamId, posterUrl});
    if (streamId) addToHistory(streamId);
    return () => {
      clearTimeout(ctrlTimer.current);
      StatusBar.setHidden(false, 'slide');
      stop();
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClose     = useCallback(() => { stop().then(() => navigation.goBack()); }, [stop, navigation]);
  const handlePlayPause = useCallback(() => { isPlaying ? pause() : resume(); showControls(); }, [isPlaying]);
  const handleSeekTo    = useCallback((ratio: number) => { seek(ratio * duration); showControls(); }, [duration]);

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <StatusBar hidden />

      {/* Video surface */}
      <TeleonPlayerView
        style={StyleSheet.absoluteFill}
        playerId="main"
        engine={resolvedEngine}
        isVisible
      />

      {/* Buffering */}
      {isBuffering && !isError && (
        <View style={styles.bufferWrap} pointerEvents="none">
          <View style={styles.bufferBox}>
            <Text style={styles.bufferIcon}>⏳</Text>
          </View>
        </View>
      )}

      {/* Error */}
      {isError && (
        <View style={styles.errorWrap}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Oynatma hatası</Text>
          <Text style={styles.errorMsg} numberOfLines={3}>{errorMsg}</Text>
          <View style={styles.errorBtns}>
            <TouchableOpacity
              style={[styles.errorBtn, {backgroundColor: Colors.accent}]}
              onPress={() => play(streamUrl, title, resolvedEngine)}>
              <Text style={styles.errorBtnTxt}>Tekrar Dene</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.errorBtn} onPress={handleClose}>
              <Text style={styles.errorBtnTxt}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Gesture hint */}
      {hint && (
        <View style={styles.hintWrap} pointerEvents="none">
          <Text style={styles.hintTxt}>{hint}</Text>
        </View>
      )}

      {/* Controls */}
      {!isError && (
        <PlayerControls
          title={title}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          isLive={duration === 0}
          position={position}
          duration={duration}
          engine={activeEngine}
          opacity={ctrlOpacity}
          visible={ctrlVisible}
          onClose={handleClose}
          onPlayPause={handlePlayPause}
          onSeekBack={() => { rewind(10_000); showControls(); }}
          onSeekFwd={() => { forward(10_000); showControls(); }}
          onSettings={() => showControls()}
          onPiP={() => navigation.goBack()}
          onSeekTo={handleSeekTo}
        />
      )}

      {/* Tap to toggle controls */}
      <View style={StyleSheet.absoluteFill} onTouchEnd={showControls} pointerEvents="box-none" />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       {flex: 1, backgroundColor: '#000'},
  bufferWrap: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
  bufferBox:  {width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center'},
  bufferIcon: {fontSize: 28},
  errorWrap:  {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.88)', padding: Spacing.xl, gap: Spacing.md},
  errorIcon:  {fontSize: 44},
  errorTitle: {fontSize: 18, fontWeight: '700', color: Colors.textPrimary},
  errorMsg:   {fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20},
  errorBtns:  {flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm},
  errorBtn:   {paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.white30},
  errorBtnTxt:{fontSize: 13, fontWeight: '600', color: Colors.textPrimary},
  hintWrap:   {position: 'absolute', alignSelf: 'center', top: '38%', backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24},
  hintTxt:    {fontSize: 22, fontWeight: '700', color: Colors.textPrimary},
});
