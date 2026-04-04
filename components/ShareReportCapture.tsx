import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { RiskScoreRing } from '@/components/RiskScoreRing';
import type { Scan } from '@/types/database';

interface ShareReportCaptureProps {
  scan: Scan;
}

/**
 * Renderable view captured via react-native-view-shot for sharing.
 * Contains: logo, RiskScoreRing, contract title, top 3 red flags, watermark.
 */
export const ShareReportCapture = forwardRef<View, ShareReportCaptureProps>(
  ({ scan }, ref) => {
    const topFlags = (scan.red_flags ?? []).slice(0, 3);

    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        {/* Header: logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🛡️</Text>
            <Text style={styles.logoText}>SignGuard AI</Text>
          </View>
        </View>

        {/* Contract title */}
        <Text style={styles.contractTitle} numberOfLines={2}>
          {scan.title}
        </Text>

        {/* Risk score ring */}
        {scan.risk_score != null && scan.risk_level ? (
          <View style={styles.ringSection}>
            <RiskScoreRing
              score={scan.risk_score}
              riskLevel={scan.risk_level}
              size={140}
              animated={false}
            />
          </View>
        ) : null}

        {/* Top 3 red flags */}
        {topFlags.length > 0 ? (
          <View style={styles.flagsSection}>
            <Text style={styles.flagsLabel}>🚩 Top Red Flags</Text>
            {topFlags.map((flag, i) => (
              <View key={i} style={styles.flagRow}>
                <Text style={styles.flagBullet}>•</Text>
                <Text style={styles.flagText} numberOfLines={2}>
                  {flag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Watermark */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>
            Scanned by SignGuard AI — signguard.ai
          </Text>
        </View>
      </View>
    );
  },
);

ShareReportCapture.displayName = 'ShareReportCapture';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    width: 360,
    padding: spacing.xl,
    borderRadius: radius.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    fontSize: fontSizes.xl,
  },
  logoText: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  contractTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    lineHeight: fontSizes['2xl'] * 1.3,
  },
  ringSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  flagsSection: {
    backgroundColor: `${colors.danger}0d`,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  flagsLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  flagBullet: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    lineHeight: fontSizes.sm * 1.5,
    flexShrink: 0,
  },
  flagText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.5,
  },
  watermark: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
});
