import React, { createContext, useContext, useEffect, useState } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { useAuthContext } from '@/providers/AuthProvider';
import { initRevenueCat } from '@/lib/revenue-cat';

// Accounts that always get Pro access for internal testing (no payment required)
const TEST_PRO_EMAILS = new Set(['edmirthaqi2307@gmail.com']);

interface SubscriptionContextValue {
  customerInfo: CustomerInfo | null;
  isPro: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  customerInfo: null,
  isPro: false,
  isLoading: true,
  refresh: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchCustomerInfo() {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch {
      // RevenueCat not configured yet (e.g. no API key)
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setCustomerInfo(null);
      setIsLoading(false);
      return;
    }

    initRevenueCat(user.id);
    fetchCustomerInfo();

    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [user?.id]);

  const isTestPro = !!user?.email && TEST_PRO_EMAILS.has(user.email);
  const isPro = isTestPro || !!customerInfo?.entitlements.active['pro_access'];

  return (
    <SubscriptionContext.Provider value={{ customerInfo, isPro, isLoading, refresh: fetchCustomerInfo }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  return useContext(SubscriptionContext);
}
