import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { useScans } from '@/hooks/useScans';
import { useScanLimit } from '@/hooks/useScanLimit';
import { RiskScoreRing } from '@/components/RiskScoreRing';
import { ClauseCard } from '@/components/ClauseCard';
import { ShareReportCapture } from '@/components/ShareReportCapture';
import { Skeleton } from '@/components/ui/Skeleton';
import { CONTRACT_TYPES, ContractTypeKey } from '@/constants/contractTypes';
import { formatRelativeDate } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import type { Scan, Clause } from '@/types/database';

const RISK_ORDER: Record<Clause['risk_level'], number> = {
  danger: 0,
  caution: 1,
  safe: 2,
};

const KEY_TERM_LABELS: Record<string, string> = {
  duration: 'Duration',
  total_cost: 'Total Cost',
  cancellation: 'Cancellation',
  auto_renewal: 'Auto-Renewal',
  deposit: 'Deposit',
  penalties: 'Penalties',
};

const KEY_TERM_KEYS = ['duration', 'total_cost', 'cancellation', 'auto_renewal', 'deposit', 'penalties'];

function ReportSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <Skeleton width="60%" height={24} style={styles.skeletonItem} />
      <Skeleton width="40%" height={16} style={styles.skeletonItem} />
      <View style={styles.skeletonRing}>
        <Skeleton width={160} height={160} style={{ borderRadius: 80 }} />
      </View>
      <Skeleton width="100%" height={80} style={styles.skeletonItem} />
      <Skeleton width="100%" height={60} style={styles.skeletonItem} />
      <Skeleton width="100%" height={60} style={styles.skeletonItem} />
      <Skeleton width="100%" height={60} style={styles.skeletonItem} />
    </View>
  );
}

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getScan } = useScans();
  const { isPro } = useScanLimit();
  const [scan, setScan] = useState<Scan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<View>(null);

  const loadScan = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await getScan(id);
    setScan(data);
    setIsLoading(false);
  }, [id, getScan]);

  useEffect(() => {
    loadScan();
  }, [loadScan]);

  useEffect(() => {
    if (scan) {
      trackEvent('report_viewed', { scan_id: scan.id, contract_type: scan.contract_type });
    }
  }, [scan?.id]);

  const typeKey = (scan?.contract_type ?? 'other') as ContractTypeKey;
  const typeConfig = CONTRACT_TYPES[typeKey] ?? CONTRACT_TYPES.other;

  const sortedClauses = scan?.clauses
    ? [...scan.clauses].sort(
        (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]
      )
    : [];

  const dangerCount = sortedClauses.filter((c) => c.risk_level === 'danger').length;
  const cautionCount = sortedClauses.filter((c) => c.risk_level === 'caution').length;
  const safeCount = sortedClauses.filter((c) => c.risk_level === 'safe').length;

  function handleNegotiationPress(clauseId: string) {
    if (isPro) {
      router.push(`/clause/${clauseId}`);
    } else {
      router.push('/paywall');
    }
  }

  async function handleShare() {
    if (!scan || !shareRef.current || isSharing) return;
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
      return;
    }
    try {
      setIsSharing(true);
      const uri = await captureRef(shareRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Risk Report',
      });
      trackEvent('report_shared', { scan_id: scan.id });
    } catch (err) {
      // User cancelled or error — no-op
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Off-screen capture view for share image */}
      {scan ? (
        <View style={styles.offScreen}>
          <ShareReportCapture ref={shareRef} scan={scan} />
        </View>
      ) : null}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Text style={styles.headerBtnText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isLoading ? 'Report' : (scan?.title ?? 'Report')}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleShare}
          disabled={isSharing || isLoading || !scan}
        >
          <Text style={[styles.shareIcon, (isSharing || isLoading || !scan) && styles.shareIconDisabled]}>
            {'↑'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ReportSkeleton />
        ) : !scan ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Report not found.</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Contract type badge + title + date */}
            <View style={styles.titleSection}>
              <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}22` }]}>
                <Text style={styles.typeEmoji}>{typeConfig.emoji}</Text>
                <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
              </View>
              <Text style={styles.scanTitle}>{scan.title}</Text>
              <Text style={styles.scanDate}>{formatRelativeDate(scan.created_at)}</Text>
            </View>

            {/* Risk score ring */}
            {scan.risk_score != null && scan.risk_level ? (
              <View style={styles.ringSection}>
                <RiskScoreRing
                  score={scan.risk_score}
                  riskLevel={scan.risk_level}
                  size={160}
                  animated
                />
              </View>
            ) : null}

            {/* Summary card */}
            {scan.summary ? (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Summary</Text>
                <Text style={styles.summaryText}>{scan.summary}</Text>
              </View>
            ) : null}

            {/* Key Terms grid */}
            {scan.key_terms ? (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Key Terms</Text>
                <View style={styles.keyTermsGrid}>
                  {KEY_TERM_KEYS.map((key) => {
                    const value = scan.key_terms?.[key];
                    if (!value) return null;
                    return (
                      <View key={key} style={styles.keyTermItem}>
                        <Text style={styles.keyTermLabel}>{KEY_TERM_LABELS[key]}</Text>
                        <Text style={styles.keyTermValue}>{value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Red Flags */}
            {scan.red_flags && scan.red_flags.length > 0 ? (
              <View style={[styles.card, styles.redFlagCard]}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.redFlagIcon}>🚩</Text>
                  <Text style={[styles.sectionLabel, styles.redFlagTitle]}>
                    Red Flags
                  </Text>
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{scan.red_flags.length}</Text>
                  </View>
                </View>
                {scan.red_flags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <Text style={styles.flagBullet}>•</Text>
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Clauses section */}
            {sortedClauses.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>Clauses</Text>
                  <View style={styles.clauseCounts}>
                    {dangerCount > 0 && (
                      <View style={[styles.countPill, { backgroundColor: `${colors.danger}22` }]}>
                        <Text style={[styles.countPillText, { color: colors.danger }]}>
                          {dangerCount} danger
                        </Text>
                      </View>
                    )}
                    {cautionCount > 0 && (
                      <View style={[styles.countPill, { backgroundColor: `${colors.caution}22` }]}>
                        <Text style={[styles.countPillText, { color: colors.caution }]}>
                          {cautionCount} caution
                        </Text>
                      </View>
                    )}
                    {safeCount > 0 && (
                      <View style={[styles.countPill, { backgroundColor: `${colors.safe}22` }]}>
                        <Text style={[styles.countPillText, { color: colors.safe }]}>
                          {safeCount} safe
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {sortedClauses.map((clause) => (
                  <ClauseCard
                    key={clause.id}
                    clause={clause}
                    isPro={isPro}
                    onNegotiationPress={handleNegotiationPress}
                  />
                ))}
              </View>
            ) : null}

            {/* Negotiation Tips */}
            {scan.negotiation_tips && scan.negotiation_tips.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Negotiation Tips</Text>
                {scan.negotiation_tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={styles.tipNumber}>
                      <Text style={styles.tipNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}

                {/* Pro CTA — only shown for free users */}
                {!isPro && (
                  <TouchableOpacity
                    style={styles.proCta}
                    onPress={() => {
                      trackEvent('paywall_shown', { trigger: 'negotiation_scripts' });
                      router.push('/paywall');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.proCtaIcon}>✨</Text>
                    <View style={styles.proCtaText}>
                      <Text style={styles.proCtaTitle}>Get AI Negotiation Scripts</Text>
                      <Text style={styles.proCtaSubtitle}>
                        Word-for-word scripts tailored to your contract
                      </Text>
                    </View>
                    <Text style={styles.proCtaArrow}>{'→'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Skeleton
  skeletonContainer: {
    gap: spacing.md,
  },
  skeletonItem: {
    marginBottom: spacing.sm,
  },
  skeletonRing: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.lg,
  },
  errorText: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  backBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  backBtnText: {
    fontSize: fontSizes.md,
    color: colors.text,
    fontWeight: '600',
  },

  // Title section
  titleSection: {
    marginBottom: spacing.xl,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  typeEmoji: {
    fontSize: fontSizes.sm,
  },
  typeLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  scanTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  scanDate: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },

  // Ring section
  ringSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  // Cards and sections
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },

  // Summary
  summaryText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    lineHeight: fontSizes.md * 1.6,
  },

  // Key Terms
  keyTermsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  keyTermItem: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  keyTermLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  keyTermValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: '500',
  },

  // Red Flags
  redFlagCard: {
    borderColor: `${colors.danger}44`,
    backgroundColor: `${colors.danger}08`,
  },
  redFlagIcon: {
    fontSize: fontSizes.md,
  },
  redFlagTitle: {
    color: colors.danger,
    marginBottom: 0,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  flagBullet: {
    fontSize: fontSizes.md,
    color: colors.danger,
    lineHeight: fontSizes.md * 1.5,
    flexShrink: 0,
  },
  flagText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.5,
  },

  // Clause counts
  clauseCounts: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  countPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: `${colors.danger}22`,
  },
  countPillText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.danger,
  },

  // Negotiation Tips
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tipNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  tipNumberText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.accent,
  },
  tipText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.5,
  },

  // Pro CTA
  proCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.proGold}15`,
    borderWidth: 1,
    borderColor: `${colors.proGold}44`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  proCtaIcon: {
    fontSize: fontSizes.lg,
  },
  proCtaText: {
    flex: 1,
  },
  proCtaTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.proGold,
    marginBottom: 2,
  },
  proCtaSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  proCtaArrow: {
    fontSize: fontSizes.lg,
    color: colors.proGold,
  },

  bottomPadding: {
    height: spacing['2xl'],
  },
  shareIcon: {
    fontSize: fontSizes.xl,
    color: colors.text,
    fontWeight: '600',
  },
  shareIconDisabled: {
    color: colors.textMuted,
  },
  offScreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
});
