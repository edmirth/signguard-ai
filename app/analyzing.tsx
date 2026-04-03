import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing } from '@/constants/theme';

// Placeholder — implemented fully in US-016 (useAnalyzeContract + LoadingAnalysis)
export default function AnalyzingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.text}>Analyzing your contract…</Text>
      <Text style={styles.sub}>This will be ready in US-016</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  sub: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
});
