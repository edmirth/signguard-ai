import PostHog from 'posthog-react-native';

let posthog: PostHog | null = null;

export function initAnalytics(): void {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  posthog = new PostHog(key, { host });
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  posthog?.identify(userId, properties as Record<string, string>);
}

export function trackEvent(event: string, properties?: Record<string, string | number | boolean | null>): void {
  posthog?.capture(event, properties);
}
