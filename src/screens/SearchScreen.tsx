// src/screens/SearchScreen.tsx  (Faz 2)
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Image, ActivityIndicator,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useChannelStore} from '@store/channelStore';
import {Channel} from '@store/types';

type ResultItem =
  | {kind: 'channel'; data: Channel}
  | {kind: 'header'; label: string};

export default function SearchScreen() {
  const navigation     = useNavigation();
  const route          = useRoute<any>();
  const channels       = useChannelStore((s) => s.channels);
  const inputRef       = useRef<TextInput>(null);

  const [query,   setQuery]   = useState(route.params?.initialQuery ?? '');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Arama
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const matched = channels
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 100);

      const items: ResultItem[] = [];
      if (matched.length > 0) {
        items.push({kind: 'header', label: `Canlı TV — ${matched.length} kanal`});
        matched.forEach((c) => items.push({kind: 'channel', data: c}));
      }
      if (items.length === 0) {
        items.push({kind: 'header', label: 'Sonuç bulunamadı'});
      }
      setResults(items);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, channels]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const renderItem = useCallback(({item}: {item: ResultItem}) => {
    if (item.kind === 'header') {
      return <Text style={styles.sectionHeader}>{item.label}</Text>;
    }
    const ch = item.data;
    return (
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => navigation.navigate('Player' as never, {
          streamUrl: ch.streamUrl, title: ch.name, streamId: ch.streamId,
        } as never)}
        activeOpacity={0.75}>
        <View style={styles.logoWrap}>
          {ch.logoUrl ? (
            <Image source={{uri: ch.logoUrl}} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoInitial}>{ch.name[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {highlightQuery(ch.name, query)}
          </Text>
          <Text style={styles.resultSub}>{ch.categoryName}</Text>
        </View>
        <View style={styles.playBtn}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation, query]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Kanal, film veya dizi ara..."
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sonuçlar */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : query.trim() === '' ? (
        <View style={styles.center}>
          <Text style={styles.hintIcon}>🔍</Text>
          <Text style={styles.hintTxt}>Aramak istediğinizi yazın</Text>
          {channels.length > 0 && (
            <Text style={styles.hintSub}>{channels.length} kanal indexlendi</Text>
          )}
        </View>
      ) : (
        <FlashList
          data={results}
          keyExtractor={(_, i) => String(i)}
          estimatedItemSize={64}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 32}}
        />
      )}
    </View>
  );
}

// Eşleşen kısmı vurgula
function highlightQuery(text: string, query: string): string {
  return text; // TODO: RN'de bold range ile
}

const styles = StyleSheet.create({
  container:      {flex: 1, backgroundColor: Colors.background},
  header:         {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.xl, paddingBottom: Spacing.sm, gap: Spacing.sm},
  backBtn:        {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  backTxt:        {fontSize: 22, color: Colors.textPrimary},
  inputWrap:      {flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder},
  searchIcon:     {fontSize: 13, marginRight: 6},
  input:          {flex: 1, height: 42, fontSize: 15, color: Colors.textPrimary},
  clearBtn:       {fontSize: 13, color: Colors.textTertiary, padding: 4},
  sectionHeader:  {fontSize: 11, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm},
  resultRow:      {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder, gap: Spacing.sm},
  logoWrap:       {width: 44, height: 44, borderRadius: Radius.xs, backgroundColor: Colors.surfaceElevated, overflow: 'hidden'},
  logo:           {width: '100%', height: '100%'},
  logoFallback:   {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  logoInitial:    {fontSize: 18, fontWeight: '700', color: Colors.textTertiary},
  info:           {flex: 1},
  resultTitle:    {fontSize: 14, color: Colors.textPrimary, fontWeight: '500'},
  resultSub:      {fontSize: 11, color: Colors.textTertiary, marginTop: 2},
  playBtn:        {width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center'},
  playIcon:       {fontSize: 9, color: Colors.textPrimary, marginLeft: 1},
  center:         {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm},
  hintIcon:       {fontSize: 36},
  hintTxt:        {fontSize: 14, color: Colors.textSecondary},
  hintSub:        {fontSize: 12, color: Colors.textTertiary},
});
