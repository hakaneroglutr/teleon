// src/screens/HomeScreen.tsx  (Faz 3 — gerçek veri)
import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TabNavProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useChannelStore} from '@store/channelStore';
import {useServerStore} from '@store/serverStore';
import {useChannelLoader} from '@hooks/useChannelLoader';
import {useEPG} from '@hooks/useEPG';
import {Channel} from '@store/types';
import {isLiveNow, formatHHMM} from '@utils/helpers';
import {DEMO_SERVER} from '@config/servers';

const {width} = Dimensions.get('window');
const FEATURED_H = width * 0.52;
const THUMB_W    = width * 0.36;

export default function HomeScreen() {
  const navigation     = useNavigation<TabNavProp>();
  const channels       = useChannelStore((s) => s.channels);
  const categories     = useChannelStore((s) => s.categories);
  const historyIds     = useChannelStore((s) => s.historyIds);
  const favouriteIds   = useChannelStore((s) => s.favouriteIds);
  const isLoading      = useChannelStore((s) => s.isLoading);
  const activeServer   = useServerStore((s) => s.activeServer);
  const servers        = useServerStore((s) => s.servers);
  const addServer      = useServerStore((s) => s.addServer);
  const {loadChannels} = useChannelLoader();
  const {getEPG}       = useEPG();

  const [refreshing, setRefreshing]     = useState(false);
  const [epgMap, setEpgMap]             = useState<Map<number, string>>(new Map());
  const [featuredIdx, setFeaturedIdx]   = useState(0);

  // ── İlk açılış: demo sunucu yoksa otomatik ekle ───────────────────────────
  useEffect(() => {
    if (servers.length === 0) {
      addServer(DEMO_SERVER);
    }
  }, []);

  // ── EPG — öne çıkan kanallar için ────────────────────────────────────────
  useEffect(() => {
    if (channels.length === 0) return;
    const top = channels.slice(0, 10);
    top.forEach(async (ch) => {
      const progs = await getEPG(ch.streamId, 2);
      const now   = progs.find((p) => isLiveNow(p.startTime, p.endTime));
      if (now) setEpgMap((m) => new Map(m).set(ch.streamId, now.title));
    });
  }, [channels.length]);

  // ── Featured banner otomatik döngüsü ─────────────────────────────────────
  useEffect(() => {
    if (channels.length < 5) return;
    const t = setInterval(() => {
      setFeaturedIdx((i) => (i + 1) % Math.min(channels.length, 8));
    }, 5000);
    return () => clearInterval(t);
  }, [channels.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChannels(true);
    setRefreshing(false);
  }, [loadChannels]);

  // ── Veri hazırlama ────────────────────────────────────────────────────────
  const featuredChannels = channels.slice(0, 8);
  const featuredCh       = featuredChannels[featuredIdx];

  const recentChannels = historyIds
    .slice(0, 15)
    .map((id) => channels.find((c) => c.streamId === id))
    .filter(Boolean) as Channel[];

  const favChannels = channels
    .filter((c) => favouriteIds.has(c.streamId))
    .slice(0, 12);

  // Kategori bazlı gruplar — her gruptan 6 kanal
  const categoryGroups = categories.slice(0, 4).map((cat) => ({
    category: cat,
    channels: channels.filter((c) => c.categoryId === cat.categoryId).slice(0, 8),
  })).filter((g) => g.channels.length > 0);

  const handleChannelPress = useCallback((ch: Channel) => {
    navigation.navigate('Player', {
      streamUrl: ch.streamUrl,
      title:     ch.name,
      streamId:  ch.streamId,
      posterUrl: ch.logoUrl || undefined,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Üst bar */}
      <View style={styles.topBar}>
        <View style={styles.logoWrap}>
          <View style={styles.logoMark}><Text style={styles.logoT}>T</Text></View>
          <View>
            <Text style={styles.appName}>TELEON</Text>
            {activeServer && <Text style={styles.serverName}>{activeServer.name}</Text>}
          </View>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => navigation.navigate('Search', {})}>
            <Text style={styles.topBtnTxt}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.topBtnTxt}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }>

        {/* ── Featured hero banner ───────────────────────────────────────── */}
        {isLoading && channels.length === 0 ? (
          <View style={styles.heroLoading}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.heroLoadingTxt}>Kanallar yükleniyor...</Text>
          </View>
        ) : featuredCh ? (
          <TouchableOpacity
            style={styles.hero}
            activeOpacity={0.9}
            onPress={() => handleChannelPress(featuredCh)}>
            {/* Arka plan logo büyük */}
            <View style={styles.heroBg}>
              {featuredCh.logoUrl ? (
                <Image
                  source={{uri: featuredCh.logoUrl}}
                  style={styles.heroBgImg}
                  blurRadius={12}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.heroDimmer} />
            </View>

            {/* Kanal logosu ortada */}
            <View style={styles.heroLogo}>
              {featuredCh.logoUrl ? (
                <Image source={{uri: featuredCh.logoUrl}} style={styles.heroLogoImg} resizeMode="contain" />
              ) : (
                <Text style={styles.heroLogoFallback}>{featuredCh.name.charAt(0)}</Text>
              )}
            </View>

            {/* Alt bilgi */}
            <View style={styles.heroInfo}>
              <View style={styles.heroLivePill}>
                <View style={styles.heroLiveDot} />
                <Text style={styles.heroLiveTxt}>CANLI</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={1}>{featuredCh.name}</Text>
              {epgMap.get(featuredCh.streamId) && (
                <Text style={styles.heroEpg} numberOfLines={1}>
                  ▶ {epgMap.get(featuredCh.streamId)}
                </Text>
              )}
              <View style={styles.heroPlayBtn}>
                <Text style={styles.heroPlayIcon}>▶</Text>
                <Text style={styles.heroPlayTxt}>İzle</Text>
              </View>
            </View>

            {/* Nokta indikatörleri */}
            <View style={styles.heroDots}>
              {featuredChannels.map((_, i) => (
                <View
                  key={i}
                  style={[styles.heroDot, i === featuredIdx && styles.heroDotActive]}
                />
              ))}
            </View>
          </TouchableOpacity>
        ) : null}

        {/* ── Hızlı erişim ─────────────────────────────────────────────────── */}
        <View style={styles.quickGrid}>
          {QUICK_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.quickCard, {borderTopColor: item.color}]}
              onPress={() => item.action(navigation)}>
              <Text style={styles.quickEmoji}>{item.emoji}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── İstatistik bant ───────────────────────────────────────────────── */}
        {channels.length > 0 && (
          <View style={styles.statsRow}>
            <StatChip value={channels.length}       label="Kanal"    color={Colors.accent} />
            <StatChip value={categories.length}     label="Kategori" color={Colors.gold} />
            <StatChip value={favChannels.length}    label="Favori"   color={Colors.success} />
            <StatChip value={recentChannels.length} label="Geçmiş"  color={Colors.info} />
          </View>
        )}

        {/* ── Son izlenenler ───────────────────────────────────────────────── */}
        {recentChannels.length > 0 && (
          <Section
            title="Son İzlenenler"
            onMore={() => navigation.navigate('Favorites')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {recentChannels.map((ch) => (
                <ChannelThumb
                  key={ch.streamId}
                  channel={ch}
                  epgTitle={epgMap.get(ch.streamId)}
                  onPress={() => handleChannelPress(ch)}
                />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* ── Favoriler ────────────────────────────────────────────────────── */}
        {favChannels.length > 0 && (
          <Section
            title="Favori Kanallar"
            onMore={() => navigation.navigate('Favorites')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {favChannels.map((ch) => (
                <ChannelThumb
                  key={ch.streamId}
                  channel={ch}
                  epgTitle={epgMap.get(ch.streamId)}
                  onPress={() => handleChannelPress(ch)}
                />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* ── Kategori grupları ─────────────────────────────────────────────── */}
        {categoryGroups.map(({category, channels: catChannels}) => (
          <Section
            key={category.categoryId}
            title={category.categoryName}
            onMore={() => navigation.navigate('LiveTV', {categoryId: category.categoryId})}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {catChannels.map((ch) => (
                <ChannelThumb
                  key={ch.streamId}
                  channel={ch}
                  epgTitle={epgMap.get(ch.streamId)}
                  onPress={() => handleChannelPress(ch)}
                />
              ))}
            </ScrollView>
          </Section>
        ))}

        {/* ── Sunucu yoksa onboarding ───────────────────────────────────────── */}
        {servers.length === 0 && !isLoading && (
          <TouchableOpacity
            style={styles.onboard}
            onPress={() => navigation.navigate('AddServer')}>
            <Text style={styles.onboardIcon}>📡</Text>
            <Text style={styles.onboardTitle}>Sunucu Ekle</Text>
            <Text style={styles.onboardSub}>
              Xtream, M3U veya Stalker Portal bağlantısı ekleyerek başla
            </Text>
            <View style={styles.onboardBtn}>
              <Text style={styles.onboardBtnTxt}>Başla →</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}

// ── Alt bileşenler ────────────────────────────────────────────────────────────
function Section({title, onMore, children}: {title: string; onMore?: () => void; children: React.ReactNode}) {
  return (
    <View style={sStyles.section}>
      <View style={sStyles.header}>
        <Text style={sStyles.title}>{title}</Text>
        {onMore && (
          <TouchableOpacity onPress={onMore}>
            <Text style={sStyles.more}>Tümü →</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

function ChannelThumb({channel, epgTitle, onPress}: {
  channel:   Channel;
  epgTitle?: string;
  onPress:   () => void;
}) {
  return (
    <TouchableOpacity style={tStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={tStyles.thumb}>
        {channel.logoUrl ? (
          <Image source={{uri: channel.logoUrl}} style={tStyles.logo} resizeMode="contain" />
        ) : (
          <View style={tStyles.fallback}>
            <Text style={tStyles.fallbackTxt}>{channel.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={tStyles.playOverlay}>
          <Text style={tStyles.playOverlayTxt}>▶</Text>
        </View>
      </View>
      <Text style={tStyles.name} numberOfLines={1}>{channel.name}</Text>
      {epgTitle && <Text style={tStyles.epg} numberOfLines={1}>{epgTitle}</Text>}
    </TouchableOpacity>
  );
}

function StatChip({value, label, color}: {value: number; label: string; color: string}) {
  return (
    <View style={[chipStyles.chip, {borderTopColor: color}]}>
      <Text style={[chipStyles.value, {color}]}>{value.toLocaleString()}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

// ── Quick items ───────────────────────────────────────────────────────────────
const QUICK_ITEMS = [
  {id: 'live',    emoji: '📺', label: 'Canlı TV',    color: Colors.accent,    action: (n: TabNavProp) => n.navigate('LiveTV', {})},
  {id: 'movies',  emoji: '🎬', label: 'Filmler',     color: Colors.gold,      action: (n: TabNavProp) => n.navigate('Movies', {})},
  {id: 'series',  emoji: '🎭', label: 'Diziler',     color: Colors.info,      action: (n: TabNavProp) => n.navigate('Series', {})},
  {id: 'epg',     emoji: '📅', label: 'TV Rehberi',  color: Colors.success,   action: (n: TabNavProp) => n.navigate('EPG')},
  {id: 'favs',    emoji: '⭐',  label: 'Favoriler',   color: Colors.warning,   action: (n: TabNavProp) => n.navigate('Favorites')},
  {id: 'settings',emoji: '⚙️', label: 'Ayarlar',     color: Colors.textTertiary, action: (n: TabNavProp) => n.navigate('Settings')},
] as const;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      {flex: 1, backgroundColor: Colors.background},
  topBar:         {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.sm},
  logoWrap:       {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  logoMark:       {width: 34, height: 34, backgroundColor: Colors.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  logoT:          {fontSize: 20, fontWeight: '900', color: Colors.textPrimary},
  appName:        {fontSize: 18, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 3},
  serverName:     {fontSize: 10, color: Colors.textTertiary, marginTop: 1},
  topActions:     {flexDirection: 'row', gap: Spacing.xs},
  topBtn:         {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  topBtnTxt:      {fontSize: 20},
  scroll:         {flex: 1},

  heroLoading:    {height: FEATURED_H, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm},
  heroLoadingTxt: {fontSize: 13, color: Colors.textTertiary},

  hero:           {height: FEATURED_H, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', position: 'relative'},
  heroBg:         {...StyleSheet.absoluteFillObject},
  heroBgImg:      {width: '100%', height: '100%', position: 'absolute'},
  heroDimmer:     {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,25,35,0.65)'},
  heroLogo:       {position: 'absolute', top: Spacing.xl, left: 0, right: 0, alignItems: 'center'},
  heroLogoImg:    {width: 90, height: 60},
  heroLogoFallback:{fontSize: 40, fontWeight: '800', color: Colors.textPrimary},
  heroInfo:       {position: 'absolute', bottom: Spacing.lg, left: Spacing.lg, right: Spacing.lg},
  heroLivePill:   {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4},
  heroLiveDot:    {width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.live},
  heroLiveTxt:    {fontSize: 10, fontWeight: '800', color: Colors.live, letterSpacing: 1},
  heroTitle:      {fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2},
  heroEpg:        {fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm},
  heroPlayBtn:    {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, alignSelf: 'flex-start', paddingHorizontal: Spacing.lg, paddingVertical: 7, borderRadius: Radius.full, gap: 6},
  heroPlayIcon:   {fontSize: 12, color: Colors.textPrimary},
  heroPlayTxt:    {fontSize: 13, fontWeight: '700', color: Colors.textPrimary},
  heroDots:       {position: 'absolute', bottom: Spacing.sm, right: Spacing.md, flexDirection: 'row', gap: 4},
  heroDot:        {width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.white30},
  heroDotActive:  {backgroundColor: Colors.accent, width: 14},

  quickGrid:      {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md},
  quickCard:      {width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderTopWidth: 2, borderColor: Colors.surfaceBorder},
  quickEmoji:     {fontSize: 22, marginBottom: 4},
  quickLabel:     {fontSize: 10, color: Colors.textSecondary, fontWeight: '500'},

  statsRow:       {flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg},

  hRow:           {paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: 4},

  onboard:        {marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder, borderStyle: 'dashed'},
  onboardIcon:    {fontSize: 36, marginBottom: Spacing.sm},
  onboardTitle:   {...Typography.h2, marginBottom: Spacing.xs},
  onboardSub:     {fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg},
  onboardBtn:     {backgroundColor: Colors.accent, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.full},
  onboardBtnTxt:  {color: Colors.textPrimary, fontWeight: '700', fontSize: 14},
});

const sStyles = StyleSheet.create({
  section: {marginBottom: Spacing.lg},
  header:  {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm},
  title:   {fontSize: 15, fontWeight: '700', color: Colors.textPrimary},
  more:    {fontSize: 12, color: Colors.accent},
});

const tStyles = StyleSheet.create({
  card:        {width: THUMB_W, marginRight: 0},
  thumb:       {width: THUMB_W, height: THUMB_W * 0.65, borderRadius: Radius.sm, backgroundColor: Colors.surfaceElevated, overflow: 'hidden', marginBottom: 5, position: 'relative'},
  logo:        {width: '100%', height: '100%'},
  fallback:    {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  fallbackTxt: {fontSize: 26, fontWeight: '700', color: Colors.textTertiary},
  playOverlay: {position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center'},
  playOverlayTxt:{fontSize: 8, color: Colors.textPrimary, marginLeft: 1},
  name:        {fontSize: 11, color: Colors.textPrimary, fontWeight: '500'},
  epg:         {fontSize: 10, color: Colors.textTertiary, marginTop: 1},
});

const chipStyles = StyleSheet.create({
  chip:  {flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center', borderTopWidth: 2},
  value: {fontSize: 16, fontWeight: '700'},
  label: {fontSize: 10, color: Colors.textTertiary, marginTop: 1},
});
