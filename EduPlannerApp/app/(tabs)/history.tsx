import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getStudyPlanHistory } from '@/utils/api';

export default function HistoryScreen() {
  interface StudyPlanEntry {
    _id?: string;
    plan?: {
      study_plan?: {
        subject?: string;
        language?: string;
      };
    };
    createdAt: string;
  }

  const [plans, setPlans] = useState<StudyPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId');

        if (!userId) {
          console.warn("⚠️ No user ID found. Skipping history load.");
          setLoading(false);
          return;
        }

        const planData = await getStudyPlanHistory(userId);
        setPlans(planData);
      } catch (err) {
        console.error('❌ Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Past Study Plans</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : plans.length === 0 ? (
        <Text style={styles.noEntries}>No study plans found.</Text>
      ) : (
        plans.map((entry, idx) => (
          <View key={entry._id || idx} style={styles.entryCard}>
            <Text style={styles.subject}>
              {entry.plan?.study_plan?.subject ??
              entry.plan?.study_plan?.language ??
              'Unknown Subject'}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(entry.createdAt).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noEntries: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
