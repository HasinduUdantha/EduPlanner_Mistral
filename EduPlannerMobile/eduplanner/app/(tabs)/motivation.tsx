import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  HelperText,
  Menu,
} from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
// Update the path below to the correct relative path if needed
import { generateMotivation } from '../../utils/api';

export default function MotivationScreen() {
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [motivation, setMotivation] = useState('');
  const [emotion, setEmotion] = useState('');
  const [userId, setUserId] = useState('guest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [menuVisible, setMenuVisible] = useState(false);

  const emotionOptions = [
    'motivated',
    'tired',
    'confused',
    'stressed',
    'burned out',
    'discouraged',
    'anxious',
    'excited',
    'confident',
    'neutral',
  ];

  useEffect(() => {
    (async () => {
      const storedUserId = await SecureStore.getItemAsync('userId');
      if (storedUserId) setUserId(storedUserId);
    })();
  }, []);

  const getMotivation = async () => {
    if (!subject || !emotion.trim()) {
      setError('Please enter subject and select your feeling.');
      return;
    }

    setError('');
    setLoading(true);
    setMotivation('');
    try {
      const res = await generateMotivation({
        userId,
        subject,
        emotion,
        userFeedback: feedback,
      });
      setMotivation(res.motivation);
    } catch (err) {
      setError('Failed to fetch motivation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>How are you feeling about your studies?</Text>

        <TextInput
          label="Subject (e.g. Python)"
          value={subject}
          onChangeText={setSubject}
          style={styles.input}
          mode="outlined"
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="contained"
              onPress={() => setMenuVisible(true)}
              style={styles.dropdown}
            >
              {emotion ? `Feeling: ${emotion}` : 'Select your feeling'}
            </Button>
          }
        >
          {emotionOptions.map((option) => (
            <Menu.Item
              key={option}
              onPress={() => {
                setEmotion(option);
                setMenuVisible(false);
              }}
              title={option.charAt(0).toUpperCase() + option.slice(1)}
            />
          ))}
        </Menu>

        <TextInput
          label="Feedback (optional)"
          value={feedback}
          onChangeText={setFeedback}
          style={styles.input}
          mode="outlined"
          multiline
          placeholder="e.g. I feel stuck today"
        />

        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={getMotivation}
          loading={loading}
          style={styles.button}
        >
          Generate Motivation
        </Button>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 16 }} />
        ) : (
          motivation && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.motivationText}>{motivation}</Text>
              </Card.Content>
            </Card>
          )
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dropdown: {
    marginBottom: 12,
    backgroundColor: '#6366f1',
  },
  button: {
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  card: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 3,
  },
  motivationText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
    lineHeight: 22,
  },
});
