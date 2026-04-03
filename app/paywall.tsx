import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';

export default function PaywallScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
        Unlock SignGuard Pro
      </Text>
      <Text style={{ color: colors.textMuted, marginBottom: 24 }}>Full paywall — coming in US-022</Text>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: colors.accent }}>Close</Text>
      </Pressable>
    </View>
  );
}
