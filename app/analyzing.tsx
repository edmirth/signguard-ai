import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { useAnalyzeContract } from '@/hooks/useAnalyzeContract';
import { LoadingAnalysis } from '@/components/LoadingAnalysis';
import { getPendingScan, clearPendingScan } from '@/lib/pendingScan';
import { trackEvent } from '@/lib/analytics';

export default function AnalyzingScreen() {
  const { analyze, isAnalyzing, error, progress } = useAnalyzeContract();

  useEffect(() => {
    const { base64, mimeType } = getPendingScan();
    if (!base64) {
      router.replace('/(tabs)/scan');
      return;
    }

    analyze(base64, mimeType).then((result) => {
      clearPendingScan();
      if (result) {
        trackEvent('scan_completed', { scan_id: result.scanId });
        router.replace(`/report/${result.scanId}`);
      }
      // error state is shown below via the error effect if result is null
    });
  }, []);

  useEffect(() => {
    if (error) {
      clearPendingScan();
      if (error.code === 'scan_limit_reached') {
        trackEvent('paywall_shown', { trigger: 'scan_limit_reached' });
        router.replace('/paywall');
      } else {
        trackEvent('scan_failed', { error_code: error.code });
      }
    }
  }, [error]);

  function handleRetry() {
    router.replace('/(tabs)/scan');
  }

  if (error && error.code !== 'scan_limit_reached') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoadingAnalysis progress={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  retryText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});
