import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';

export default function ClauseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Clause: {id}</Text>
      <Text style={{ color: colors.textMuted }}>Full clause detail — coming in US-024</Text>
    </View>
  );
}
