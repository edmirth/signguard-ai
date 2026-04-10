import { useState } from 'react';
import {
  Alert,
  Linking,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, fontSizes, fonts, spacing, radius } from '@/constants/theme';
import { trackEvent } from '@/lib/analytics';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle, signInWithEmail, signUpWithEmail, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const anyLoading = emailLoading || appleLoading || googleLoading || isLoading;

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'signup') {
      if (!fullName.trim()) {
        Alert.alert('Missing fields', 'Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password mismatch', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak password', 'Password must be at least 6 characters.');
        return;
      }
    }

    setEmailLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, fullName.trim());
        trackEvent('sign_up_completed', { method: 'email' });
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Verify your email then sign in.',
          [{ text: 'OK', onPress: () => setMode('signin') }]
        );
      } else {
        await signInWithEmail(email.trim(), password);
        trackEvent('sign_in_completed', { method: 'email' });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert(mode === 'signup' ? 'Sign Up Failed' : 'Sign In Failed', msg);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signInWithApple();
      trackEvent('sign_up_completed', { method: 'apple' });
      router.replace('/(tabs)');
    } catch {
      // cancelled silently
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
    } catch (err: unknown) {
      const isCancelled = err instanceof Error && err.message === 'cancelled';
      if (!isCancelled) {
        Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Mark */}
        <View style={styles.markSection}>
          <View style={styles.mark}>
            <View style={styles.markInner} />
          </View>
          <Text style={styles.wordmark}>SIGNGUARD</Text>
          <Text style={styles.wordmarkSub}>AI CONTRACT ANALYSIS</Text>
        </View>

        <Text style={styles.headline}>Never sign blind again.</Text>
        <Text style={styles.subtitle}>
          Scan any contract. Get an instant risk report in seconds.
        </Text>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
            onPress={() => setMode('signin')}
          >
            <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
              SIGN IN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
              SIGN UP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email form */}
        <View style={styles.form}>
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!anyLoading}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!anyLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!anyLoading}
          />
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!anyLoading}
            />
          )}

          <TouchableOpacity
            style={[styles.primaryButton, anyLoading && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={anyLoading}
          >
            {emailLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'signup' ? 'CREATE ACCOUNT →' : 'SIGN IN →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* OAuth buttons */}
        <View style={styles.oauthButtons}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.oauthButton, styles.appleButton]}
              onPress={handleApple}
              disabled={anyLoading}
            >
              {appleLoading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.oauthButtonText, styles.appleButtonText]}>
                   Continue with Apple
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.oauthButton, styles.googleButton]}
            onPress={handleGoogle}
            disabled={anyLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={[styles.oauthButtonText, styles.googleButtonText]}>
                G  Continue with Google
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={styles.legal}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL('https://signguard.ai/terms')}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL('https://signguard.ai/privacy')}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },

  // Mark / logo
  markSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  markInner: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  wordmark: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    letterSpacing: 5,
    marginBottom: 4,
  },
  wordmarkSub: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 3,
  },

  headline: {
    color: colors.text,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 3,
    width: '100%',
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm - 2,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.accent,
  },
  modeTabText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
  },
  modeTabTextActive: {
    color: colors.bg,
  },

  // Form
  form: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: fontSizes.md,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.bg,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: fonts.mono,
  },

  // OAuth
  oauthButtons: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  oauthButton: {
    width: '100%',
    height: 50,
    borderRadius: radius.sm,
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
  oauthButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#000000',
  },
  googleButtonText: {
    color: colors.text,
  },

  // Legal
  legal: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  legalLink: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
