// src/screens/VodDetailScreen.tsx  (Faz 2)
import React, {useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {VodDetailRouteProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useServerStore} from '@store/serverStore';
import {XtreamService} from '@services/XtreamService';
import {VodItem} from '@store/types';

const {width} = Dimensions.get('window');
const HERO_H  = width * 0.62;

export default function VodDetailScreen() {
  const navigation   = useNavigation();
  const route        = useRoute<VodDetailRouteProp>();
  const {vodId, title, posterUrl} = route.params;
  const activeServer = useServerStore((s) => s.activeServer);

  const [info,    setInfo]    = useState<Partial<VodItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    async function load() {
      if (!activeServer || activeServer.type !== 'xtream') {
        setLoading(false);
        return;
      }
      const svc = new XtreamService({
        host: activeServer.host, port: activeServer.port ?? 8080,
        username: activeServer.username ?? '', password: activeServer.password ?? '',
        serverId: activeServer.id,
      });
      try {
        const detail = await svc.getVodInfo(vodId);
        setInfo(detail);
        setStreamUrl(svc.buildVodUrl(vodId));
      } catch { /* zaten posterUrl var */ }
      finally { setLoading(false); }
    }
    load();
  }, [vodId, activeServer]);

  const heroImage = info?.posterUrl || posterUrl;

  return (
    <View style={styles.container}>
      {/* Geri butonu */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backTxt}>←</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {heroImage ? (
            <Image source={{uri: heroImage}} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImg, {backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center'}]}>
              <Text style={{fontSize: 56}}>🎬</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.heroGrad}
          />
        </View>

        {/* Detay */}
        <View style={styles.content}>
          <Text style={styles.filmTitle}>{title}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            {info?.releaseDate && <MetaBadge txt={info.releaseDate.slice(0, 4)} />}
            {info?.duration    && <MetaBadge txt={info.duration} />}
            {info?.genre       && <MetaBadge txt={info.genre.split(',')[0]} />}
            {info?.rating && parseFloat(info.rating) > 0 && (
              <View style={[styles.metaBadge, {backgroundColor: Colors.warningSurface}]}>
                <Text style={[styles.metaTxt, {color: Colors.gold}]}>★ {parseFloat(info.rating).toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Play butonu */}
          {streamUrl ? (
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => navigation.navigate('Player' as never, {streamUrl, title, engine: 'exo'} as never)}>
              <Text style={styles.playBtnIcon}>▶</Text>
              <Text style={styles.playBtnTxt}>Oynat</Text>
            </TouchableOpacity>
          ) : loading ? (
            <View style={styles.playBtnLoading}>
              <ActivityIndicator color={Colors.textPrimary} size="small" />
              <Text style={styles.playBtnTxt}>Yükleniyor...</Text>
            </View>
          ) : null}

          {/* Özet */}
          {loading ? (
            <ActivityIndicator color={Colors.accent} style={{marginTop: Spacing.lg}} />
          ) : (
            <>
              {info?.plot && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Özet</Text>
                  <Text style={styles.plot}>{info.plot}</Text>
                </View>
              )}
              {info?.cast && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Oyuncular</Text>
                  <Text style={styles.meta}>{info.cast}</Text>
                </View>
              )}
              {info?.director && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Yönetmen</Text>
                  <Text style={styles.meta}>{info.director}</Text>
                </View>
              )}
            </>
          )}
          <View style={{height: 40}} />
        </View>
      </ScrollView>
    </View>
  );
}

function MetaBadge({txt}: {txt: string}) {
  return (
    <View style={styles.metaBadge}>
      <Text style={styles.metaTxt}>{txt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     {flex: 1, backgroundColor: Colors.background},
  backBtn:       {position: 'absolute', top: Spacing.xl, left: Spacing.lg, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center'},
  backTxt:       {fontSize: 20, color: Colors.textPrimary},
  hero:          {width, height: HERO_H, position: 'relative'},
  heroImg:       {width: '100%', height: '100%'},
  heroGrad:      {position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_H * 0.55},
  content:       {paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm},
  filmTitle:     {...Typography.displayMedium, marginBottom: Spacing.sm},
  metaRow:       {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.lg},
  metaBadge:     {backgroundColor: Colors.surface, borderRadius: Radius.xs, paddingHorizontal: 8, paddingVertical: 3},
  metaTxt:       {fontSize: 12, color: Colors.textSecondary, fontWeight: '500'},
  playBtn:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.xl},
  playBtnLoading:{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingVertical: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.xl},
  playBtnIcon:   {fontSize: 16, color: Colors.textPrimary},
  playBtnTxt:    {fontSize: 16, fontWeight: '700', color: Colors.textPrimary},
  section:       {marginBottom: Spacing.lg},
  sectionTitle:  {fontSize: 12, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.xs},
  plot:          {fontSize: 14, color: Colors.textSecondary, lineHeight: 22},
  meta:          {fontSize: 13, color: Colors.textSecondary, lineHeight: 20},
});
