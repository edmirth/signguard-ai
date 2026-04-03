import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '@/constants/theme';
import { formatRelativeDate } from '@/lib/utils';

interface ScanLimitBannerProps {
  isPro: boolean;
  scansUsed: number;
  scansLimit: number;
  resetsAt: string;
  onUpgrade?: () => void;
}

export function ScanLimitBanner({
  isPro,
  scansUsed,
  scansLimit,
  resetsAt,
  onUpgrade,
}: ScanLimitBannerProps) {
  if (isPro) {
    return (
      <View style={[styles.banner, styles.proBanner]}>
        <Text style={styles.proText}>⭐ Pro — Unlimited Scans</Text>
      </View>
    );
  }

  const remaining = Math.max(0, scansLimit - scansUsed);
  const isAtLimit = remaining === 0;

  if (isAtLimit) {
    return (
      <View style={[styles.banner, styles.limitBanner]}>
        <View style={styles.row}>
          <View style={styles.textGroup}>
            <Text style={styles.limitTitle}>Scan limit reached</Text>
            <Text style={styles.limitSubtitle}>
              Resets {formatRelativeDate(resetsAt)}
            </Text>
          </View>
          {onUpgrade && (
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade} activeOpacity={0.8}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const progressPct = scansUsed / scansLimit;

  return (
    <View style={[styles.banner, styles.freeBanner]}>
      <View style={styles.row}>
        <Text style={styles.freeText}>
          {remaining} of {scansLimit} free scans remaining
        </Text>
        <Text style={styles.freeCount}>
          {scansUsed}/{scansLimit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, progressPct * 100)}%` as `${number}%`,
              backgroundColor: progressPct >= 0.8 ? colors.caution : colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  proBanner: {
    backgroundColor: `${colors.proGold}22`,
    borderWidth: 1,
    borderColor: `${colors.proGold}44`,
  },
  proText: {
    color: colors.proGold,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  freeBanner: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  limitBanner: {
    backgroundColor: `${colors.danger}15`,
    borderWidth: 1,
    borderColor: `${colors.danger}44`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
  },
  limitTitle: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  limitSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  upgradeButtonText: {
    color: colors.text,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  freeText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    flex: 1,
  },
  freeCount: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceBorder,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
