import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function ScanScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Scan — coming in US-013</Text>
    </View>
  );
}
