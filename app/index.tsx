import { Redirect } from 'expo-router';
import { useAuthContext } from '@/providers/AuthProvider';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/theme';

export default function Index() {
  const { session, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
