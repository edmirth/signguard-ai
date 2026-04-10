import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { colors, fontSizes, fonts, spacing, radius } from '@/constants/theme';
import { useAuthContext } from '@/providers/AuthProvider';
import { useScans } from '@/hooks/useScans';
import { useScanLimit } from '@/hooks/useScanLimit';
import { ScanLimitBanner } from '@/components/ScanLimitBanner';
import { ScanCard } from '@/components/ScanCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Scan } from '@/types/database';
import { trackEvent } from '@/lib/analytics';

export default function HomeScreen() {
  const { profile } = useAuthContext();
  const { scans, isLoading, fetchScans } = useScans();
  const { canScan, scansUsed, scansLimit, resetsAt, isPro } = useScanLimit();

  useFocusEffect(
    useCallback(() => {
      fetchScans();
    }, [fetchScans])
  );

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const recentScans = scans.slice(0, 5);

  function handleScanPress() {
    if (canScan) {
      router.push('/(tabs)/scan');
    } else {
      trackEvent('paywall_shown', { trigger: 'scan_limit_home' });
      router.push('/paywall');
    }
  }

  function handleUpgrade() {
    trackEvent('paywall_shown', { trigger: 'scan_limit_banner' });
    router.push('/paywall');
  }

  function handleScanCardPress(scan: Scan) {
    router.push(`/report/${scan.id}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentScans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {/* Header row */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.appLabel}>SIGNGUARD AI</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <View style={[styles.planBadge, isPro && styles.planBadgePro]}>
                <Text style={[styles.planText, isPro && styles.planTextPro]}>
                  {isPro ? 'PRO' : 'FREE'}
                </Text>
              </View>
            </View>

            <ScanLimitBanner
              isPro={isPro}
              scansUsed={scansUsed}
              scansLimit={isPro ? Infinity : scansLimit}
              resetsAt={resetsAt ?? ''}
              onUpgrade={handleUpgrade}
            />

            {/* Primary scan CTA */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleScanPress}
              activeOpacity={0.8}
            >
              <View style={styles.ctaInner}>
                <View style={styles.ctaIconWrap}>
                  <View style={styles.ctaIconBar} />
                  <View style={[styles.ctaIconBar, styles.ctaIconBarMid]} />
                  <View style={styles.ctaIconBar} />
                </View>
                <View style={styles.ctaTextGroup}>
                  <Text style={styles.ctaTitle}>SCAN CONTRACT</Text>
                  <Text style={styles.ctaSubtitle}>Point at any document to analyze</Text>
                </View>
                <Text style={styles.ctaArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {recentScans.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>RECENT</Text>
                <View style={styles.sectionLine} />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <ScanCard scan={item} onPress={() => handleScanCardPress(item)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Text style={styles.emptyIcon}>▣</Text>}
              title="No contracts yet"
              subtitle="Tap SCAN CONTRACT above to analyze your first document"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  appLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  userName: {
    color: colors.text,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  planBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  planBadgePro: {
    backgroundColor: `${colors.proGold}15`,
    borderColor: `${colors.proGold}40`,
  },
  planText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: fonts.mono,
  },
  planTextPro: {
    color: colors.proGold,
  },

  // Scan CTA
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  ctaIconWrap: {
    gap: 4,
    justifyContent: 'center',
    width: 20,
  },
  ctaIconBar: {
    height: 2,
    width: 20,
    backgroundColor: colors.bg,
    borderRadius: 1,
  },
  ctaIconBarMid: {
    width: 14,
  },
  ctaTextGroup: {
    flex: 1,
  },
  ctaTitle: {
    color: colors.bg,
    fontSize: fontSizes.md,
    fontWeight: '800',
    letterSpacing: 2,
  },
  ctaSubtitle: {
    color: `${colors.bg}99`,
    fontSize: fontSizes.xs,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  ctaArrow: {
    color: colors.bg,
    fontSize: fontSizes.xl,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 3,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },

  emptyIcon: {
    fontSize: 28,
    color: colors.textMuted,
  },
});
