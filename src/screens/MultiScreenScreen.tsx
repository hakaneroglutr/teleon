// src/screens/MultiScreenScreen.tsx  (Faz 3)
// Aynı anda 2 veya 4 kanalı izleme modu
import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, FlatList, Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '@theme/colors';
import {Spacing, Radius} from '@theme/spacing';
import {TeleonPlayerView} from '@components/player/TeleonPlayerView';
import {TeleonPlayer} from '@native/TeleonPlayer';
import {useChannelStore} from '@store/channelStore';
import {Channel} from '@store/types';
import {guessStreamEngine} from '@utils/helpers';

const {width, height} = Dimensions.get('window');
type LayoutMode = '1x1' | '2x1' | '2x2';

interface Slot {id: number; channel: Channel | null;}

export default function MultiScreenScreen() {
  const navigation = useNavigation();
  const channels   = useChannelStore((s) => s.channels);

  const [layout,      setLayout]      = useState<LayoutMode>('2x2');
  const [slots,       setSlots]       = useState<Slot[]>([{id:0,channel:null},{id:1,channel:null},{id:2,channel:null},{id:3,channel:null}]);
  const [activeSlot,  setActiveSlot]  = useState(0);
  const [showPicker,  setShowPicker]  = useState(false);
  const [pickingSlot, setPickingSlot] = useState(0);

  // İlk açılışta kanalları otomatik doldur
  useEffect(() => {
    if (channels.length === 0) return;
    setSlots((prev) => prev.map((s, i) => ({...s, channel: channels[i % channels.length] ?? null})));
  }, [channels.length]);

  const slotCount  = layout === '1x1' ? 1 : layout === '2x1' ? 2 : 4;
  const slotW      = layout === '2x2' ? width / 2 : layout === '2x1' ? width / 2 : width;
  const slotH      = layout === '2x2' ? (height - 44) / 2 : (height - 44) / 2;

  const openPicker = useCallback((slotId: number) => {
    setPickingSlot(slotId);
    setShowPicker(true);
  }, []);

  const pickChannel = useCallback((ch: Channel) => {
    setSlots((prev) => prev.map((s) => s.id === pickingSlot ? {...s, channel: ch} : s));
    setShowPicker(false);
    TeleonPlayer.play(ch.streamUrl, guessStreamEngine(ch.streamUrl)).catch(() => {});
  }, [pickingSlot]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Toolbar */}
      <View style={styles.bar}>
        <TouchableOpacity style={styles.barBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.barBtnTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.barTitle}>Multi-Screen</Text>
        <View style={styles.layoutRow}>
          {(['1x1','2x1','2x2'] as LayoutMode[]).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.lBtn, layout === l && styles.lBtnOn]}
              onPress={() => setLayout(l)}>
              <Text style={[styles.lBtnTxt, layout === l && styles.lBtnTxtOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {slots.slice(0, slotCount).map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[styles.slot, {width: slotW, height: slotH}, activeSlot === slot.id && styles.slotOn]}
            onPress={() => setActiveSlot(slot.id)}
            onLongPress={() => openPicker(slot.id)}
            activeOpacity={0.9}>
            {slot.channel ? (
              <>
                <TeleonPlayerView
                  style={StyleSheet.absoluteFill}
                  playerId={`slot${slot.id}`}
                  engine={guessStreamEngine(slot.channel.streamUrl)}
                  isVisible
                />
                <View style={styles.slotTag}>
                  <Text style={styles.slotTagTxt} numberOfLines={1}>{slot.channel.name}</Text>
                </View>
              </>
            ) : (
              <View style={styles.slotEmpty}>
                <Text style={styles.slotPlusTxt}>+</Text>
                <Text style={styles.slotEmptyTxt}>Kanal Seç</Text>
                <Text style={styles.slotHint}>Uzun bas</Text>
              </View>
            )}
            {activeSlot === slot.id && <View style={styles.slotBorder} pointerEvents="none" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Kanal seçici modal */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Kanal Seç — Slot {pickingSlot + 1}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={channels.slice(0, 100)}
              keyExtractor={(c) => String(c.streamId)}
              style={{maxHeight: height * 0.52}}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.pickItem} onPress={() => pickChannel(item)}>
                  <Text style={styles.pickName}>{item.name}</Text>
                  <Text style={styles.pickCat}>{item.categoryName}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   {flex: 1, backgroundColor: '#000'},
  bar:         {height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, backgroundColor: 'rgba(0,0,0,0.9)'},
  barBtn:      {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
  barBtnTxt:   {fontSize: 16, color: Colors.textPrimary},
  barTitle:    {fontSize: 13, fontWeight: '700', color: Colors.textPrimary},
  layoutRow:   {flexDirection: 'row', gap: 3},
  lBtn:        {paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, backgroundColor: Colors.surfaceElevated},
  lBtnOn:      {backgroundColor: Colors.accent},
  lBtnTxt:     {fontSize: 10, color: Colors.textSecondary, fontWeight: '600'},
  lBtnTxtOn:   {color: Colors.textPrimary},
  grid:        {flex: 1, flexDirection: 'row', flexWrap: 'wrap'},
  slot:        {borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden'},
  slotOn:      {borderColor: Colors.accent},
  slotBorder:  {...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: Colors.accent},
  slotTag:     {position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 5, paddingVertical: 2},
  slotTagTxt:  {fontSize: 10, color: Colors.textPrimary, fontWeight: '600'},
  slotEmpty:   {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated, gap: 2},
  slotPlusTxt: {fontSize: 26, color: Colors.textTertiary},
  slotEmptyTxt:{fontSize: 12, color: Colors.textTertiary, fontWeight: '500'},
  slotHint:    {fontSize: 9, color: Colors.textTertiary},
  modalBg:     {flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end'},
  sheet:       {backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36},
  sheetHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg},
  sheetTitle:  {fontSize: 15, fontWeight: '700', color: Colors.textPrimary},
  sheetClose:  {fontSize: 16, color: Colors.textTertiary},
  pickItem:    {paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  pickName:    {fontSize: 14, color: Colors.textPrimary, fontWeight: '500'},
  pickCat:     {fontSize: 11, color: Colors.textTertiary, marginTop: 1},
});
