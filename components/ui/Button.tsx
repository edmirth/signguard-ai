import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors, fontSizes, radius, spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text : colors.accent}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  primaryLabel: {
    color: colors.text,
  },
  secondaryLabel: {
    color: colors.accent,
  },
  ghostLabel: {
    color: colors.accent,
  },
});
