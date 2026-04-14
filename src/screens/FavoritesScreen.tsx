// src/screens/FavoritesScreen.tsx  (Faz 2)
import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert, Dimensions,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useChannelStore} from '@store/channelStore';
import {TeleonDatabase} from '@native/TeleonDatabase';
import {Channel} from '@store/types';

type Tab = 'live' | 'vod' | 'series';

export default function FavoritesScreen() {
  const navigation   = useNavigation();
  const channels     = useChannelStore((s) => s.channels);
  const favouriteIds = useChannelStore((s) => s.favouriteIds);
  const toggleFav    = useChannelStore((s) => s.toggleFavourite);
  const historyIds   = useChannelStore((s) => s.historyIds);

  const [tab,         setTab]         = useState<Tab>('live');
  const [vodFavs,     setVodFavs]     = useState<any[]>([]);
  const [seriesFavs,  setSeriesFavs]  = useState<any[]>([]);

  const favChannels = channels.filter((c) => favouriteIds.has(c.streamId));
  const histChannels = historyIds
    .slice(0, 50)
    .map((id) => channels.find((c) => c.streamId === id))
    .filter(Boolean) as Channel[];

  useEffect(() => {
    TeleonDatabase.getVodFavourites()
      .then((arr) => setVodFavs(arr.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean)))
      .catch(() => {});
    TeleonDatabase.getSeriesFavourites()
      .then((arr) => setSeriesFavs(arr.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean)))
      .catch(() => {});
  }, []);

  const handleRemoveLiveFav = useCallback((ch: Channel) => {
    Alert.alert('Favoriden Çıkar', `"${ch.name}" favorilerden çıkarılsın mı?`, [
      {text: 'İptal', style: 'cancel'},
      {text: 'Çıkar', style: 'destructive', onPress: () => toggleFav(ch.streamId)},
    ]);
  }, [toggleFav]);

  const renderLiveItem = useCallback(({item}: {item: Channel}) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('Player' as never, {streamUrl: item.streamUrl, title: item.name, streamId: item.streamId} as never)}
      onLongPress={() => handleRemoveLiveFav(item)}
      activeOpacity={0.75}>
      <View style={styles.logoWrap}>
        {item.logoUrl ? (
          <Image source={{uri: item.logoUrl}} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={styles.logoFallback}><Text style={styles.logoInitial}>{item.name[0]}</Text></View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.categoryName}</Text>
      </View>
      <Text style={styles.starIcon}>⭐</Text>
    </TouchableOpacity>
  ), [navigation, handleRemoveLiveFav]);

  const renderHistoryItem = useCallback(({item}: {item: Channel}) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('Player' as never, {streamUrl: item.streamUrl, title: item.name, streamId: item.streamId} as never)}
      activeOpacity={0.75}>
      <View style={styles.logoWrap}>
        {item.logoUrl ? (
          <Image source={{uri: item.logoUrl}} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={styles.logoFallback}><Text style={styles.logoInitial}>{item.name[0]}</Text></View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.categoryName}</Text>
      </View>
      <Text style={styles.histIcon}>🕐</Text>
    </TouchableOpacity>
  ), [navigation]);

  const currentData = tab === 'live'
    ? {favs: favChannels, hist: histChannels}
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoriler</Text>

      {/* Tab seçici */}
      <View style={styles.tabs}>
        {(['live', 'vod', 'series'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'live' ? '📺 Canlı' : t === 'vod' ? '🎬 Film' : '🎭 Dizi'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'live' && (
        <>
          {/* Favoriler */}
          {favChannels.length > 0 && (
            <>
              <SectionLabel label="Favori Kanallar" count={favChannels.length} />
              <FlashList
                data={favChannels}
                keyExtractor={(c) => `fav-${c.streamId}`}
                estimatedItemSize={64}
                renderItem={renderLiveItem}
                scrollEnabled={false}
              />
            </>
          )}

          {/* Geçmiş */}
          {histChannels.length > 0 && (
            <>
              <SectionLabel label="Son İzlenenler" count={histChannels.length} />
              <FlashList
                data={histChannels}
                keyExtractor={(c) => `hist-${c.streamId}`}
                estimatedItemSize={64}
                renderItem={renderHistoryItem}
              />
            </>
          )}

          {favChannels.length === 0 && histChannels.length === 0 && (
            <EmptyState icon="⭐" text="Henüz favori kanal yok.\nKanal listesinde ⭐ ile ekleyebilirsin." />
          )}
        </>
      )}

      {tab === 'vod' && (
        vodFavs.length > 0 ? (
          <>
            <SectionLabel label="Favori Filmler" count={vodFavs.length} />
            <FlashList
              data={vodFavs}
              keyExtractor={(_, i) => String(i)}
              estimatedItemSize={64}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => navigation.navigate('VodDetail' as never, {vodId: item.vodId, title: item.name} as never)}
                  activeOpacity={0.75}>
                  <View style={styles.logoWrap}>
                    {item.posterUrl ? (
                      <Image source={{uri: item.posterUrl}} style={styles.logo} resizeMode="cover" />
                    ) : (
                      <View style={styles.logoFallback}><Text style={{fontSize: 20}}>🎬</Text></View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                    {item.genre && <Text style={styles.itemSub}>{item.genre}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        ) : <EmptyState icon="🎬" text="Henüz favori film yok.\nFilm detayından ekleyebilirsin." />
      )}

      {tab === 'series' && (
        seriesFavs.length > 0 ? (
          <>
            <SectionLabel label="Favori Diziler" count={seriesFavs.length} />
            <FlashList
              data={seriesFavs}
              keyExtractor={(_, i) => String(i)}
              estimatedItemSize={64}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => navigation.navigate('SeriesDetail' as never, {seriesId: item.seriesId, title: item.name} as never)}
                  activeOpacity={0.75}>
                  <View style={styles.logoWrap}>
                    {item.posterUrl ? (
                      <Image source={{uri: item.posterUrl}} style={styles.logo} resizeMode="cover" />
                    ) : (
                      <View style={styles.logoFallback}><Text style={{fontSize: 20}}>🎭</Text></View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                    {item.genre && <Text style={styles.itemSub}>{item.genre}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        ) : <EmptyState icon="🎭" text="Henüz favori dizi yok.\nDizi detayından ekleyebilirsin." />
      )}
    </View>
  );
}

function SectionLabel({label, count}: {label: string; count: number}) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelTxt}>{label}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function EmptyState({icon, text}: {icon: string; text: string}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTxt}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        {flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg},
  title:            {...Typography.h1, paddingTop: Spacing.xl, marginBottom: Spacing.md},
  tabs:             {flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg},
  tabBtn:           {flex: 1, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder},
  tabBtnActive:     {backgroundColor: Colors.surfaceElevated, borderColor: Colors.accent},
  tabTxt:           {fontSize: 12, color: Colors.textSecondary, fontWeight: '500'},
  tabTxtActive:     {color: Colors.accent, fontWeight: '700'},
  sectionLabel:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs},
  sectionLabelTxt:  {fontSize: 12, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase'},
  sectionCount:     {fontSize: 12, color: Colors.textTertiary},
  row:              {flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder, gap: Spacing.sm},
  logoWrap:         {width: 44, height: 44, borderRadius: Radius.xs, backgroundColor: Colors.surfaceElevated, overflow: 'hidden'},
  logo:             {width: '100%', height: '100%'},
  logoFallback:     {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  logoInitial:      {fontSize: 18, fontWeight: '700', color: Colors.textTertiary},
  info:             {flex: 1},
  itemTitle:        {fontSize: 14, color: Colors.textPrimary, fontWeight: '500'},
  itemSub:          {fontSize: 11, color: Colors.textTertiary, marginTop: 2},
  starIcon:         {fontSize: 16},
  histIcon:         {fontSize: 16},
  empty:            {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 80},
  emptyIcon:        {fontSize: 44},
  emptyTxt:         {fontSize: 13, color: Colors.textTertiary, textAlign: 'center', lineHeight: 22},
});
