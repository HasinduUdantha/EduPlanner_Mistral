import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  StatusBar,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Text,
  ProgressBar,
  Surface,
  Chip,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import { LineChart, PieChart, BarChart } from "react-native-chart-kit";
import * as SecureStore from "expo-secure-store";
import { getUserPlans } from "../../utils/api";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../../utils/theme";

const { width } = Dimensions.get("window");

const theme = {
  colors: {
    primary: "#2563EB",
    secondary: "#7C3AED",
    accent: "#06B6D4",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    background: "#FAFBFC",
    surface: "#FFFFFF",
    textPrimary: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
};

interface ProgressData {
  totalPlans: number;
  completedPlans: number;
  totalStudyTime: number;
  currentStreak: number;
  weeklyProgress: number[];
  subjectBreakdown: { subject: string; progress: number; color: string }[];
  achievements: string[];
}

export default function ProgressScreen() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("userId");
      if (!userId) return;

      const plansData = await getUserPlans(userId).catch(() => ({ plans: [] }));

      const plans = plansData.plans || [];
      const processedData = processProgressData(plans, {});
      setProgressData(processedData);
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processProgressData = (plans: any[], analytics: any): ProgressData => {
    const totalPlans = plans.length;
    const completedPlans = plans.filter(
      (plan) => calculateCompletionPercentage(plan) >= 100
    ).length;

    const subjectMap = new Map();
    const colors = [
      "#6366f1",
      "#8b5cf6",
      "#06b6d4",
      "#10b981",
      "#f59e0b",
      "#ef4444",
    ];

    plans.forEach((plan, index) => {
      const subject = plan.plan.subject;
      const progress = calculateCompletionPercentage(plan);

      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          progress: 0,
          count: 0,
          color: colors[index % colors.length],
        });
      }

      const existing = subjectMap.get(subject);
      existing.progress =
        (existing.progress * existing.count + progress) / (existing.count + 1);
      existing.count += 1;
    });

    const subjectBreakdown = Array.from(subjectMap.values());

    // Generate mock weekly progress data
    const weeklyProgress = Array.from(
      { length: 7 },
      () => Math.floor(Math.random() * 4) + 1
    );

    return {
      totalPlans,
      completedPlans,
      totalStudyTime:
        analytics.totalStudyTime || Math.floor(Math.random() * 100) + 20,
      currentStreak:
        analytics.currentStreak || Math.floor(Math.random() * 15) + 1,
      weeklyProgress,
      subjectBreakdown,
      achievements: generateAchievements(totalPlans, completedPlans),
    };
  };

  const calculateCompletionPercentage = (plan: any) => {
    if (!plan.progress || !plan.plan.days) return 0;

    const totalTasks = plan.plan.days.reduce((acc: number, day: any) => {
      return acc + (day.topics?.length || 0) + (day.activities?.length || 0);
    }, 0);

    if (totalTasks === 0) return 0;

    const completedTasks = Object.values(plan.progress).reduce(
      (acc: number, dayProgress: any) => {
        return acc + Object.values(dayProgress).filter(Boolean).length;
      },
      0
    );

    return Math.round((completedTasks / totalTasks) * 100);
  };

  const generateAchievements = (
    totalPlans: number,
    completedPlans: number
  ): string[] => {
    const achievements = [];

    if (totalPlans >= 1) achievements.push("First Plan Created");
    if (completedPlans >= 1) achievements.push("Plan Completed");
    if (totalPlans >= 5) achievements.push("Study Enthusiast");
    if (completedPlans >= 3) achievements.push("Consistent Learner");

    return achievements;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  if (!progressData) {
    return (
      <View style={styles.container}>
        <Text>No progress data available</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const weeklyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: progressData.weeklyProgress,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const pieData = progressData.subjectBreakdown.map((item, index) => ({
    name: item.subject,
    progress: item.progress,
    color: item.color,
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={lightTheme.colors.primary}
      />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Top Navigation */}
          <View style={styles.headerTop}>
            <View style={{ width: 30 }}></View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerSubject}>Progress</Text>
            </View>
            <View style={{ width: 30 }}></View>
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialIcons name="school" size={32} color="#6366f1" />
              <Text style={styles.statNumber}>{progressData.totalPlans}</Text>
              <Text style={styles.statLabel}>Total Plans</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialIcons name="check-circle" size={32} color="#10b981" />
              <Text style={styles.statNumber}>
                {progressData.completedPlans}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialIcons name="access-time" size={32} color="#f59e0b" />
              <Text style={styles.statNumber}>
                {progressData.totalStudyTime}h
              </Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialIcons
                name="local-fire-department"
                size={32}
                color="#ef4444"
              />
              <Text style={styles.statNumber}>
                {progressData.currentStreak}
              </Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Weekly Progress Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Weekly Study Hours</Title>
            <LineChart
              data={weeklyData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Subject Breakdown */}
        {pieData.length > 0 && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>Subject Progress</Title>
              <PieChart
                data={pieData}
                width={width - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="progress"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        {/* Overall Progress */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <Title style={styles.progressTitle}>Overall Progress</Title>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Plan Completion Rate</Text>
              <View style={styles.progressBarContainer}>
                <ProgressBar
                  progress={
                    progressData.totalPlans > 0
                      ? progressData.completedPlans / progressData.totalPlans
                      : 0
                  }
                  color="#6366f1"
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {progressData.totalPlans > 0
                    ? Math.round(
                        (progressData.completedPlans /
                          progressData.totalPlans) *
                          100
                      )
                    : 0}
                  %
                </Text>
              </View>
            </View>

            {progressData.subjectBreakdown.map((subject, index) => (
              <View key={index} style={styles.progressItem}>
                <Text style={styles.progressLabel}>{subject.subject}</Text>
                <View style={styles.progressBarContainer}>
                  <ProgressBar
                    progress={subject.progress / 100}
                    color={subject.color}
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressText}>
                    {Math.round(subject.progress)}%
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Achievements */}
        {progressData.achievements.length > 0 && (
          <Card style={styles.achievementsCard}>
            <Card.Content>
              <Title style={styles.achievementsTitle}>🏆 Achievements</Title>
              <View style={styles.achievementsContainer}>
                {progressData.achievements.map((achievement, index) => (
                  <Chip
                    key={index}
                    icon="star"
                    style={styles.achievementChip}
                    textStyle={styles.achievementText}
                  >
                    {achievement}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 80,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  headerSubject: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    paddingBottom: 8,
  },
  statCard: {
    width: (width - 48) / 2,
    margin: 4,
    backgroundColor: "white",
  },
  statContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: "white",
  },
  chartTitle: {
    color: "#6366f1",
    marginBottom: 16,
    fontSize: 18,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  progressCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: "white",
  },
  progressTitle: {
    color: "#6366f1",
    marginBottom: 16,
    fontSize: 18,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    fontWeight: "500",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    marginRight: 12,
  },
  progressText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "bold",
    minWidth: 40,
  },
  achievementsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: "white",
  },
  achievementsTitle: {
    color: "#6366f1",
    marginBottom: 16,
    fontSize: 18,
  },
  achievementsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  achievementChip: {
    margin: 4,
    backgroundColor: "#f3f4f6",
  },
  achievementText: {
    color: "#374151",
  },
});
