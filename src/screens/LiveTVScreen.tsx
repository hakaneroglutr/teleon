// src/screens/LiveTVScreen.tsx  (Faz 2)
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useNavigation} from '@react-navigation/native';
import {TabNavProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useChannelStore} from '@store/channelStore';
import {useChannelLoader} from '@hooks/useChannelLoader';
import {useEPG} from '@hooks/useEPG';
import {Channel} from '@store/types';
import {isLiveNow} from '@utils/helpers';

const CAT_W = 112;

export default function LiveTVScreen() {
  const navigation       = useNavigation<TabNavProp>();
  const isLoading        = useChannelStore((s) => s.isLoading);
  const channels         = useChannelStore((s) => s.channels);
  const categories       = useChannelStore((s) => s.categories);
  const favouriteIds     = useChannelStore((s) => s.favouriteIds);
  const selectedCategory = useChannelStore((s) => s.selectedCategory);
  const setCategory      = useChannelStore((s) => s.setCategory);
  const filteredChannels = useChannelStore((s) => s.filteredChannels);
  const setSearch        = useChannelStore((s) => s.setSearch);

  const {loadChannels}   = useChannelLoader();
  const {getEPG}         = useEPG();

  const [search,    setSearchLocal] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // streamId → current program title
  const [epgMap, setEpgMap]         = useState<Map<number, string>>(new Map());

  const visible = filteredChannels();

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChannels(true);
    setRefreshing(false);
  }, [loadChannels]);

  // ── EPG — ilk görünen 20 kanal için kısa EPG çek ─────────────────────────
  useEffect(() => {
    const top20 = visible.slice(0, 20);
    top20.forEach(async (ch) => {
      if (epgMap.has(ch.streamId)) return;
      const programs = await getEPG(ch.streamId, 2);
      const nowProg  = programs.find((p) => isLiveNow(p.startTime, p.endTime));
      if (nowProg) {
        setEpgMap((m) => new Map(m).set(ch.streamId, nowProg.title));
      }
    });
  }, [visible.length, selectedCategory]);

  // ── Arama ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearchLocal(q);
    setSearch(q);
  }, [setSearch]);

  // ── Kanal tıklaması ───────────────────────────────────────────────────────
  const handleChannelPress = useCallback((ch: Channel) => {
    navigation.navigate('Player', {
      streamUrl: ch.streamUrl,
      title:     ch.name,
      streamId:  ch.streamId,
      posterUrl: ch.logoUrl || undefined,
    });
  }, [navigation]);

  // ── Kategori listesi ──────────────────────────────────────────────────────
  const allCats = useMemo(() => [
    {categoryId: 'all',       categoryName: 'Tümü'},
    {categoryId: 'favourites',categoryName: '⭐ Favori'},
    ...categories,
  ], [categories]);

  const renderChannel = useCallback(({item}: {item: Channel}) => (
    <ChannelRow
      channel={item}
      isFav={favouriteIds.has(item.streamId)}
      epgTitle={epgMap.get(item.streamId)}
      onPress={() => handleChannelPress(item)}
    />
  ), [favouriteIds, epgMap, handleChannelPress]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Canlı TV</Text>
          {!isLoading && channels.length > 0 && (
            <Text style={styles.channelCount}>{channels.length} kanal</Text>
          )}
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>CANLI</Text>
        </View>
      </View>

      {/* Arama */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Kanal ara..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        {/* Kategori yan sidebar */}
        <FlashList
          data={allCats}
          keyExtractor={(c) => c.categoryId}
          estimatedItemSize={46}
          renderItem={({item}) => {
            const active = selectedCategory === item.categoryId;
            return (
              <TouchableOpacity
                style={[styles.catItem, active && styles.catItemActive]}
                onPress={() => setCategory(item.categoryId)}>
                <Text style={[styles.catLabel, active && styles.catLabelActive]} numberOfLines={2}>
                  {item.categoryName}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.catList}
          contentContainerStyle={{paddingVertical: 4}}
        />

        {/* Kanal listesi */}
        {isLoading && channels.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingTxt}>Kanallar yükleniyor...</Text>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTxt}>
              {channels.length === 0
                ? 'Ayarlar → Sunucu Ekle ile bağlan'
                : 'Kanal bulunamadı'}
            </Text>
            {channels.length === 0 && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddServer')}>
                <Text style={styles.addBtnTxt}>Sunucu Ekle →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlashList
            data={visible}
            keyExtractor={(c) => String(c.streamId)}
            estimatedItemSize={66}
            renderItem={renderChannel}
            style={styles.list}
            contentContainerStyle={{paddingVertical: 4}}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.accent}
                colors={[Colors.accent]}
              />
            }
            ListHeaderComponent={
              <Text style={styles.resultCount}>
                {visible.length} kanal{search ? ` — "${search}"` : ''}
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

// ── Channel Row ───────────────────────────────────────────────────────────────
function ChannelRow({channel, isFav, epgTitle, onPress}: {
  channel:  Channel;
  isFav:    boolean;
  epgTitle?: string;
  onPress:  () => void;
}) {
  return (
    <TouchableOpacity style={styles.chRow} onPress={onPress} activeOpacity={0.72}>
      {/* Logo */}
      <View style={styles.chLogoWrap}>
        {channel.logoUrl ? (
          <Image source={{uri: channel.logoUrl}} style={styles.chLogo} resizeMode="contain" />
        ) : (
          <View style={styles.chLogoFallback}>
            <Text style={styles.chLogoInitial}>
              {channel.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.chInfo}>
        <View style={styles.chNameRow}>
          {channel.num > 0 && <Text style={styles.chNum}>{channel.num}  </Text>}
          <Text style={styles.chName} numberOfLines={1}>{channel.name}</Text>
          {isFav && <Text style={{fontSize: 10, marginLeft: 4}}>⭐</Text>}
        </View>
        {epgTitle
          ? <Text style={styles.chEpg} numberOfLines={1}>▶ {epgTitle}</Text>
          : <Text style={styles.chCat} numberOfLines={1}>{channel.categoryName}</Text>
        }
      </View>

      {/* Play button */}
      <View style={styles.playBtn}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     {flex: 1, backgroundColor: Colors.background},

  header:        {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xs},
  headerLeft:    {gap: 2},
  headerTitle:   {...Typography.h1},
  channelCount:  {fontSize: 11, color: Colors.textTertiary},
  livePill:      {flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.liveSurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.xs, gap: 4},
  liveDot:       {width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.live},
  liveText:      {fontSize: 10, fontWeight: '700', color: Colors.live, letterSpacing: 0.8},

  searchBar:     {flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder},
  searchIcon:    {fontSize: 13, marginRight: 6},
  searchInput:   {flex: 1, height: 40, fontSize: 14, color: Colors.textPrimary},
  clearBtn:      {fontSize: 13, color: Colors.textTertiary, padding: 4},

  body:          {flex: 1, flexDirection: 'row'},

  catList:       {width: CAT_W, borderRightWidth: 1, borderRightColor: Colors.surfaceBorder},
  catItem:       {paddingHorizontal: Spacing.sm, paddingVertical: 10},
  catItemActive: {backgroundColor: Colors.surfaceElevated, borderLeftWidth: 2, borderLeftColor: Colors.accent},
  catLabel:      {fontSize: 11, color: Colors.textTertiary, lineHeight: 15},
  catLabelActive:{color: Colors.accent, fontWeight: '600'},

  list:          {flex: 1},
  resultCount:   {fontSize: 11, color: Colors.textTertiary, paddingHorizontal: Spacing.md, paddingVertical: 4},

  center:        {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl},
  loadingTxt:    {color: Colors.textTertiary, fontSize: 13},
  emptyIcon:     {fontSize: 36},
  emptyTxt:      {fontSize: 13, color: Colors.textTertiary, textAlign: 'center'},
  addBtn:        {marginTop: Spacing.sm, backgroundColor: Colors.accent, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full},
  addBtnTxt:     {color: Colors.textPrimary, fontWeight: '700', fontSize: 13},

  chRow:         {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  chLogoWrap:    {width: 44, height: 44, borderRadius: Radius.xs, backgroundColor: Colors.surfaceElevated, overflow: 'hidden', marginRight: Spacing.sm},
  chLogo:        {width: '100%', height: '100%'},
  chLogoFallback:{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  chLogoInitial: {fontSize: 18, fontWeight: '700', color: Colors.textTertiary},
  chInfo:        {flex: 1},
  chNameRow:     {flexDirection: 'row', alignItems: 'center'},
  chNum:         {fontSize: 11, color: Colors.textTertiary},
  chName:        {fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flexShrink: 1},
  chEpg:         {fontSize: 11, color: Colors.accent, marginTop: 2},
  chCat:         {fontSize: 11, color: Colors.textTertiary, marginTop: 2},
  playBtn:       {width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm},
  playIcon:      {fontSize: 9, color: Colors.textPrimary, marginLeft: 1},
});
