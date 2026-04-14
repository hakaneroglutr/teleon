// src/screens/AddServerScreen.tsx  (Faz 2 — kaydet + otomatik kanal yükle)
import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AddServerRouteProp} from '@navigation/types';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useServerStore} from '@store/serverStore';
import {useChannelLoader} from '@hooks/useChannelLoader';
import {XtreamService} from '@services/XtreamService';
import {M3UParser} from '@services/M3UParser';

type ServerType = 'xtream' | 'm3u' | 'stalker';

interface FormState {
  name:     string;
  host:     string;
  port:     string;
  username: string;
  password: string;
  mac:      string;
  m3uUrl:   string;
}

const EMPTY: FormState = {
  name: '', host: '', port: '8080',
  username: '', password: '', mac: '', m3uUrl: '',
};

export default function AddServerScreen() {
  const navigation   = useNavigation();
  const route        = useRoute<AddServerRouteProp>();
  const addServer    = useServerStore((s) => s.addServer);
  const setActive    = useServerStore((s) => s.setActive);
  const servers      = useServerStore((s) => s.servers);
  const {loadChannels} = useChannelLoader();

  const [type,    setType]    = useState<ServerType>('xtream');
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [testing, setTesting] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saveStep, setSaveStep] = useState<string>('');

  const update = (key: keyof FormState, val: string) =>
    setForm((f) => ({...f, [key]: val}));

  const validate = (): boolean => {
    if (type === 'xtream' && (!form.host || !form.username || !form.password)) {
      Alert.alert('Eksik Bilgi', 'Sunucu adresi, kullanıcı adı ve şifre zorunludur.'); return false;
    }
    if (type === 'm3u' && !form.m3uUrl) {
      Alert.alert('Eksik Bilgi', 'M3U URL zorunludur.'); return false;
    }
    if (type === 'stalker' && (!form.host || !form.mac)) {
      Alert.alert('Eksik Bilgi', 'Portal adresi ve MAC adresi zorunludur.'); return false;
    }
    return true;
  };

  // ── Test ──────────────────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!validate()) return;
    setTesting(true);
    try {
      if (type === 'xtream') {
        const svc  = new XtreamService({host: form.host, port: Number(form.port), username: form.username, password: form.password, serverId: 0});
        const auth = await svc.authenticate();
        Alert.alert('✓ Bağlantı Başarılı', `Kullanıcı: ${auth.user_info.username}\nSon kullanma: ${auth.user_info.exp_date}\nMax bağlantı: ${auth.user_info.max_connections}`);
      } else if (type === 'm3u') {
        const parser = new M3UParser(0);
        const result = await parser.parseFromUrl(form.m3uUrl);
        Alert.alert('✓ M3U Okundu', `${result.total} kanal, ${result.categories.length} kategori bulundu.`);
      } else {
        Alert.alert('Bilgi', 'Stalker bağlantı testi kaydedildikten sonra yapılır.');
      }
    } catch (err: any) {
      Alert.alert('✗ Bağlantı Hatası', err?.message ?? 'Bilinmeyen hata');
    } finally {
      setTesting(false);
    }
  };

  // ── Kaydet + Kanal Yükle ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Sunucuyu kaydet
      setSaveStep('Sunucu kaydediliyor...');
      addServer({
        name:     form.name || `Sunucu ${servers.length + 1}`,
        type,
        host:     form.host,
        port:     Number(form.port) || undefined,
        username: form.username || undefined,
        password: form.password || undefined,
        mac:      form.mac     || undefined,
        m3uUrl:   form.m3uUrl  || undefined,
        isActive: true,
      });

      // 2. Aktif sunucuyu set et (en son eklenen)
      // useChannelLoader sunucu değişimini otomatik algılar
      setSaveStep('Kanallar yükleniyor...');
      const result = await loadChannels(true);

      if (result.error) {
        Alert.alert(
          'Sunucu Eklendi',
          `Kanallar yüklenirken hata: ${result.error}\nAyarlar > Sunucular bölümünden yeniden deneyebilirsiniz.`,
          [{text: 'Tamam', onPress: () => navigation.navigate('Main' as never)}],
        );
      } else {
        Alert.alert(
          '✓ Bağlantı Kuruldu',
          `${result.channels} kanal, ${result.categories} kategori yüklendi.`,
          [{text: 'Harika!', onPress: () => navigation.navigate('Main' as never)}],
        );
      }
    } catch (err: any) {
      Alert.alert('Hata', err?.message ?? 'Bilinmeyen hata');
    } finally {
      setSaving(false);
      setSaveStep('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sunucu Ekle</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Tip seçici */}
        <Text style={styles.label}>Bağlantı Türü</Text>
        <View style={styles.typeRow}>
          {(['xtream', 'm3u', 'stalker'] as ServerType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => setType(t)}>
              <Text style={[styles.typeBtnTxt, type === t && styles.typeBtnTxtActive]}>
                {t === 'xtream' ? 'Xtream' : t === 'm3u' ? 'M3U/URL' : 'Stalker'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Sunucu Adı (opsiyonel)" value={form.name}     onChange={(v) => update('name', v)}     placeholder="Örn. Ev IPTV" />

        {type === 'xtream' && (<>
          <Field label="Sunucu Adresi *" value={form.host}     onChange={(v) => update('host', v)}     placeholder="ornek.com veya 1.2.3.4" />
          <Field label="Port"            value={form.port}     onChange={(v) => update('port', v)}     placeholder="8080" keyboardType="numeric" />
          <Field label="Kullanıcı Adı *" value={form.username} onChange={(v) => update('username', v)} placeholder="kullanici" />
          <Field label="Şifre *"         value={form.password} onChange={(v) => update('password', v)} placeholder="••••••••" secure />
        </>)}

        {type === 'm3u' && (
          <Field label="M3U URL *" value={form.m3uUrl} onChange={(v) => update('m3uUrl', v)} placeholder="http://ornek.com/playlist.m3u" keyboardType="url" />
        )}

        {type === 'stalker' && (<>
          <Field label="Portal Adresi *" value={form.host} onChange={(v) => update('host', v)} placeholder="http://portal.ornek.com" keyboardType="url" />
          <Field label="MAC Adresi *"    value={form.mac}  onChange={(v) => update('mac', v)}  placeholder="00:1A:79:XX:XX:XX" autoCapitalize="characters" />
        </>)}

        {/* Info kutusu */}
        <View style={[styles.infoBox, {borderLeftColor: type === 'xtream' ? Colors.accent : type === 'm3u' ? Colors.gold : Colors.info}]}>
          <Text style={styles.infoTxt}>
            {type === 'xtream'
              ? '💡 Xtream Codes API — En yaygın protokol. Sağlayıcınızdan kullanıcı adı ve şifre alın.'
              : type === 'm3u'
              ? '💡 M3U/M3U+ — Playlist URL. HTTP ve HTTPS desteklenir. 100k+ kanal desteği mevcut.'
              : '💡 Stalker Portal — STB emülasyonu. Portal URL ve cihaz MAC adresinizi girin.'}
          </Text>
        </View>

        {/* Butonlar */}
        <TouchableOpacity
          style={[styles.testBtn, testing && styles.dimmed]}
          onPress={handleTest}
          disabled={testing || saving}>
          {testing
            ? <ActivityIndicator color={Colors.accent} size="small" />
            : <Text style={styles.testBtnTxt}>Bağlantıyı Test Et</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (saving) && styles.dimmed]}
          onPress={handleSave}
          disabled={saving || testing}>
          {saving ? (
            <View style={styles.saveLoading}>
              <ActivityIndicator color={Colors.textPrimary} size="small" />
              <Text style={styles.saveBtnTxt}>{saveStep}</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnTxt}>Kaydet ve Bağlan</Text>
          )}
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

function Field({label, value, onChange, placeholder, secure, keyboardType, autoCapitalize}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secure?: boolean; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    {flex: 1, backgroundColor: Colors.background},
  header:       {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  backBtn:      {width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center'},
  backTxt:      {fontSize: 22, color: Colors.textPrimary},
  headerTitle:  {...Typography.h2, flex: 1, textAlign: 'center'},
  scroll:       {flex: 1},
  scrollContent:{padding: Spacing.lg},
  typeRow:      {flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg},
  typeBtn:      {flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center'},
  typeBtnActive:{backgroundColor: Colors.accent, borderColor: Colors.accent},
  typeBtnTxt:   {fontSize: 13, color: Colors.textSecondary, fontWeight: '500'},
  typeBtnTxtActive:{color: Colors.textPrimary, fontWeight: '700'},
  fieldWrap:    {marginBottom: Spacing.md},
  label:        {fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500', letterSpacing: 0.3},
  input:        {backgroundColor: Colors.surface, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: 14, color: Colors.textPrimary, height: 46},
  infoBox:      {backgroundColor: Colors.infoSurface, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3},
  infoTxt:      {fontSize: 13, color: Colors.textSecondary, lineHeight: 20},
  testBtn:      {borderWidth: 1, borderColor: Colors.accent, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm},
  testBtnTxt:   {color: Colors.accent, fontWeight: '600', fontSize: 15},
  saveBtn:      {backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: Spacing.md + 2, alignItems: 'center'},
  saveLoading:  {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  saveBtnTxt:   {color: Colors.textPrimary, fontWeight: '700', fontSize: 15},
  dimmed:       {opacity: 0.5},
});
