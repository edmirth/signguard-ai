import Purchases from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '';
let configured = false;

export function initRevenueCat(userId: string): void {
  if (!REVENUECAT_API_KEY) return;
  if (!configured) {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
    configured = true;
  } else {
    Purchases.logIn(userId);
  }
}

export function resetRevenueCat(): void {
  if (!configured) return;
  Purchases.logOut().catch(() => {});
}
