import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_KEY = '@eduplanner_plan';
const STREAK_KEY = '@eduplanner_streak';

export const storePlan = async (plan: any) => {
  try {
    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error('Error storing plan:', error);
    throw error;
  }
};

export const updateProgress = async (progress: any) => {
  try {
    const stored = await AsyncStorage.getItem(PLAN_KEY);
    if (!stored) return;

    const plan = JSON.parse(stored);
    plan.progress = progress;

    await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

export const updateStreak = async () => {
  try {
    const currentStreak = await AsyncStorage.getItem(STREAK_KEY);
    const newStreak = (parseInt(currentStreak || '0', 10) + 1).toString();
    await AsyncStorage.setItem(STREAK_KEY, newStreak);
    return parseInt(newStreak, 10);
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

export const getStreak = async () => {
  try {
    const streak = await AsyncStorage.getItem(STREAK_KEY);
    return parseInt(streak || '0', 10);
  } catch (error) {
    console.error('Error getting streak:', error);
    throw error;
  }
};
