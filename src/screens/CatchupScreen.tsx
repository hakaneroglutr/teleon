// src/screens/CatchupScreen.tsx  (Faz 3)
// Catch-up TV — geçmiş yayınları izleme
import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useServerStore} from '@store/serverStore';
import {XtreamService} from '@services/XtreamService';
import {EPGProgram} from '@store/types';
import {formatHHMM, formatDateShort, isLiveNow, epgProgress} from '@utils/helpers';

const {width} = Dimensions.get('window');

// Xtream catch-up URL formatı
function buildCatchupUrl(
  host: string, port: number,
  user: string, pass: string,
  streamId: number,
  startUnix: number,
  duration: number,
): string {
  return `http://${host}:${port}/streaming/timeshift.php`
    + `?username=${user}&password=${pass}`
    + `&stream=${streamId}`
    + `&start=${new Date(startUnix).toISOString().replace('T', ' ').slice(0, 16)}`
    + `&duration=${Math.round(duration / 60)}`;
}

export default function CatchupScreen() {
  const navigation   = useNavigation();
  const route        = useRoute<any>();
  const {streamId, channelName} = route.params ?? {};
  const activeServer = useServerStore((s) => s.activeServer);

  const [days,     setDays]     = useState<Date[]>([]);
  const [selDay,   setSelDay]   = useState(0);
  const [programs, setPrograms] = useState<EPGProgram[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Son 7 günü hazırla
  useEffect(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d);
    }
    setDays(arr);
  }, []);

  // Seçilen gün için EPG yükle
  useEffect(() => {
    if (!activeServer || !streamId || days.length === 0) return;
    loadEPG(days[selDay]);
  }, [selDay, days.length, streamId]);

  const loadEPG = useCallback(async (day: Date) => {
    if (!activeServer || activeServer.type !== 'xtream') return;
    setLoading(true);
    setError(null);
    try {
      const svc = new XtreamService({
        host:     activeServer.host,
        port:     activeServer.port ?? 8080,
        username: activeServer.username ?? '',
        password: activeServer.password ?? '',
        serverId: activeServer.id,
      });
      const all = await svc.getFullEPG(streamId);
      // Seçili güne ait programları filtrele
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const filtered = all.filter(
        (p) => p.startTime >= dayStart.getTime() && p.startTime <= dayEnd.getTime()
      );
      setPrograms(filtered);
    } catch (e: any) {
      setError(e?.message ?? 'EPG yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [activeServer, streamId]);

  const handlePlayCatchup = useCallback((prog: EPGProgram) => {
    if (!activeServer || activeServer.type !== 'xtream') return;
    const dur = prog.endTime - prog.startTime;
    const url = buildCatchupUrl(
      activeServer.host,
      activeServer.port ?? 8080,
      activeServer.username ?? '',
      activeServer.password ?? '',
      streamId,
      prog.startTime,
      dur,
    );
    navigation.navigate('Player' as never, {
      streamUrl: url,
      title:     `${channelName} — ${prog.title}`,
      engine:    'vlc',
    } as never);
  }, [activeServer, streamId, channelName, navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Catch-up TV</Text>
          {channelName && <Text style={styles.channelName}>{channelName}</Text>}
        </View>
      </View>

      {/* Gün seçici */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayScroll}>
        {days.map((day, i) => {
          const isToday = i === 0;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.dayChip, selDay === i && styles.dayChipActive]}
              onPress={() => setSelDay(i)}>
              <Text style={[styles.dayChipMain, selDay === i && styles.dayChipMainActive]}>
                {isToday ? 'Bugün' : formatDateShort(day.getTime())}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Program listesi */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingTxt}>Program rehberi yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => days.length > 0 && loadEPG(days[selDay])}>
            <Text style={styles.retryTxt}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : programs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTxt}>Bu gün için program bilgisi yok</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {programs.map((prog) => {
            const live     = isLiveNow(prog.startTime, prog.endTime);
            const progress = live ? epgProgress(prog.startTime, prog.endTime) : 0;
            const durationMin = Math.round((prog.endTime - prog.startTime) / 60_000);
            const isPast   = prog.endTime < Date.now();

            return (
              <TouchableOpacity
                key={prog.id}
                style={[styles.progRow, live && styles.progRowLive]}
                onPress={() => isPast || live ? handlePlayCatchup(prog) : null}
                activeOpacity={isPast || live ? 0.75 : 1}>

                {/* Zaman */}
                <View style={styles.progTime}>
                  <Text style={[styles.progTimeTxt, live && styles.progTimeLive]}>
                    {formatHHMM(prog.startTime)}
                  </Text>
                  <Text style={styles.progDur}>{durationMin}dk</Text>
                </View>

                {/* İçerik */}
                <View style={styles.progBody}>
                  <View style={styles.progTitleRow}>
                    {live && (
                      <View style={styles.liveTag}>
                        <Text style={styles.liveTxt}>● CANLI</Text>
                      </View>
                    )}
                    <Text style={[styles.progTitle, !isPast && !live && styles.progTitleFuture]} numberOfLines={1}>
                      {prog.title}
                    </Text>
                  </View>
                  {prog.description && (
                    <Text style={styles.progDesc} numberOfLines={1}>{prog.description}</Text>
                  )}
                  {/* Canlı yayın ilerleme çubuğu */}
                  {live && (
                    <View style={styles.progBar}>
                      <View style={[styles.progBarFill, {width: `${progress * 100}%`}]} />
                    </View>
                  )}
                </View>

                {/* Oynat ikonu */}
                {(isPast || live) && (
                  <View style={[styles.playBtn, live && styles.playBtnLive]}>
                    <Text style={styles.playBtnTxt}>▶</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{height: 32}} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        {flex: 1, backgroundColor: Colors.background},
  header:           {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.sm},
  backBtn:          {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  backTxt:          {fontSize: 22, color: Colors.textPrimary},
  title:            {...Typography.h2},
  channelName:      {fontSize: 12, color: Colors.accent, marginTop: 1},
  dayScroll:        {paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingVertical: Spacing.sm},
  dayChip:          {paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder},
  dayChipActive:    {backgroundColor: Colors.accent, borderColor: Colors.accent},
  dayChipMain:      {fontSize: 12, color: Colors.textSecondary, fontWeight: '600'},
  dayChipMainActive:{color: Colors.textPrimary},
  center:           {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm},
  loadingTxt:       {fontSize: 13, color: Colors.textTertiary},
  errorIcon:        {fontSize: 32},
  errorTxt:         {fontSize: 13, color: Colors.textTertiary, textAlign: 'center'},
  retryBtn:         {backgroundColor: Colors.accent, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, marginTop: Spacing.sm},
  retryTxt:         {color: Colors.textPrimary, fontWeight: '700', fontSize: 13},
  emptyIcon:        {fontSize: 36},
  emptyTxt:         {fontSize: 13, color: Colors.textTertiary},
  list:             {flex: 1},
  listContent:      {paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs},
  progRow:          {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder, gap: Spacing.sm},
  progRowLive:      {backgroundColor: Colors.infoSurface, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, borderBottomColor: Colors.info},
  progTime:         {width: 50, paddingTop: 2, alignItems: 'flex-end'},
  progTimeTxt:      {fontSize: 13, color: Colors.textSecondary, fontWeight: '600'},
  progTimeLive:     {color: Colors.accent},
  progDur:          {fontSize: 10, color: Colors.textTertiary, marginTop: 1},
  progBody:         {flex: 1},
  progTitleRow:     {flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2},
  liveTag:          {backgroundColor: Colors.liveSurface, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3},
  liveTxt:          {fontSize: 9, color: Colors.live, fontWeight: '800'},
  progTitle:        {fontSize: 13, color: Colors.textPrimary, fontWeight: '500', flex: 1},
  progTitleFuture:  {color: Colors.textTertiary},
  progDesc:         {fontSize: 11, color: Colors.textTertiary, lineHeight: 15},
  progBar:          {height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, marginTop: 4},
  progBarFill:      {height: '100%', backgroundColor: Colors.accent, borderRadius: 1},
  playBtn:          {width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginTop: 2},
  playBtnLive:      {backgroundColor: Colors.accent},
  playBtnTxt:       {fontSize: 9, color: Colors.textPrimary, marginLeft: 1},
});
