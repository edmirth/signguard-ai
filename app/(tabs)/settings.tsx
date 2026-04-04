import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { colors, fontSizes, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

const AI_DISCLAIMER =
  'SignGuard AI uses artificial intelligence to analyze contracts and provide general guidance. ' +
  'The analysis provided is for informational purposes only and does not constitute legal advice. ' +
  'AI-generated content may contain errors or omissions. Always consult a qualified attorney before ' +
  'signing any legal document. SignGuard AI is not a law firm and no attorney-client relationship ' +
  'is created by your use of this app.';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const { isPro } = useSubscription();

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '';
  const appVersion = '1.0.0';

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all scan history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Are you sure?',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: () => {
                    // Contact support to delete account
                    Linking.openURL('mailto:support@signguard.ai?subject=Delete%20Account%20Request');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  async function handleShare() {
    const message = 'Check out SignGuard AI — snap a photo of any contract and get an instant AI risk report!';
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync('https://signguard.ai', { dialogTitle: message });
    } else {
      Linking.openURL(`https://signguard.ai`);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Settings</Text>

      {/* Profile Section */}
      <Section title="Profile">
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          <View style={[styles.planBadge, isPro ? styles.planBadgePro : styles.planBadgeFree]}>
            <Text style={[styles.planBadgeText, isPro ? styles.planBadgeTextPro : styles.planBadgeTextFree]}>
              {isPro ? 'Pro' : 'Free'}
            </Text>
          </View>
        </View>
      </Section>

      {/* Subscription Section */}
      <Section title="Subscription">
        <SettingsRow label="Current Plan" value={isPro ? 'SignGuard Pro' : 'Free (2 scans/month)'} />
        {isPro ? (
          <SettingsButton
            label="Manage Subscription"
            onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
          />
        ) : (
          <SettingsButton
            label="Upgrade to Pro"
            accent
            onPress={() => router.push('/paywall')}
          />
        )}
      </Section>

      {/* Support Section */}
      <Section title="Support">
        <SettingsButton
          label="Contact Support"
          onPress={() => Linking.openURL('mailto:support@signguard.ai')}
        />
        <SettingsButton
          label="Rate the App"
          onPress={() =>
            Linking.openURL(
              'itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review'
            )
          }
        />
        <SettingsButton label="Share with a Friend" onPress={handleShare} />
      </Section>

      {/* Legal Section */}
      <Section title="Legal">
        <SettingsButton
          label="Privacy Policy"
          onPress={() => Linking.openURL('https://signguard.ai/privacy')}
        />
        <SettingsButton
          label="Terms of Service"
          onPress={() => Linking.openURL('https://signguard.ai/terms')}
        />
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>AI Disclaimer</Text>
          <Text style={styles.disclaimerText}>{AI_DISCLAIMER}</Text>
        </View>
      </Section>

      {/* Account Section */}
      <Section title="Account">
        <SettingsButton label="Sign Out" destructive onPress={handleSignOut} />
        <SettingsButton label="Delete Account" destructive onPress={handleDeleteAccount} />
      </Section>

      {/* Version */}
      <Text style={styles.version}>SignGuard AI v{appVersion}</Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsRowLabel}>{label}</Text>
      <Text style={styles.settingsRowValue}>{value}</Text>
    </View>
  );
}

function SettingsButton({
  label,
  accent,
  destructive,
  onPress,
}: {
  label: string;
  accent?: boolean;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingsButton} onPress={onPress} activeOpacity={0.7}>
      <Text
        style={[
          styles.settingsButtonLabel,
          accent && styles.settingsButtonAccent,
          destructive && styles.settingsButtonDestructive,
        ]}
      >
        {label}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  screenTitle: {
    color: colors.text,
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  planBadgePro: {
    backgroundColor: `${colors.proGold}22`,
    borderWidth: 1,
    borderColor: `${colors.proGold}55`,
  },
  planBadgeFree: {
    backgroundColor: `${colors.accent}22`,
    borderWidth: 1,
    borderColor: `${colors.accent}55`,
  },
  planBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  planBadgeTextPro: {
    color: colors.proGold,
  },
  planBadgeTextFree: {
    color: colors.accent,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  settingsRowLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  settingsRowValue: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  settingsButtonLabel: {
    color: colors.text,
    fontSize: fontSizes.md,
  },
  settingsButtonAccent: {
    color: colors.accent,
    fontWeight: '600',
  },
  settingsButtonDestructive: {
    color: colors.danger,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg + 2,
  },
  disclaimerBox: {
    padding: spacing.lg,
  },
  disclaimerTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
  version: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
