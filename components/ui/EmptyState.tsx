import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {ctaLabel && onCta && (
        <Button variant="primary" onPress={onCta} style={styles.cta}>
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  cta: {
    minWidth: 160,
  },
});
