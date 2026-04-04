import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle, isLoading } = useAuth();
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signInWithApple();
      trackEvent('sign_up_completed', { method: 'apple' });
      router.replace('/(tabs)');
    } catch {
      // sign-in cancelled or failed silently
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      trackEvent('sign_up_completed', { method: 'google' });
      router.replace('/(tabs)');
    } catch {
      // sign-in cancelled or failed silently
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Logo placeholder */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SG</Text>
        </View>
        <Text style={styles.logoLabel}>SignGuard AI</Text>
      </View>

      {/* Headline */}
      <Text style={styles.headline}>Never sign blind again.</Text>
      <Text style={styles.subtitle}>
        Scan any contract and get an instant AI-powered risk report in seconds.
      </Text>

      {/* Auth buttons */}
      <View style={styles.buttonsContainer}>
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleApple}
            disabled={appleLoading || googleLoading || isLoading}
            accessibilityLabel="Continue with Apple"
          >
            {appleLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={[styles.buttonText, styles.appleButtonText]}>
                 Continue with Apple
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogle}
          disabled={appleLoading || googleLoading || isLoading}
          accessibilityLabel="Continue with Google"
        >
          {googleLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={[styles.buttonText, styles.googleButtonText]}>
              G  Continue with Google
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Legal disclaimer */}
      <Text style={styles.legal}>
        By continuing, you agree to our{' '}
        <Text style={styles.legalLink}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.legalLink}>Privacy Policy</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: colors.text,
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
  },
  logoLabel: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headline: {
    color: colors.text,
    fontSize: fontSizes['3xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['3xl'],
  },
  buttonsContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButton: {
    backgroundColor: '#ffffff',
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  buttonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  appleButtonText: {
    color: colors.bg,
  },
  googleButtonText: {
    color: colors.text,
  },
  legal: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    position: 'absolute',
    bottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  legalLink: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
