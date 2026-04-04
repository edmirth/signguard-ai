import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { trackEvent } from '@/lib/analytics';

const VALUE_PROPS = [
  'Unlimited contract scans',
  'AI negotiation scripts for every clause',
  'Market rate comparisons',
  'Contract vault & cloud storage',
  'Priority AI analysis',
];

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { purchaseMonthly, purchaseAnnual, restorePurchases } = useSubscription();

  async function handleSubscribe() {
    setIsPurchasing(true);
    try {
      if (selectedPlan === 'monthly') {
        await purchaseMonthly();
      } else {
        await purchaseAnnual();
      }
      trackEvent('subscription_started', { plan: selectedPlan });
      router.back();
    } catch (err: unknown) {
      // User cancelled — don't show error
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('cancelled') || message.includes('cancel')) {
        trackEvent('subscription_cancelled', { plan: selectedPlan });
      } else {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleRestore() {
    setIsRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Restored', 'Your purchases have been restored.');
      router.back();
    } catch {
      Alert.alert('Restore Failed', 'No purchases found to restore.');
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Unlock SignGuard Pro</Text>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Value props */}
        <View style={styles.valuePropsContainer}>
          {VALUE_PROPS.map((prop) => (
            <View key={prop} style={styles.valuePropRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Text style={styles.valuePropText}>{prop}</Text>
            </View>
          ))}
        </View>

        {/* Plan toggle */}
        <View style={styles.planToggle}>
          <Pressable
            style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>
              $14.99
            </Text>
            <Text style={[styles.planLabel, selectedPlan === 'monthly' && styles.planLabelSelected]}>
              per month
            </Text>
          </Pressable>

          <Pressable
            style={[styles.planOption, selectedPlan === 'annual' && styles.planOptionSelected]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 44%</Text>
            </View>
            <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.planPriceSelected]}>
              $99.99
            </Text>
            <Text style={[styles.planLabel, selectedPlan === 'annual' && styles.planLabelSelected]}>
              per year
            </Text>
          </Pressable>
        </View>

        {/* Subscribe button */}
        <Pressable
          style={[styles.subscribeButton, isPurchasing && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              Subscribe {selectedPlan === 'monthly' ? 'Monthly' : 'Annually'}
            </Text>
          )}
        </Pressable>

        {/* Restore purchases */}
        <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring}>
          {isRestoring ? (
            <ActivityIndicator color={colors.textMuted} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </Pressable>

        <Text style={styles.legalText}>
          Subscriptions auto-renew unless cancelled. Cancel anytime in your device settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.xl,
    top: spacing['2xl'],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  valuePropsContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  valuePropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.accent}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.accent,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
  },
  valuePropText: {
    color: colors.text,
    fontSize: fontSizes.md,
    flex: 1,
  },
  planToggle: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  planOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.card,
    position: 'relative',
  },
  planOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}11`,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  saveBadgeText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  planPriceSelected: {
    color: colors.text,
  },
  planLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  planLabelSelected: {
    color: colors.textSecondary,
  },
  subscribeButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  restoreText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  legalText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
