import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSizes, fonts, radius, spacing } from '@/constants/theme';
import { CONTRACT_TYPES, ContractTypeKey } from '@/constants/contractTypes';
import { Scan } from '@/types/database';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeDate, getScoreColor } from '@/lib/utils';

interface ScanCardProps {
  scan: Scan;
  onPress?: () => void;
}

const RISK_BORDER: Record<string, string> = {
  low: colors.safe,
  medium: colors.caution,
  high: colors.cautionAlt,
  critical: colors.danger,
};

export function ScanCard({ scan, onPress }: ScanCardProps) {
  const typeKey = (scan.contract_type as ContractTypeKey) in CONTRACT_TYPES
    ? (scan.contract_type as ContractTypeKey)
    : 'other';
  const typeConfig = CONTRACT_TYPES[typeKey];

  const borderColor = scan.risk_level
    ? (RISK_BORDER[scan.risk_level] ?? colors.cardBorder)
    : colors.cardBorder;

  if (scan.status === 'processing') {
    return (
      <View style={styles.card}>
        <View style={[styles.riskBar, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.row}>
          <View style={styles.info}>
            <Skeleton width={160} height={14} />
            <Skeleton width={80} height={11} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={40} height={22} />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.riskBar, { backgroundColor: borderColor }]} />
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.typeLabel} numberOfLines={1}>
            {typeConfig.label.toUpperCase()}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {scan.title}
          </Text>
          <Text style={styles.date}>{formatRelativeDate(scan.created_at)}</Text>
        </View>

        {scan.status === 'failed' ? (
          <View style={styles.failedBadge}>
            <Text style={styles.failedText}>ERR</Text>
          </View>
        ) : scan.risk_score !== null && scan.risk_level ? (
          <View style={styles.scorePill}>
            <Text style={[styles.score, { color: getScoreColor(scan.risk_score) }]}>
              {scan.risk_score}
            </Text>
            <Text style={styles.scoreLabel}>RISK</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  riskBar: {
    width: 3,
    backgroundColor: colors.cardBorder,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  typeLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 3,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: 3,
  },
  date: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontFamily: fonts.mono,
  },
  scorePill: {
    alignItems: 'center',
    minWidth: 40,
  },
  score: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    fontFamily: fonts.mono,
    lineHeight: fontSizes.lg * 1.1,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  failedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: `${colors.danger}20`,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
  },
  failedText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    fontFamily: fonts.mono,
    letterSpacing: 1,
  },
});
