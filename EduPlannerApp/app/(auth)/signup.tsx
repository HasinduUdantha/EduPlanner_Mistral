import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button, Text, Card, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { signupUser } from '../../utils/api';
import { jwtDecode } from 'jwt-decode';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [error, setError] = useState('');
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

const handleSignup = async () => {
  try {
    const res = await signupUser(email, password);
    console.log('Signup success:', res);

    const { token } = res;
    const decoded: any = jwtDecode(token);
    const userId = decoded.userId;

    await SecureStore.setItemAsync('userId', userId);
    router.replace('/(tabs)');
  } catch (err: any) {
    setError(err.message); // Show real message
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
          <Title style={styles.title}>Create a New Account</Title>

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
            onPress={handleSignup}
            style={styles.button}
            contentStyle={{ paddingVertical: 6 }}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/login')}
            textColor="#6366f1"
            style={styles.linkButton}
          >
            Already have an account? Log in
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
