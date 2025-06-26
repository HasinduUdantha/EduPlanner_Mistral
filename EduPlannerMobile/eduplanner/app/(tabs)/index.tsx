import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert,
  RefreshControl 
} from 'react-native';
import {
  Button,
  Text,
  TextInput,
  Card,
  Title,
  Paragraph,
  HelperText,
  Chip,
  Surface,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { generateStudyPlan, getUserPlans, getDailyMotivation } from '../../utils/api';
import { MaterialIcons } from '@expo/vector-icons';

interface StudyPlanInput {
  subject: string;
  level: string;
  duration: string;
  dailyTime: string;
  learningStyle?: string;
  goals?: string;
  userId?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  
  // Form state
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('beginner');
  const [duration, setDuration] = useState('1 week');
  const [dailyTime, setDailyTime] = useState('1 hour');
  const [goals, setGoals] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Data state
  const [streak, setStreak] = useState(0);
  const [motivation, setMotivation] = useState('');
  const [userName, setUserName] = useState('');
  const [recentPlans, setRecentPlans] = useState([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      const storedUserName = await SecureStore.getItemAsync('userName');
      
      if (storedUserName) {
        setUserName(storedUserName);
      }

      // Load user data in parallel
      const [motivationData, plansData] = await Promise.all([
        getDailyMotivation().catch(() => ({ motivation: 'Keep learning and growing every day!' })),
        getUserPlans(userId || 'guest').catch(() => ({ plans: [] }))
      ]);

      setMotivation(motivationData.motivation);
      setRecentPlans(plansData.plans?.slice(0, 3) || []);
      
      // Calculate streak from plans data
      // This is a simplified calculation - you might want to implement proper streak logic
      setStreak(plansData.plans?.length || 0);
      
    } catch (err) {
      console.error('Error loading home data:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const validateForm = () => {
    if (!subject.trim()) {
      setError('Please enter a subject to study');
      return false;
    }
    if (!duration) {
      setError('Please select a duration');
      return false;
    }
    if (!dailyTime) {
      setError('Please select daily study time');
      return false;
    }
    return true;
  };

  const handleGeneratePlan = async () => {
    if (loading) return;

    if (!validateForm()) {
      setSnackbarMessage(error);
      setSnackbarVisible(true);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const userId = await SecureStore.getItemAsync('userId');
      console.log("🧪 USER ID USED:", userId);

      const payload: StudyPlanInput = {
        subject: subject.trim(),
        level,
        duration,
        dailyTime,
        goals: goals.trim(),
        userId: userId || 'guest',
      };
      console.log("📋 Payload for plan generation:", payload);
      const response = await generateStudyPlan(payload);
      console.log("📊 Generated study plan:", response);
      
      setSnackbarMessage('Study plan generated successfully!');
      setSnackbarVisible(true);
      
      // Navigate to the plan view with the generated plan
      router.push({
        pathname: '/weekly',
        params: { plan: JSON.stringify(response) }
      });
      
    } catch (err: any) {
      console.error('❌ Generate plan error:', err);
      const errorMessage = err.message || 'Failed to generate study plan. Please try again.';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const levelOptions = ['beginner', 'intermediate', 'advanced'];
  const durationOptions = ['1 week', '2 weeks', '3 weeks', '4 weeks', '6 weeks', '8 weeks'];
  const timeOptions = ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours'];
  // const styleOptions = ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title style={styles.welcomeTitle}>
            Welcome back{userName ? `, ${userName}` : ''}! 👋
          </Title>
          <Paragraph style={styles.welcomeSubtitle}>
            Ready to continue your learning journey?
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Motivation Card */}
      {motivation && (
        <Card style={styles.motivationCard}>
          <Card.Content>
            <View style={styles.motivationHeader}>
              <MaterialIcons name="lightbulb-outline" size={24} color="#6366f1" />
              <Title style={styles.motivationTitle}>Daily Motivation</Title>
            </View>
            <Paragraph style={styles.motivationText}>{motivation}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Streak Card */}
      <Surface style={styles.streakCard} elevation={2}>
        <View style={styles.streakContent}>
          <MaterialIcons name="local-fire-department" size={32} color="#ff6b35" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>Study Plans Created</Text>
          </View>
        </View>
      </Surface>

      {/* Generate Plan Form */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.formTitle}>Create New Study Plan</Title>
          
          <TextInput
            label="Subject *"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Data Structures and Algorithms"
            left={<TextInput.Icon icon="book-open-variant" />}
          />

          <Text style={styles.sectionLabel}>Level</Text>
          <View style={styles.chipContainer}>
            {levelOptions.map((option) => (
              <Chip
                key={option}
                selected={level === option}
                onPress={() => setLevel(option)}
                style={[styles.chip, level === option && styles.selectedChip]}
                textStyle={level === option && styles.selectedChipText}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Chip>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Duration</Text>
          <View style={styles.chipContainer}>
            {durationOptions.map((option) => (
              <Chip
                key={option}
                selected={duration === option}
                onPress={() => setDuration(option)}
                style={[styles.chip, duration === option && styles.selectedChip]}
                textStyle={duration === option && styles.selectedChipText}
              >
                {option}
              </Chip>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Daily Study Time</Text>
          <View style={styles.chipContainer}>
            {timeOptions.map((option) => (
              <Chip
                key={option}
                selected={dailyTime === option}
                onPress={() => setDailyTime(option)}
                style={[styles.chip, dailyTime === option && styles.selectedChip]}
                textStyle={dailyTime === option && styles.selectedChipText}
              >
                {option}
              </Chip>
            ))}
          </View>
            
          <TextInput
            label="Goals (Optional)"
            value={goals}
            onChangeText={setGoals}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="e.g., Master sorting algorithms and prepare for technical interviews"
            left={<TextInput.Icon icon="flag-outline" />}
          />

          <Button
            mode="contained"
            onPress={handleGeneratePlan}
            style={styles.button}
            loading={loading}
            disabled={loading}
            contentStyle={styles.buttonContent}
            icon="auto-fix"
          >
            {loading ? 'Generating Plan...' : 'Generate Study Plan'}
          </Button>
        </Card.Content>
      </Card>

      {/* Recent Plans */}
      {recentPlans.length > 0 && (
        <Card style={styles.recentCard}>
          <Card.Content>
            <Title style={styles.recentTitle}>Recent Plans</Title>
            {recentPlans.map((plan: any, index) => (
              <Surface key={index} style={styles.planItem} elevation={1}>
                <View style={styles.planContent}>
                  <Text style={styles.planSubject}>{plan.plan?.subject}</Text>
                  <Text style={styles.planDetails}>
                    {plan.plan?.level} • {plan.plan?.duration}
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
              </Surface>
            ))}
            <Button
              mode="text"
              onPress={() => router.push('/weekly')}
              style={styles.viewAllButton}
            >
              View All Plans
            </Button>
          </Card.Content>
        </Card>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#6366f1',
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: 'white',
    opacity: 0.9,
    fontSize: 16,
  },
  motivationCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  motivationTitle: {
    marginLeft: 8,
    color: '#6366f1',
    fontSize: 18,
  },
  motivationText: {
    fontStyle: 'italic',
    color: '#4b5563',
    lineHeight: 22,
  },
  streakCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakInfo: {
    marginLeft: 16,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  formCard: {
    margin: 16,
    marginTop: 8,
  },
  formTitle: {
    color: '#6366f1',
    marginBottom: 16,
    fontSize: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
    backgroundColor: '#f3f4f6',
  },
  selectedChip: {
    backgroundColor: '#6366f1',
  },
  selectedChipText: {
    color: 'white',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  recentCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  recentTitle: {
    color: '#6366f1',
    marginBottom: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  planContent: {
    flex: 1,
  },
  planSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  planDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  viewAllButton: {
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: '#6366f1',
  },
});
