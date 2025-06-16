import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Checkbox, Text } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { getLatestStudyPlan, updateStudyPlanProgress } from '@/utils/api';

interface PlanData {
  _id: string;
  userId: string;
  plan: {
    subject: string;
    language: string;
    level: string;
    duration: string;
    daily_time: string;
    topics: string[];
  };
  progress?: Progress;
}

interface Progress {
  [dayKey: string]: {
    [lessonIndex: number]: boolean;
  };
}

export default function WeeklyPlanScreen() {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId');
      if (!userId) return;

      const latestPlan = await getLatestStudyPlan(userId);
      setPlanData(latestPlan);

      if (latestPlan?.progress) {
        setProgress(latestPlan.progress);
      }
    } catch (error) {
      console.error('Error loading plan from MongoDB:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (dayKey: string, lessonIndex: number) => {
    const updatedProgress = {
      ...progress,
      [dayKey]: {
        ...(progress[dayKey] || {}),
        [lessonIndex]: !((progress[dayKey] || {})[lessonIndex]),
      },
    };
    setProgress(updatedProgress);

    try {
      if (planData?._id) {
        await updateStudyPlanProgress(planData._id, updatedProgress);
      }
    } catch (error) {
      console.error('Error updating progress in MongoDB:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading plan...</Text>
      </View>
    );
  }

  if (!planData) {
    return (
      <View style={styles.container}>
        <Text>No study plan found. Generate a plan from the home screen.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.weekCard}>
        <Card.Content>
          <Title>Daily Study Plan</Title>
          <Paragraph>Subject: {planData.plan.subject || planData.plan.language}</Paragraph>
          <Paragraph>Level: {planData.plan.level}</Paragraph>
          <Paragraph>Duration: {planData.plan.duration}</Paragraph>
          <Paragraph>
              Daily Time: {planData.plan.daily_time?.split('/')[0].replace(/\*\*/g, '').trim()}
          </Paragraph>

        </Card.Content>
      </Card>

      {planData.plan.topics.map((topic, index) => (
        <Card key={index} style={styles.dayCard}>
          <Card.Content>
            <Title>{`Day ${index + 1}`}</Title>
            <View style={styles.lessonItem}>
              <Checkbox
                status={(progress[`Day ${index + 1}`]?.[0] ? 'checked' : 'unchecked')}
                onPress={() => toggleTask(`Day ${index + 1}`, 0)}
              />
              <Text>{topic}</Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  weekCard: {
    marginBottom: 16,
  },
  dayCard: {
    marginBottom: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});
