// src/screens/SettingsScreen.tsx
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '@theme/colors';
import {Typography} from '@theme/typography';
import {Spacing, Radius} from '@theme/spacing';
import {useSettingsStore} from '@store/settingsStore';
import {useServerStore} from '@store/serverStore';
import {useChannelStore} from '@store/channelStore';

export default function SettingsScreen() {
  const navigation   = useNavigation();
  const settings     = useSettingsStore((s) => s.settings);
  const update       = useSettingsStore((s) => s.update);
  const servers      = useServerStore((s) => s.servers);
  const activeServer = useServerStore((s) => s.activeServer);
  const setActive    = useServerStore((s) => s.setActive);
  const removeServer = useServerStore((s) => s.removeServer);
  const clearHistory = useChannelStore((s) => s.clearHistory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Sunucular */}
        <Section title="Sunucular">
          {servers.map((srv) => (
            <View key={srv.id} style={styles.serverRow}>
              <View style={styles.serverInfo}>
                <Text style={styles.serverName}>{srv.name}</Text>
                <Text style={styles.serverType}>
                  {srv.type.toUpperCase()} {srv.host && `· ${srv.host}`}
                </Text>
              </View>
              <View style={styles.serverActions}>
                {activeServer?.id !== srv.id && (
                  <TouchableOpacity
                    style={styles.activateBtn}
                    onPress={() => setActive(srv.id)}>
                    <Text style={styles.activateTxt}>Aktif Et</Text>
                  </TouchableOpacity>
                )}
                {activeServer?.id === srv.id && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTxt}>● Aktif</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Sil', `"${srv.name}" sunucusunu silmek istiyor musun?`, [
                      {text: 'İptal', style: 'cancel'},
                      {text: 'Sil', style: 'destructive', onPress: () => removeServer(srv.id)},
                    ])
                  }>
                  <Text style={styles.deleteBtn}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addServerBtn}
            onPress={() => navigation.navigate('AddServer' as never)}>
            <Text style={styles.addServerTxt}>+ Yeni Sunucu Ekle</Text>
          </TouchableOpacity>
        </Section>

        {/* Oynatıcı */}
        <Section title="Oynatıcı">
          <RowSelect
            label="Varsayılan Motor"
            value={settings.playerEngine}
            options={[
              {label: 'Otomatik', value: 'auto'},
              {label: 'VLC',      value: 'vlc'},
              {label: 'ExoPlayer', value: 'exo'},
            ]}
            onChange={(v) => update({playerEngine: v as any})}
          />
          <RowSwitch
            label="Donanım Hızlandırma"
            sub="GPU tabanlı video dekodlama"
            value={settings.hwDecoding}
            onChange={(v) => update({hwDecoding: v})}
          />
          <RowSwitch
            label="Hata Sonrası Yeniden Bağlan"
            value={settings.reconnectOnError}
            onChange={(v) => update({reconnectOnError: v})}
          />
          <RowSwitch
            label="Sonraki Bölüm Otomatik Oynat"
            value={settings.autoPlayNext}
            onChange={(v) => update({autoPlayNext: v})}
          />
          <RowSwitch
            label="Ekranı Açık Tut"
            sub="Oynatma sırasında ekran kapanmaz"
            value={true}
            onChange={() => {}}
          />
        </Section>

        {/* İçerik */}
        <Section title="İçerik ve Önbellek">
          <RowSwitch
            label="EPG Çubuğunu Göster"
            sub="Oynarken program bilgisi"
            value={settings.showEpgBar}
            onChange={(v) => update({showEpgBar: v})}
          />
          <RowSwitch
            label="Kanal Numaralarını Göster"
            value={settings.showChannelNumbers}
            onChange={(v) => update({showChannelNumbers: v})}
          />
          <RowSelect
            label="EPG Önbellek Süresi"
            value={String(settings.epgCacheTTL)}
            options={[
              {label: '1 Saat',   value: '3600'},
              {label: '6 Saat',   value: '21600'},
              {label: '12 Saat',  value: '43200'},
              {label: '1 Gün',    value: '86400'},
            ]}
            onChange={(v) => update({epgCacheTTL: Number(v)})}
          />
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={() =>
              Alert.alert('Geçmişi Temizle', 'İzleme geçmişini temizlemek istiyor musun?', [
                {text: 'İptal', style: 'cancel'},
                {text: 'Temizle', style: 'destructive', onPress: clearHistory},
              ])
            }>
            <Text style={styles.dangerLabel}>İzleme Geçmişini Temizle</Text>
            <Text style={styles.dangerArrow}>→</Text>
          </TouchableOpacity>
        </Section>

        {/* Dil */}
        <Section title="Uygulama">
          <RowSelect
            label="Dil"
            value={settings.language}
            options={[
              {label: 'Türkçe', value: 'tr'},
              {label: 'English', value: 'en'},
            ]}
            onChange={(v) => update({language: v as any})}
          />
          <InfoRow label="Sürüm"    value="1.0.0" />
          <InfoRow label="Platform" value="Android" />
        </Section>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <View style={sStyles.sectionBody}>{children}</View>
    </View>
  );
}

function RowSwitch({label, sub, value, onChange}: {label: string; sub?: string; value: boolean; onChange: (v: boolean) => void}) {
  return (
    <View style={sStyles.row}>
      <View style={{flex: 1}}>
        <Text style={sStyles.rowLabel}>{label}</Text>
        {sub && <Text style={sStyles.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: Colors.surfaceBorder, true: Colors.accent}}
        thumbColor={Colors.textPrimary}
      />
    </View>
  );
}

function RowSelect({label, value, options, onChange}: {
  label: string; value: string;
  options: {label: string; value: string}[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={sStyles.row}>
      <Text style={[sStyles.rowLabel, {flex: 1}]}>{label}</Text>
      <View style={sStyles.segmented}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[sStyles.segBtn, value === opt.value && sStyles.segBtnActive]}
            onPress={() => onChange(opt.value)}>
            <Text style={[sStyles.segTxt, value === opt.value && sStyles.segTxtActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={sStyles.row}>
      <Text style={[sStyles.rowLabel, {flex: 1}]}>{label}</Text>
      <Text style={sStyles.rowSub}>{value}</Text>
    </View>
  );
}

// ── Main styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     {flex: 1, backgroundColor: Colors.background},
  header:        {paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md},
  headerTitle:   {...Typography.h1},
  scroll:        {flex: 1},
  scrollContent: {padding: Spacing.lg},

  serverRow:     {flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  serverInfo:    {flex: 1},
  serverName:    {fontSize: 14, color: Colors.textPrimary, fontWeight: '500'},
  serverType:    {fontSize: 11, color: Colors.textTertiary, marginTop: 2},
  serverActions: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  activateBtn:   {paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.xs, borderWidth: 1, borderColor: Colors.accent},
  activateTxt:   {fontSize: 11, color: Colors.accent, fontWeight: '600'},
  activeTag:     {paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.xs, backgroundColor: Colors.successSurface},
  activeTxt:     {fontSize: 11, color: Colors.success, fontWeight: '600'},
  deleteBtn:     {fontSize: 16, padding: 4},

  addServerBtn:  {marginTop: Spacing.sm, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.accent, borderRadius: Radius.sm, borderStyle: 'dashed'},
  addServerTxt:  {fontSize: 14, color: Colors.accent, fontWeight: '500'},

  dangerRow:     {flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  dangerLabel:   {flex: 1, fontSize: 14, color: Colors.error},
  dangerArrow:   {fontSize: 14, color: Colors.error},
});

const sStyles = StyleSheet.create({
  section:      {marginBottom: Spacing.xl},
  sectionTitle: {fontSize: 11, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm},
  sectionBody:  {backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden'},
  row:          {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  rowLabel:     {fontSize: 14, color: Colors.textPrimary},
  rowSub:       {fontSize: 11, color: Colors.textTertiary, marginTop: 1},
  segmented:    {flexDirection: 'row', gap: 4},
  segBtn:       {paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.xs, borderWidth: 1, borderColor: Colors.surfaceBorder},
  segBtnActive: {backgroundColor: Colors.accent, borderColor: Colors.accent},
  segTxt:       {fontSize: 11, color: Colors.textSecondary},
  segTxtActive: {color: Colors.textPrimary, fontWeight: '600'},
});
