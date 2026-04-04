import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import type { Clause } from '@/types/database';

interface NegotiationToolkit {
  verbal_script: string;
  email_template: string;
  fallback_position: string;
  leverage_points: string[];
  walk_away_signal: string;
}

const RISK_COLOR: Record<string, string> = {
  safe: colors.safe,
  caution: colors.caution,
  danger: colors.danger,
};

const RISK_LABEL: Record<string, string> = {
  safe: 'Safe',
  caution: 'Caution',
  danger: 'Danger',
};

export default function ClauseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isPro } = useSubscription();

  const [clause, setClause] = useState<Clause | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toolkit, setToolkit] = useState<NegotiationToolkit | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchClause = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clauses')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) {
      setClause(data as Clause);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchClause();
  }, [fetchClause]);

  const generateNegotiationScript = async () => {
    if (!isPro) {
      router.push('/paywall');
      return;
    }
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-negotiation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clause_id: id }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (res.status === 403 && errBody.code === 'pro_required') {
          router.push('/paywall');
          return;
        }
        throw new Error(errBody.error ?? 'Failed to generate script');
      }

      const result: NegotiationToolkit = await res.json();
      setToolkit(result);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!clause) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Clause not found.</Text>
      </View>
    );
  }

  const riskColor = RISK_COLOR[clause.risk_level] ?? colors.textMuted;
  const riskLabel = RISK_LABEL[clause.risk_level] ?? clause.risk_level;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Clause Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Risk Badge */}
      <View style={[styles.riskBadge, { backgroundColor: `${riskColor}22`, borderColor: `${riskColor}55` }]}>
        <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
        <Text style={[styles.riskLabel, { color: riskColor }]}>{riskLabel}</Text>
      </View>

      {/* Clause Info */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: riskColor }]}>
        {clause.section_ref ? (
          <Text style={styles.sectionRef}>{clause.section_ref}</Text>
        ) : null}
        <Text style={styles.clauseTitle}>{clause.title}</Text>
      </View>

      {/* Original Text */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Original Text</Text>
        <View style={styles.originalTextBox}>
          <Text style={styles.originalText}>{clause.original_text}</Text>
        </View>
      </View>

      {/* Plain-English Explanation */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>What This Means</Text>
        <Text style={styles.bodyText}>{clause.explanation}</Text>
      </View>

      {/* Suggestion */}
      {clause.suggestion ? (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Suggested Revision</Text>
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionText}>{clause.suggestion}</Text>
          </View>
        </View>
      ) : null}

      {/* Negotiation Toolkit */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Negotiation Toolkit</Text>

        {!isPro && !toolkit ? (
          <View style={styles.proGate}>
            <Text style={styles.proGateEmoji}>🔒</Text>
            <Text style={styles.proGateTitle}>Pro Feature</Text>
            <Text style={styles.proGateSubtitle}>
              Get a word-for-word negotiation script, email template, leverage points, and more.
            </Text>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/paywall')}>
              <Text style={styles.upgradeButtonText}>Unlock with Pro</Text>
            </TouchableOpacity>
          </View>
        ) : toolkit ? (
          <View>
            {/* Verbal Script */}
            <View style={styles.toolkitSection}>
              <Text style={styles.toolkitLabel}>🗣 Verbal Script</Text>
              <View style={styles.scriptBox}>
                <Text style={styles.scriptText}>{toolkit.verbal_script}</Text>
              </View>
            </View>

            {/* Email Template */}
            <View style={styles.toolkitSection}>
              <Text style={styles.toolkitLabel}>📧 Email Template</Text>
              <View style={styles.scriptBox}>
                <Text style={styles.scriptText}>{toolkit.email_template}</Text>
              </View>
            </View>

            {/* Leverage Points */}
            <View style={styles.toolkitSection}>
              <Text style={styles.toolkitLabel}>💪 Leverage Points</Text>
              {toolkit.leverage_points.map((point, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>

            {/* Fallback Position */}
            <View style={styles.toolkitSection}>
              <Text style={styles.toolkitLabel}>🤝 Fallback Position</Text>
              <Text style={styles.bodyText}>{toolkit.fallback_position}</Text>
            </View>

            {/* Walk Away Signal */}
            <View style={[styles.toolkitSection, styles.walkAwayBox]}>
              <Text style={styles.toolkitLabel}>🚨 Walk Away If...</Text>
              <Text style={[styles.bodyText, { color: colors.danger }]}>{toolkit.walk_away_signal}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateNegotiationScript}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.generateButtonText}>Generate Negotiation Script</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    color: colors.text,
    fontSize: fontSizes.xl,
  },
  screenTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  sectionRef: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  clauseTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  originalTextBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  originalText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bodyText: {
    color: colors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
  },
  suggestionBox: {
    backgroundColor: `${colors.accent}11`,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  suggestionText: {
    color: colors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
  },
  proGate: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  proGateEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  proGateTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  proGateSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  upgradeButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  generateButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  generateButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  toolkitSection: {
    marginBottom: spacing.lg,
  },
  toolkitLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  scriptBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  scriptText: {
    color: colors.text,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bullet: {
    color: colors.accent,
    fontSize: fontSizes.md,
  },
  bulletText: {
    color: colors.text,
    fontSize: fontSizes.md,
    flex: 1,
    lineHeight: 22,
  },
  walkAwayBox: {
    backgroundColor: `${colors.danger}11`,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
  },
});
