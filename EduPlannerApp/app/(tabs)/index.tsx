import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  Card,
  Title,
  Paragraph,
  HelperText,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { generateStudyPlan } from '@/utils/api';

interface StudyPlanInput {
  subject: string;
  level: string;
  duration: string;
  dailyTime: string;
  userId?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('beginner');
  const [duration, setDuration] = useState('');
  const [dailyTime, setDailyTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlan = async () => {
    if (loading) return; // 🚫 prevent double-submission
  
    if (!subject || !duration || !dailyTime) {
      setError('Please fill out all fields.');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
      const userId = await SecureStore.getItemAsync('userId');
      console.log("🧪 USER ID USED:", userId);
      const payload = {
        subject,
        level,
        duration,
        dailyTime,
        userId: userId || 'guest',
      };
      const response = await generateStudyPlan(payload);
      router.push('/weekly');
    } catch (err) {
      console.error('❌ Generate plan error:', err);
      setError('Failed to generate study plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.streakCard}>
        <Card.Content>
          <Title>Study Streak</Title>
          <Paragraph>Current Streak: 0 days</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.formCard}>
        <Card.Content>
          <Title>Generate Study Plan</Title>

          <TextInput
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Level (beginner / intermediate / expert)"
            value={level}
            onChangeText={setLevel}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Duration (e.g., 2 weeks)"
            value={duration}
            onChangeText={setDuration}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Daily Study Time (e.g., 2 hours)"
            value={dailyTime}
            onChangeText={setDailyTime}
            style={styles.input}
            mode="outlined"
          />

          {error ? <HelperText type="error">{error}</HelperText> : null}

          <Button
            mode="contained"
            onPress={handleGeneratePlan}
            loading={loading}
            style={styles.button}
          >
            Generate Plan
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  streakCard: {
    marginBottom: 16,
    backgroundColor: '#f3f3f3',
  },
  formCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
});
