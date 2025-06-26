// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Card, Title, Paragraph, Snackbar } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setLoading(true);
      
      // Clear only authentication data
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('userToken');
      
      // Optional: Clear user info if you want fresh login
      await SecureStore.deleteItemAsync('userName');
      await SecureStore.deleteItemAsync('userEmail');
      
      setSnackbarVisible(true);
      
      // Navigate to login page
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still navigate to login
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>App Settings</Title>
          <Paragraph style={styles.description}>
            Manage your app preferences
          </Paragraph>
          
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.button}
            loading={loading}
            disabled={loading}
            buttonColor="#ef4444"
            icon="logout"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </Card.Content>
      </Card>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        Logged out successfully!
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    color: '#6366f1',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  snackbar: {
    backgroundColor: '#10b981',
  },
});
