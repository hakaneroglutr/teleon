// src/screens/SeriesScreen.tsx  (Faz 2)
import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Dimensions,
  ScrollView, RefreshControl,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useNavigation} from '@react-navigation/native';
import {TabNavProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useSeriesLoader} from '@hooks/useSeriesLoader';
import {Series} from '@store/types';

const {width}  = Dimensions.get('window');
const COLS     = 3;
const CARD_W   = (width - Spacing.lg * 2 - Spacing.sm * (COLS - 1)) / COLS;
const CARD_H   = CARD_W * 1.45;

export default function SeriesScreen() {
  const navigation = useNavigation<TabNavProp>();
  const {categories, seriesList, isLoading, error, loadCategories, loadSeries} = useSeriesLoader();

  const [selectedCat, setSelectedCat] = useState('all');
  const [search,      setSearch]      = useState('');
  const [refreshing,  setRefreshing]  = useState(false);

  useEffect(() => {
    loadCategories();
    loadSeries();
  }, []);

  const handleCatSelect = useCallback(async (catId: string) => {
    setSelectedCat(catId);
    await loadSeries(catId === 'all' ? undefined : catId);
  }, [loadSeries]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSeries(selectedCat === 'all' ? undefined : selectedCat);
    setRefreshing(false);
  }, [loadSeries, selectedCat]);

  const filtered = search.trim()
    ? seriesList.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : seriesList;

  const renderItem = useCallback(({item}: {item: Series}) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('SeriesDetail', {
        seriesId: item.seriesId,
        title:    item.name,
        posterUrl: item.posterUrl || undefined,
      })}>
      <View style={styles.poster}>
        {item.posterUrl ? (
          <Image source={{uri: item.posterUrl}} style={styles.posterImg} resizeMode="cover" />
        ) : (
          <View style={styles.posterFallback}>
            <Text style={styles.posterIcon}>🎭</Text>
          </View>
        )}
        {item.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingTxt}>★ {parseFloat(item.rating).toFixed(1)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
      {item.genre && <Text style={styles.cardGenre} numberOfLines={1}>{item.genre.split(',')[0]}</Text>}
    </TouchableOpacity>
  ), [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diziler</Text>
        {seriesList.length > 0 && <Text style={styles.count}>{seriesList.length} dizi</Text>}
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Dizi ara..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
          style={styles.catScrollWrap}>
          {[{categoryId: 'all', categoryName: 'Tümü'}, ...categories].map((c) => (
            <TouchableOpacity
              key={c.categoryId}
              style={[styles.catChip, selectedCat === c.categoryId && styles.catChipActive]}
              onPress={() => handleCatSelect(c.categoryId)}>
              <Text style={[styles.catChipTxt, selectedCat === c.categoryId && styles.catChipTxtActive]}>
                {c.categoryName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading && seriesList.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingTxt}>Diziler yükleniyor...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🎭</Text>
          <Text style={styles.emptyTxt}>
            {seriesList.length === 0 ? 'Dizi bulunamadı' : 'Aramanızla eşleşen dizi yok'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => String(item.seriesId)}
          numColumns={COLS}
          estimatedItemSize={CARD_H + 48}
          renderItem={renderItem}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      {flex: 1, backgroundColor: Colors.background},
  header:         {flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xs},
  title:          {...Typography.h1},
  count:          {fontSize: 12, color: Colors.textTertiary},
  searchBar:      {flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder},
  searchIcon:     {fontSize: 13, marginRight: 6},
  searchInput:    {flex: 1, height: 40, fontSize: 14, color: Colors.textPrimary},
  clearBtn:       {fontSize: 13, color: Colors.textTertiary, padding: 4},
  catScrollWrap:  {maxHeight: 42, marginBottom: Spacing.sm},
  catScroll:      {paddingHorizontal: Spacing.lg, gap: Spacing.xs, alignItems: 'center'},
  catChip:        {paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder},
  catChipActive:  {backgroundColor: Colors.info, borderColor: Colors.info},
  catChipTxt:     {fontSize: 12, color: Colors.textSecondary, fontWeight: '500'},
  catChipTxtActive:{color: Colors.textPrimary, fontWeight: '700'},
  gridContent:    {paddingHorizontal: Spacing.lg, paddingBottom: 32},
  card:           {width: CARD_W, marginBottom: Spacing.md, marginRight: Spacing.sm},
  poster:         {width: CARD_W, height: CARD_H, borderRadius: Radius.sm, overflow: 'hidden', backgroundColor: Colors.surfaceElevated, marginBottom: 6, position: 'relative'},
  posterImg:      {width: '100%', height: '100%'},
  posterFallback: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  posterIcon:     {fontSize: 32},
  ratingBadge:    {position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4},
  ratingTxt:      {fontSize: 10, color: Colors.gold, fontWeight: '700'},
  cardTitle:      {fontSize: 12, color: Colors.textPrimary, lineHeight: 16, fontWeight: '500'},
  cardGenre:      {fontSize: 10, color: Colors.textTertiary, marginTop: 1},
  center:         {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm},
  loadingTxt:     {color: Colors.textTertiary, fontSize: 13},
  emptyIcon:      {fontSize: 36},
  emptyTxt:       {fontSize: 13, color: Colors.textTertiary, textAlign: 'center'},
});
