// src/screens/SeriesDetailScreen.tsx  (Faz 2)
import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SeriesDetailRouteProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useSeriesLoader} from '@hooks/useSeriesLoader';
import {TeleonDatabase} from '@native/TeleonDatabase';
import {Episode} from '@store/types';

const {width} = Dimensions.get('window');
const HERO_H  = width * 0.58;

export default function SeriesDetailScreen() {
  const navigation   = useNavigation();
  const route        = useRoute<SeriesDetailRouteProp>();
  const {seriesId, title, posterUrl} = route.params;

  const {isLoading, loadEpisodes} = useSeriesLoader();
  const [seasons,   setSeasons]   = useState<Record<string, Episode[]>>({});
  const [activeSeason, setActiveSeason] = useState<string>('1');
  const [lastWatched, setLastWatched]   = useState<{season: string; episode: string} | null>(null);

  useEffect(() => {
    async function load() {
      const result = await loadEpisodes(seriesId);
      setSeasons(result);
      // İlk sezon
      const first = Object.keys(result).sort((a, b) => Number(a) - Number(b))[0];
      if (first) setActiveSeason(first);
    }
    load();

    // Son izleme pozisyonunu al
    TeleonDatabase.getSeriesProgress(title)
      .then((p) => { if (p) setLastWatched(p); })
      .catch(() => {});
  }, [seriesId]);

  const handleEpisodePress = useCallback((ep: Episode) => {
    // İlerlemeyi kaydet
    TeleonDatabase.upsertSeriesProgress(title, String(ep.season), ep.title).catch(() => {});
    navigation.navigate('Player' as never, {
      streamUrl: ep.streamUrl,
      title:     `${title} — ${ep.title}`,
      engine:    'exo',
    } as never);
  }, [title, navigation]);

  const sortedSeasons = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));
  const episodesInSeason = seasons[activeSeason] ?? [];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backTxt}>←</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {posterUrl ? (
            <Image source={{uri: posterUrl}} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImg, {backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center'}]}>
              <Text style={{fontSize: 56}}>🎭</Text>
            </View>
          )}
          <LinearGradient colors={['transparent', Colors.background]} style={styles.heroGrad} />
        </View>

        <View style={styles.content}>
          <Text style={styles.seriesTitle}>{title}</Text>

          {/* Son izleme */}
          {lastWatched && (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                const ep = seasons[lastWatched.season]?.find((e) => e.title === lastWatched.episode);
                if (ep) handleEpisodePress(ep);
              }}>
              <Text style={styles.continueBtnIcon}>▶</Text>
              <Text style={styles.continueBtnTxt}>
                Devam Et — S{lastWatched.season} {lastWatched.episode}
              </Text>
            </TouchableOpacity>
          )}

          {/* Sezon seçici */}
          {isLoading ? (
            <ActivityIndicator color={Colors.accent} style={{marginVertical: Spacing.lg}} />
          ) : sortedSeasons.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonScroll}>
                {sortedSeasons.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.seasonTab, activeSeason === s && styles.seasonTabActive]}
                    onPress={() => setActiveSeason(s)}>
                    <Text style={[styles.seasonTabTxt, activeSeason === s && styles.seasonTabTxtActive]}>
                      Sezon {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Bölüm listesi */}
              <View style={styles.episodeList}>
                {episodesInSeason.map((ep) => (
                  <TouchableOpacity
                    key={ep.episodeId}
                    style={styles.episodeRow}
                    onPress={() => handleEpisodePress(ep)}
                    activeOpacity={0.75}>
                    <View style={styles.epNum}>
                      <Text style={styles.epNumTxt}>{ep.episodeNum}</Text>
                    </View>
                    <View style={styles.epInfo}>
                      <Text style={styles.epTitle} numberOfLines={1}>{ep.title}</Text>
                      {ep.duration && <Text style={styles.epDuration}>{ep.duration}</Text>}
                      {ep.plot && <Text style={styles.epPlot} numberOfLines={2}>{ep.plot}</Text>}
                    </View>
                    <View style={styles.epPlayBtn}>
                      <Text style={styles.epPlayIcon}>▶</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTxt}>Bölüm bilgisi yüklenemedi</Text>
            </View>
          )}
          <View style={{height: 40}} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         {flex: 1, backgroundColor: Colors.background},
  backBtn:           {position: 'absolute', top: Spacing.xl, left: Spacing.lg, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center'},
  backTxt:           {fontSize: 20, color: Colors.textPrimary},
  hero:              {width, height: HERO_H, position: 'relative'},
  heroImg:           {width: '100%', height: '100%'},
  heroGrad:          {position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_H * 0.6},
  content:           {paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm},
  seriesTitle:       {...Typography.displayMedium, marginBottom: Spacing.md},
  continueBtn:       {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: Spacing.md, gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.lg},
  continueBtnIcon:   {fontSize: 14, color: Colors.textPrimary},
  continueBtnTxt:    {fontSize: 14, fontWeight: '700', color: Colors.textPrimary},
  seasonScroll:      {gap: Spacing.xs, paddingBottom: Spacing.sm},
  seasonTab:         {paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder},
  seasonTabActive:   {backgroundColor: Colors.primary, borderColor: Colors.primary},
  seasonTabTxt:      {fontSize: 13, color: Colors.textSecondary, fontWeight: '500'},
  seasonTabTxtActive:{color: Colors.textPrimary, fontWeight: '700'},
  episodeList:       {marginTop: Spacing.sm},
  episodeRow:        {flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder, gap: Spacing.sm},
  epNum:             {width: 32, height: 32, borderRadius: Radius.xs, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center'},
  epNumTxt:          {fontSize: 13, fontWeight: '700', color: Colors.textTertiary},
  epInfo:            {flex: 1},
  epTitle:           {fontSize: 14, color: Colors.textPrimary, fontWeight: '500'},
  epDuration:        {fontSize: 11, color: Colors.textTertiary, marginTop: 1},
  epPlot:            {fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 16},
  epPlayBtn:         {width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  epPlayIcon:        {fontSize: 9, color: Colors.textPrimary, marginLeft: 1},
  center:            {alignItems: 'center', paddingVertical: Spacing.xl},
  emptyTxt:          {fontSize: 13, color: Colors.textTertiary},
});
