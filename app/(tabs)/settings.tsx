import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Settings — coming in US-025</Text>
    </View>
  );
}
