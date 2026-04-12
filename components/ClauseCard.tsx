import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { Clause } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { trackEvent } from '@/lib/analytics';

interface ClauseCardProps {
  clause: Clause;
  isPro: boolean;
  onNegotiationPress?: (clauseId: string) => void;
}

const riskBorderColor: Record<Clause['risk_level'], string> = {
  safe: colors.safe,
  caution: colors.caution,
  danger: colors.danger,
};

const riskDotColor: Record<Clause['risk_level'], string> = {
  safe: colors.safe,
  caution: colors.caution,
  danger: colors.danger,
};

export function ClauseCard({ clause, isPro, onNegotiationPress }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !expanded;
    setExpanded(next);
    if (next) {
      trackEvent('clause_expanded', { clause_id: clause.id, risk_level: clause.risk_level });
    }
    rotation.value = withTiming(next ? 180 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.card, { borderLeftColor: riskBorderColor[clause.risk_level] }]}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: riskDotColor[clause.risk_level] }]} />
          <View style={styles.meta}>
            {clause.section_ref ? (
              <Text style={styles.sectionRef}>{clause.section_ref}</Text>
            ) : null}
            <Text style={styles.title} numberOfLines={1}>{clause.title}</Text>
          </View>
        </View>
        <Animated.Text style={[styles.chevron, chevronStyle]}>{'⌄'}</Animated.Text>
      </View>

      {/* Preview — always visible, 1 line */}
      <Text style={styles.preview} numberOfLines={expanded ? undefined : 1}>
        {clause.explanation}
      </Text>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.expanded}>
          {clause.suggestion ? (
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionLabel}>Suggestion</Text>
              <Text style={styles.suggestionText}>{clause.suggestion}</Text>
            </View>
          ) : null}

          {clause.suggestion ? (
            <TouchableOpacity
              style={styles.negotiationRow}
              onPress={() => onNegotiationPress?.(clause.id)}
              activeOpacity={0.7}
            >
              <Badge level="pro" label="Pro" />
              <Text style={styles.negotiationLink}>
                {isPro ? 'Get Negotiation Script →' : 'Unlock Negotiation Script →'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 3,
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  meta: {
    flex: 1,
  },
  sectionRef: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: fontSizes.lg * 1.2,
  },
  preview: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.5,
    marginLeft: 8 + spacing.sm,
  },
  expanded: {
    marginTop: spacing.sm,
    marginLeft: 8 + spacing.sm,
  },
  suggestionBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.5,
  },
  negotiationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  negotiationLink: {
    fontSize: fontSizes.sm,
    color: colors.proGold,
    fontWeight: '600',
  },
});
