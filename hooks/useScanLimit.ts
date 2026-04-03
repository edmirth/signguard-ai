import { useAuthContext } from '@/providers/AuthProvider';
import { SCAN_LIMIT_FREE } from '@/constants/config';

export function useScanLimit() {
  const { profile } = useAuthContext();

  const isPro = profile?.plan === 'pro';
  const scansUsed = profile?.scans_used ?? 0;
  const scansLimit = isPro ? Infinity : (profile?.scans_limit ?? SCAN_LIMIT_FREE);
  const resetsAt = profile?.scans_reset_at ?? null;
  const canScan = isPro || scansUsed < scansLimit;

  return { canScan, scansUsed, scansLimit, resetsAt, isPro };
}
