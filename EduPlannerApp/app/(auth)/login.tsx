import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text, Card, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { loginUser } from '../../utils/api';
import { jwtDecode } from 'jwt-decode';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingLogin, setCheckingLogin] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUserId = await SecureStore.getItemAsync('userId');
      if (storedUserId) {
        router.replace('/(tabs)');
      } else {
        setCheckingLogin(false);
      }
    };

    checkAuth();
  }, []);


  const handleLogin = async () => {
    try {
      const response = await loginUser(email, password);
      const { token } = response;
  
      // Decode token to get userId
      const decoded: any = jwtDecode(token);
      const userId = decoded.userId;
  
      await SecureStore.setItemAsync('userId', userId);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  };
  
  

  if (checkingLogin) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Login to EduPlanner</Title>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            contentStyle={{ paddingVertical: 6 }}
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/signup')}
            textColor="#6366f1"
            style={styles.linkButton}
          >
            Don't have an account? Sign up
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6366f1',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  linkButton: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
});
