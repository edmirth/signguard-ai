import React, { useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { useAuthContext } from '@/providers/AuthProvider';
import { useScans } from '@/hooks/useScans';
import { useScanLimit } from '@/hooks/useScanLimit';
import { ScanLimitBanner } from '@/components/ScanLimitBanner';
import { ScanCard } from '@/components/ScanCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Scan } from '@/types/database';
import { trackEvent } from '@/lib/analytics';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { profile } = useAuthContext();
  const { scans, isLoading, fetchScans } = useScans();
  const { canScan, scansUsed, scansLimit, resetsAt, isPro } = useScanLimit();

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const recentScans = scans.slice(0, 5);

  function handleScanPress() {
    if (canScan) {
      router.push('/scan');
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
    <View style={styles.container}>
      <FlatList
        data={recentScans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}
            </Text>

            <ScanLimitBanner
              isPro={isPro}
              scansUsed={scansUsed}
              scansLimit={isPro ? Infinity : scansLimit}
              resetsAt={resetsAt ?? ''}
              onUpgrade={handleUpgrade}
            />

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleScanPress}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaIcon}>📷</Text>
              <Text style={styles.ctaText}>Scan a Contract</Text>
            </TouchableOpacity>

            {recentScans.length > 0 && (
              <Text style={styles.sectionTitle}>Recent Scans</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <ScanCard scan={item} onPress={() => handleScanCardPress(item)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="📄"
              title="No scans yet"
              subtitle="Tap the button above to scan your first contract"
            />
          ) : null
        }
      />
    </View>
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
  greeting: {
    color: colors.text,
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  ctaIcon: {
    fontSize: 20,
  },
  ctaText: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
});
