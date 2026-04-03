import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text }}>Login — coming in US-008</Text>
    </View>
  );
}
