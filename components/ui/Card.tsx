import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  shadow?: boolean;
  children: React.ReactNode;
}

export function Card({ shadow = false, children, style, ...rest }: CardProps) {
  return (
    <View
      style={[styles.card, shadow && shadows.md, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
