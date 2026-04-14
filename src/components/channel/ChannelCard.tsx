// src/components/channel/ChannelCard.tsx
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import {Colors} from '@theme/colors';
import {Spacing, Radius} from '@theme/spacing';
import {Channel} from '@store/types';
import {initials} from '@utils/helpers';

interface Props {
  channel:   Channel;
  isFav?:    boolean;
  isLive?:   boolean;
  epgTitle?: string;
  onPress:   () => void;
  onLongPress?: () => void;
  variant?: 'list' | 'grid';
}

export function ChannelCard({
  channel, isFav, isLive, epgTitle, onPress, onLongPress, variant = 'list',
}: Props) {
  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.75}>
        <View style={styles.gridThumb}>
          {channel.logoUrl ? (
            <Image source={{uri: channel.logoUrl}} style={styles.gridLogo} resizeMode="contain" />
          ) : (
            <Text style={styles.gridInitials}>{initials(channel.name)}</Text>
          )}
          {isLive && <View style={styles.liveBadge}><Text style={styles.liveText}>CANLI</Text></View>}
        </View>
        <Text style={styles.gridName} numberOfLines={1}>{channel.name}</Text>
      </TouchableOpacity>
    );
  }

  // List variant (default)
  return (
    <TouchableOpacity
      style={styles.listRow}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        {channel.logoUrl ? (
          <Image source={{uri: channel.logoUrl}} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitials}>{initials(channel.name)}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          {channel.num > 0 && (
            <Text style={styles.chNum}>{channel.num}  </Text>
          )}
          <Text style={styles.chName} numberOfLines={1}>{channel.name}</Text>
          {isFav && <Text style={styles.favStar}>  ⭐</Text>}
        </View>
        {epgTitle
          ? <Text style={styles.epgText} numberOfLines={1}>▶ {epgTitle}</Text>
          : <Text style={styles.catText} numberOfLines={1}>{channel.categoryName}</Text>
        }
      </View>

      {/* Right: Live + Play */}
      <View style={styles.right}>
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>●</Text>
          </View>
        )}
        <View style={styles.playBtn}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // List
  listRow:     {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder},
  logoWrap:    {width: 46, height: 46, borderRadius: Radius.xs, backgroundColor: Colors.surfaceElevated, overflow: 'hidden', marginRight: Spacing.sm},
  logo:        {width: '100%', height: '100%'},
  logoPlaceholder: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  logoInitials:{fontSize: 16, fontWeight: '700', color: Colors.textTertiary},
  info:        {flex: 1},
  nameRow:     {flexDirection: 'row', alignItems: 'center'},
  chNum:       {fontSize: 11, color: Colors.textTertiary},
  chName:      {fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flexShrink: 1},
  favStar:     {fontSize: 11},
  epgText:     {fontSize: 11, color: Colors.accent, marginTop: 2},
  catText:     {fontSize: 11, color: Colors.textTertiary, marginTop: 2},
  right:       {flexDirection: 'row', alignItems: 'center', gap: Spacing.xs},
  liveBadge:   {backgroundColor: Colors.liveSurface, paddingHorizontal: 5, paddingVertical: 2, borderRadius: Radius.xs},
  liveText:    {fontSize: 9, color: Colors.live, fontWeight: '700'},
  playBtn:     {width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center'},
  playIcon:    {fontSize: 9, color: Colors.textPrimary, marginLeft: 1},

  // Grid
  gridCard:    {width: 100, backgroundColor: Colors.surface, borderRadius: Radius.md, overflow: 'hidden', margin: Spacing.xs},
  gridThumb:   {width: '100%', height: 60, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', position: 'relative'},
  gridLogo:    {width: '80%', height: '80%'},
  gridInitials:{fontSize: 22, fontWeight: '700', color: Colors.textTertiary},
  gridName:    {fontSize: 11, color: Colors.textSecondary, padding: Spacing.xs, textAlign: 'center'},
});
