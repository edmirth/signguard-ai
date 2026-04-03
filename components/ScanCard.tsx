import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '@/constants/theme';
import { CONTRACT_TYPES, ContractTypeKey } from '@/constants/contractTypes';
import { Scan } from '@/types/database';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeDate, getScoreColor } from '@/lib/utils';

interface ScanCardProps {
  scan: Scan;
  onPress?: () => void;
}

export function ScanCard({ scan, onPress }: ScanCardProps) {
  const typeKey = (scan.contract_type as ContractTypeKey) in CONTRACT_TYPES
    ? (scan.contract_type as ContractTypeKey)
    : 'other';
  const typeConfig = CONTRACT_TYPES[typeKey];

  if (scan.status === 'processing') {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Skeleton width={40} height={40} />
          <View style={styles.info}>
            <Skeleton width={160} height={14} />
            <Skeleton width={80} height={11} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={48} height={24} />
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
      <View style={styles.row}>
        <View style={[styles.emojiBox, { backgroundColor: `${typeConfig.color}22` }]}>
          <Text style={styles.emoji}>{typeConfig.emoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {scan.title}
          </Text>
          <Text style={styles.date}>{formatRelativeDate(scan.created_at)}</Text>
        </View>
        {scan.status === 'failed' ? (
          <View style={styles.failedBadge}>
            <Text style={styles.failedText}>Failed</Text>
          </View>
        ) : scan.risk_score !== null && scan.risk_level ? (
          <View style={styles.scorePill}>
            <Text style={[styles.score, { color: getScoreColor(scan.risk_score) }]}>
              {scan.risk_score}
            </Text>
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
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  date: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginTop: 3,
  },
  scorePill: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  failedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `${colors.danger}22`,
  },
  failedText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});
