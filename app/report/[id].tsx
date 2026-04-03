import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/theme';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Report: {id}</Text>
      <Text style={{ color: colors.textMuted }}>Full report — coming in US-019</Text>
    </View>
  );
}
