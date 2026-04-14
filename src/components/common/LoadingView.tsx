// src/components/common/LoadingView.tsx
import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {Colors} from '@theme/colors';
import {Spacing} from '@theme/spacing';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingView({message = 'Yükleniyor...', size = 'large'}: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.accent} size={size} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  text: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});
