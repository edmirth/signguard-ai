import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontSizes, radius, spacing } from '@/constants/theme';

type Level = 'safe' | 'caution' | 'danger' | 'pro';

interface BadgeProps {
  level: Level;
  label?: string;
  style?: ViewStyle;
}

const levelColors: Record<Level, { bg: string; text: string }> = {
  safe: { bg: `${colors.safe}22`, text: colors.safe },
  caution: { bg: `${colors.caution}22`, text: colors.caution },
  danger: { bg: `${colors.danger}22`, text: colors.danger },
  pro: { bg: `${colors.proGold}22`, text: colors.proGold },
};

const defaultLabels: Record<Level, string> = {
  safe: 'Safe',
  caution: 'Caution',
  danger: 'Danger',
  pro: 'Pro',
};

export function Badge({ level, label, style }: BadgeProps) {
  const { bg, text } = levelColors[level];
  const displayLabel = label ?? defaultLabels[level];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
