import Purchases from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '';

export function initRevenueCat(userId: string): void {
  if (!REVENUECAT_API_KEY) return;
  Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
}
