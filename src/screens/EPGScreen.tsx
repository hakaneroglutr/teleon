// src/screens/EPGScreen.tsx  (Faz 2 — Skia canvas EPG)
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import {Canvas, Rect, Paint, vec, Group, Skia} from '@shopify/react-native-skia';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useChannelStore} from '@store/channelStore';
import {useEPG} from '@hooks/useEPG';
import {EPGProgram} from '@store/types';
import {formatHHMM, isLiveNow, epgProgress} from '@utils/helpers';

const {width}      = Dimensions.get('window');
const TIME_W       = 60;   // Sol zaman etiketi genişliği
const CH_H         = 56;   // Her kanal satırı yüksekliği
const CH_LABEL_W   = 90;   // Kanal adı sütunu genişliği
const PX_PER_MIN   = 4;    // 1 dakika = 4px
const HOUR_W       = PX_PER_MIN * 60;  // 1 saat = 240px
const CANVAS_W     = HOUR_W * 24;     // 24 saatlik genişlik
const HEADER_H     = 44;
const NOW_OFFSET   = (() => {
  const now = new Date();
  return (now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN;
})();

export default function EPGScreen() {
  const navigation    = useNavigation();
  const channels      = useChannelStore((s) => s.channels);
  const {getFullEPG}  = useEPG();

  // Top 30 kanalı göster
  const visibleChannels = channels.slice(0, 30);

  const [epgData,  setEpgData]  = useState<Map<number, EPGProgram[]>>(new Map());
  const [loading,  setLoading]  = useState(false);
  const [selectedProg, setSelectedProg] = useState<EPGProgram | null>(null);

  const hScrollRef = useRef<ScrollView>(null);

  // EPG verisini yükle
  useEffect(() => {
    if (visibleChannels.length === 0) return;
    setLoading(true);
    Promise.all(
      visibleChannels.map(async (ch) => {
        try {
          const programs = await getFullEPG(ch.streamId);
          return [ch.streamId, programs] as [number, EPGProgram[]];
        } catch {
          return [ch.streamId, []] as [number, EPGProgram[]];
        }
      })
    ).then((entries) => {
      setEpgData(new Map(entries));
      setLoading(false);
      // Şimdiki zamana scroll
      setTimeout(() => {
        hScrollRef.current?.scrollTo({x: Math.max(0, NOW_OFFSET - 80), animated: true});
      }, 500);
    });
  }, [channels.length]);

  // Saati için zaman etiketleri (00:00 — 23:00)
  const timeLabels = Array.from({length: 24}, (_, h) => ({
    label: `${String(h).padStart(2, '0')}:00`,
    x:     h * HOUR_W,
  }));

  const handleProgramPress = useCallback((prog: EPGProgram) => {
    setSelectedProg(prog);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>TV Rehberi</Text>
        <TouchableOpacity
          style={styles.nowBtn}
          onPress={() => hScrollRef.current?.scrollTo({x: Math.max(0, NOW_OFFSET - 80), animated: true})}>
          <Text style={styles.nowBtnTxt}>● Şimdi</Text>
        </TouchableOpacity>
      </View>

      {loading && channels.length > 0 && (
        <View style={styles.loadingBar}>
          <ActivityIndicator color={Colors.accent} size="small" />
          <Text style={styles.loadingTxt}>EPG yükleniyor...</Text>
        </View>
      )}

      {channels.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTxt}>Kanal listesi yüklenince EPG görünür</Text>
        </View>
      ) : (
        <View style={styles.epgWrap}>
          {/* Kanal adı sütunu (sabit sol) */}
          <View style={[styles.channelCol, {marginTop: HEADER_H}]}>
            <ScrollView scrollEnabled={false} showsVerticalScrollIndicator={false}>
              {visibleChannels.map((ch) => (
                <View key={ch.streamId} style={styles.channelLabel}>
                  <Text style={styles.channelLabelTxt} numberOfLines={2}>
                    {ch.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Yatay scroll — saat başlıkları + program satırları */}
          <ScrollView
            ref={hScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hScroll}
            nestedScrollEnabled>

            {/* Saat başlık satırı */}
            <View style={[styles.timeHeader, {width: CANVAS_W}]}>
              {timeLabels.map(({label, x}) => (
                <View key={label} style={[styles.timeLabel, {left: x}]}>
                  <Text style={styles.timeLabelTxt}>{label}</Text>
                </View>
              ))}
              {/* Şimdiki zaman çizgisi başlığı */}
              <View style={[styles.nowLineHeader, {left: NOW_OFFSET}]} />
            </View>

            {/* Program satırları */}
            <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={false}>
              {visibleChannels.map((ch) => {
                const programs = epgData.get(ch.streamId) ?? [];
                return (
                  <View key={ch.streamId} style={[styles.programRow, {width: CANVAS_W}]}>
                    {programs.map((prog) => {
                      const startMin = new Date(prog.startTime).getHours() * 60 + new Date(prog.startTime).getMinutes();
                      const endMin   = new Date(prog.endTime).getHours()   * 60 + new Date(prog.endTime).getMinutes();
                      const x        = startMin * PX_PER_MIN;
                      const w        = Math.max((endMin - startMin) * PX_PER_MIN - 2, 20);
                      const live     = isLiveNow(prog.startTime, prog.endTime);

                      return (
                        <TouchableOpacity
                          key={prog.id}
                          style={[
                            styles.program,
                            {left: x, width: w},
                            live && styles.programLive,
                          ]}
                          onPress={() => handleProgramPress(prog)}
                          activeOpacity={0.75}>
                          {live && (
                            <View style={styles.progressBar}>
                              <View style={[styles.progressFill, {width: `${epgProgress(prog.startTime, prog.endTime) * 100}%`}]} />
                            </View>
                          )}
                          <Text style={[styles.programTxt, live && styles.programTxtLive]} numberOfLines={1}>
                            {prog.title}
                          </Text>
                          <Text style={styles.programTime}>
                            {formatHHMM(prog.startTime)}–{formatHHMM(prog.endTime)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {/* Şimdiki zaman kırmızı çizgisi */}
                    <View style={[styles.nowLine, {left: NOW_OFFSET}]} />
                  </View>
                );
              })}
            </ScrollView>
          </ScrollView>
        </View>
      )}

      {/* Program detay popup */}
      {selectedProg && (
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setSelectedProg(null)}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>{selectedProg.title}</Text>
            <Text style={styles.popupTime}>
              {formatHHMM(selectedProg.startTime)} – {formatHHMM(selectedProg.endTime)}
            </Text>
            {selectedProg.description ? (
              <Text style={styles.popupDesc} numberOfLines={4}>{selectedProg.description}</Text>
            ) : null}
            <TouchableOpacity style={styles.popupClose} onPress={() => setSelectedProg(null)}>
              <Text style={styles.popupCloseTxt}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      {flex: 1, backgroundColor: Colors.background},
  header:         {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.sm},
  title:          {...Typography.h1},
  nowBtn:         {backgroundColor: Colors.liveSurface, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full},
  nowBtnTxt:      {fontSize: 12, color: Colors.live, fontWeight: '700'},
  loadingBar:     {flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xs},
  loadingTxt:     {fontSize: 12, color: Colors.textTertiary},
  center:         {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm},
  emptyIcon:      {fontSize: 40},
  emptyTxt:       {fontSize: 13, color: Colors.textTertiary, textAlign: 'center'},

  epgWrap:        {flex: 1, flexDirection: 'row'},
  channelCol:     {width: CH_LABEL_W, borderRightWidth: 1, borderRightColor: Colors.surfaceBorder},
  channelLabel:   {height: CH_H, justifyContent: 'center', paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  channelLabelTxt:{fontSize: 11, color: Colors.textSecondary, fontWeight: '500'},

  hScroll:        {flex: 1},
  timeHeader:     {height: HEADER_H, backgroundColor: Colors.epgHeader, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder, position: 'relative'},
  timeLabel:      {position: 'absolute', top: 0, height: HEADER_H, justifyContent: 'center', paddingLeft: 4},
  timeLabelTxt:   {fontSize: 11, color: Colors.textTertiary, fontWeight: '500'},
  nowLineHeader:  {position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: Colors.accent},

  programRow:     {height: CH_H, position: 'relative', borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  program:        {position: 'absolute', top: 3, bottom: 3, backgroundColor: Colors.epgProgram, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 3, overflow: 'hidden'},
  programLive:    {backgroundColor: Colors.epgProgramActive, borderWidth: 1, borderColor: Colors.accent},
  progressBar:    {position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1},
  progressFill:   {height: '100%', backgroundColor: Colors.accent, borderRadius: 1},
  programTxt:     {fontSize: 11, color: Colors.textSecondary, fontWeight: '500'},
  programTxtLive: {color: Colors.textPrimary},
  programTime:    {fontSize: 9, color: Colors.textTertiary, marginTop: 1},
  nowLine:        {position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: Colors.accent, opacity: 0.7},

  popupOverlay:   {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'flex-end', zIndex: 100},
  popup:          {width: '100%', backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.xl, gap: Spacing.sm},
  popupTitle:     {fontSize: 16, fontWeight: '700', color: Colors.textPrimary},
  popupTime:      {fontSize: 12, color: Colors.accent},
  popupDesc:      {fontSize: 13, color: Colors.textSecondary, lineHeight: 20},
  popupClose:     {alignSelf: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full},
  popupCloseTxt:  {fontSize: 13, color: Colors.textSecondary, fontWeight: '600'},
});
