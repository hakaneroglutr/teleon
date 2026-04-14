// src/components/common/ErrorView.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Colors} from '@theme/colors';
import {Spacing, Radius} from '@theme/spacing';

interface Props {
  message?:  string;
  onRetry?:  () => void;
  retryLabel?: string;
}

export function ErrorView({
  message   = 'Bir hata oluştu.',
  onRetry,
  retryLabel = 'Tekrar Dene',
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.msg}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry}>
          <Text style={styles.btnTxt}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  icon:  {fontSize: 36},
  msg:   {fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22},
  btn:   {marginTop: Spacing.sm, backgroundColor: Colors.accent, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.full},
  btnTxt:{color: Colors.textPrimary, fontWeight: '700', fontSize: 14},
});
