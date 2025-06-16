// app/(tabs)/settings.tsx
import { View, StyleSheet } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  const handleClearData = async () => {
    try {
      await AsyncStorage.clear();
      await SecureStore.deleteItemAsync('userId');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>App Settings</Title>
          <Paragraph>Manage your app preferences and data</Paragraph>
          <Button mode="outlined" onPress={handleClearData} style={styles.button}>
            Clear All Data & Logout
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  card: { marginBottom: 16 },
  button: { marginTop: 16 },
});
