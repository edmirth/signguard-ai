import Purchases, { PACKAGE_TYPE } from 'react-native-purchases';
import { useSubscriptionContext } from '@/providers/SubscriptionProvider';

export function useSubscription() {
  const { customerInfo, isPro, isLoading, refresh } = useSubscriptionContext();

  const plan = isPro ? 'pro' : 'free';

  async function purchaseMonthly(): Promise<void> {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.packageType === PACKAGE_TYPE.MONTHLY
    );
    if (!pkg) throw new Error('Monthly package not available');
    await Purchases.purchasePackage(pkg);
    await refresh();
  }

  async function purchaseAnnual(): Promise<void> {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p) => p.packageType === PACKAGE_TYPE.ANNUAL
    );
    if (!pkg) throw new Error('Annual package not available');
    await Purchases.purchasePackage(pkg);
    await refresh();
  }

  async function restorePurchases(): Promise<void> {
    await Purchases.restorePurchases();
    await refresh();
  }

  return {
    isPro,
    plan,
    isLoading,
    customerInfo,
    purchaseMonthly,
    purchaseAnnual,
    restorePurchases,
  };
}
