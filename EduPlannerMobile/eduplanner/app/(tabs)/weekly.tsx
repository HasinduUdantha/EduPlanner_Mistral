import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Checkbox, Text } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { getLatestStudyPlan, updateStudyPlanProgress } from '../../utils/api';

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
    console.log("Loading study plan from MongoDB...");
    try {
      // const userId = await SecureStore.getItemAsync('userId');
      // if (!userId) return;

      // const latestPlan = await getLatestStudyPlan(userId);
      const latestPlan = {
        _id: { $oid: "685d369d96d63dc229e32100" },
        userId: "685d2316e5b15301aa0fc6be",
        plan: {
          title: "Javascript beginner Study Plan",
          subject: "Javascript",
          level: "beginner",
          duration: "** 2 weeks (14 days)",
          daily_time: "** 1 hour/day (60 mins)",
          total_days: { $numberInt: "14" },
          days: [
            {
              day: { $numberInt: "1" },
              topics: [
                {
                  topic_name: "Javascript Introduction",
                  sub_topics: ["JavaScript Overview", "JavaScript Syntax"],
                },
              ],
              activities: [],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "2" },
              topics: [],
              activities: ["Javascript Practice", "Javascript Quiz"],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "3" },
              topics: [
                {
                  topic_name: "JavaScript Variables",
                  sub_topics: [
                    "JavaScript Var",
                    "JavaScript Let",
                    "JavaScript Const",
                  ],
                },
              ],
              activities: [],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "4" },
              topics: [],
              activities: ["Javascript Type Casting", "Javascript Operators"],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "5" },
              topics: [
                {
                  topic_name: "JavaScript Strings",
                  sub_topics: ["JavaScript String Methods"],
                },
              ],
              activities: [],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "6" },
              topics: [],
              activities: [
                "Javascript String Manipulation",
                "Javascript String Practice",
              ],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "7" },
              topics: [
                {
                  topic_name: "JavaScript Arrays",
                  sub_topics: ["JavaScript Array Methods"],
                },
              ],
              activities: [],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "8" },
              topics: [],
              activities: [
                "Javascript Array Manipulation",
                "Javascript Array Practice",
              ],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "9" },
              topics: [
                {
                  topic_name: "JavaScript Objects",
                  sub_topics: ["JavaScript Object Methods"],
                },
              ],
              activities: [],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "10" },
              topics: [],
              activities: [
                "Javascript Object Manipulation",
                "Javascript Object Practice",
              ],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "11" },
              topics: [
                {
                  topic_name: "JavaScript Functions",
                  sub_topics: [
                    "JavaScript Function Declaration",
                    "JavaScript Anonymous Functions",
                  ],
                },
              ],
              activities: [],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "12" },
              topics: [],
              activities: [
                "Javascript Function Practice",
                "Javascript Function Quiz",
              ],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "13" },
              topics: [
                {
                  topic_name: "JavaScript Events",
                  sub_topics: [
                    "JavaScript Event Listener",
                    "JavaScript Event Handlers",
                  ],
                },
              ],
              activities: [],
              time_required: { $numberInt: "60" },
            },
            {
              day: { $numberInt: "14" },
              topics: [],
              activities: ["Javascript DOM Manipulation", "Javascript Project"],
              time_required: { $numberInt: "120" },
            },
          ],
        },
        versions: [],
        createdAt: { $date: { $numberLong: "1750939293489" } },
        updatedAt: { $date: { $numberLong: "1750939293490" } },
        __v: { $numberInt: "0" },
      };
      setPlanData(latestPlan);

      // if (latestPlan?.progress) {
      //   setProgress(latestPlan.progress);
      // }
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

      {/* {planData.plan.topics.map((topic, index) => (
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
      ))} */}
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
