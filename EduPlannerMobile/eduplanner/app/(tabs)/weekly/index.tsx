import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  Button,
  Text,
  Card,
  Title,
  Chip,
  Snackbar,
  ProgressBar,
  IconButton,
} from "react-native-paper";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  generateStudyPlan,
  getUserPlans,
  getDailyMotivation,
} from "../../../utils/api";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { lightTheme } from "../../../utils/theme";
import { calculateCompletionPercentage } from "@/utils/progress";
import { useFocusEffect } from "@react-navigation/native";

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

interface StudyPlanCard {
  _id: string;
  userId?: string;
  plan: {
    title?: string;
    subject: string;
    level: string;
    duration: string;
    daily_time: string;
    total_days: number;
    days?: any[];
  };
  progress?: any;
  createdAt: string;
  completionPercentage?: number;
}

export default function HomeScreen() {
  const router = useRouter();

  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Data state
  const [studyPlans, setStudyPlans] = useState<StudyPlanCard[]>([]);
  const [userStats, setUserStats] = useState({
    totalPlans: 0,
    completedPlans: 0,
    currentStreak: 0,
    totalStudyTime: 0,
  });

  useEffect(() => {
    loadStudyPlansData();
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadStudyPlansData();
    }, [])
  );

  const loadStudyPlansData = async () => {
    try {
      const userId = await SecureStore.getItemAsync("userId");
      const plansData = await getUserPlans(userId || "guest").catch(() => ({
        plans: [],
      }));

      const processedPlans = (plansData.plans || []).map((plan: any) => ({
        ...plan,
        completionPercentage: Math.round(plan.overallProgressPercentage) || 0,
      }));

      setStudyPlans(processedPlans);

      // Calculate user stats
      setUserStats({
        totalPlans: processedPlans.length,
        completedPlans: processedPlans.filter(
          (plan: StudyPlanCard) => plan.completionPercentage === 100
        ).length,
        currentStreak: Math.floor(Math.random() * 15) + 1, // Mock data
        totalStudyTime: Math.floor(Math.random() * 100) + 20, // Mock data
      });
    } catch (err) {
      console.error("Error loading home data:", err);
    }
  };

  // const calculateCompletionPercentage = (plan: any) => {
  //     if (!plan.progress || !plan.plan.days) return 0;

  //     const totalTasks = plan.plan.days.reduce((acc: number, day: any) => {
  //         return acc + (day.topics?.length || 0) + (day.activities?.length || 0);
  //     }, 0);

  //     if (totalTasks === 0) return 0;

  //     const completedTasks = Object.values(plan.progress).reduce((acc: number, dayProgress: any) => {
  //         return acc + Object.values(dayProgress).filter(Boolean).length;
  //     }, 0);

  //     return Math.round((completedTasks / totalTasks) * 100);
  // };

  const handleCardPress = (plan: StudyPlanCard) => {
    console.log("🔍 Navigating to specific plan:", plan._id);

    // Ensure the plan data is properly structured for the weekly screen
    const planToPass = {
      _id: plan._id,
      userId: plan.userId || "guest",
      plan: plan.plan,
      progress: plan.progress || {},
      overallProgressPercentage: plan.completionPercentage || 0,
      createdAt: plan.createdAt,
      // updatedAt: plan.updatedAt || plan.createdAt
    };

    console.log(
      "📦 Plan data being passed:",
      JSON.stringify(planToPass, null, 2)
    );

    router.push({
      pathname: "/(tabs)/weekly/details",
      params: {
        plan: JSON.stringify(planToPass),
        planId: plan._id,
        source: "home_card", // Add source tracking
      },
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return lightTheme.colors.textSecondary;
    if (percentage < 30) return lightTheme.colors.error;
    if (percentage < 70) return lightTheme.colors.warning;
    return lightTheme.colors.success;
  };

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
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="white"
              onPress={() => router.back()}
            />
            <View style={styles.headerCenter}>
              <Text style={styles.headerSubject}>Study Plans</Text>
            </View>
            <IconButton
              icon="plus"
              size={24}
              iconColor="white"
              onPress={() => router.push("/")} // If the home screen is the default tab
            />
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadStudyPlansData}
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: 10 }}
      >
        {studyPlans.length === 0 && (
          <View>
            <Text style={styles.noDataFoundHeader}>No Study Plans Found</Text>
            <Text style={styles.noDataFoundDescription}>
              Start creating your study plans!
            </Text>
          </View>
        )}
        {/* Study Plans Grid */}
        {studyPlans.length > 0 && (
          <View style={styles.plansSection}>
            {studyPlans.map((plan, index) => (
              <TouchableOpacity
                key={plan._id}
                onPress={() => handleCardPress(plan)}
                activeOpacity={0.8}
              >
                <Card style={styles.planCard}>
                  <Card.Content>
                    <View style={styles.planHeader}>
                      <View style={styles.planTitleContainer}>
                        <Title style={styles.planTitle} numberOfLines={2}>
                          {(
                            plan.plan.title || `${plan.plan.subject} Study Plan`
                          ).replace(
                            /\w\S*/g,
                            (txt) =>
                              txt.charAt(0).toUpperCase() +
                              txt.slice(1).toLowerCase()
                          )}
                        </Title>
                        <Chip
                          style={[
                            styles.levelBadge,
                            {
                              backgroundColor: `${lightTheme.colors.primary}20`,
                            },
                          ]}
                          textStyle={{
                            color: lightTheme.colors.primary,
                            fontSize: 12,
                          }}
                        >
                          {plan.plan.level.charAt(0).toUpperCase() +
                            plan.plan.level.slice(1).toLowerCase()}
                        </Chip>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        size={24}
                        iconColor={lightTheme.colors.textSecondary}
                      />
                    </View>

                    <View style={styles.planMeta}>
                      <View style={styles.metaItem}>
                        <MaterialIcons
                          name="schedule"
                          size={16}
                          color={lightTheme.colors.textSecondary}
                        />
                        <Text style={styles.metaText}>
                          {plan.plan.duration}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialIcons
                          name="timer"
                          size={16}
                          color={lightTheme.colors.textSecondary}
                        />
                        <Text style={styles.metaText}>
                          {plan.plan.daily_time
                            ?.split("/")[0]
                            ?.replace(/\*\*/g, "")
                            .trim() || "Daily study"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text
                          style={[
                            styles.progressPercentage,
                            {
                              color: getProgressColor(
                                plan.completionPercentage || 0
                              ),
                            },
                          ]}
                        >
                          {plan.completionPercentage || 0}%
                        </Text>
                      </View>
                      <ProgressBar
                        progress={(plan.completionPercentage || 0) / 100}
                        color={getProgressColor(plan.completionPercentage || 0)}
                        style={styles.progressBar}
                      />
                    </View>

                    <Text style={styles.planDate}>
                      Created {new Date(plan.createdAt).toLocaleDateString()}
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
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
  headerLevel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 2,
  },
  noDataFoundHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: lightTheme.colors.textPrimary,
    textAlign: "center",
    marginVertical: theme.spacing.lg,
  },
  noDataFoundDescription: {
    fontSize: 16,
    color: lightTheme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  // Only TextStyle properties for text components
  welcomeText: {
    ...(lightTheme.typography.h2 as object),
    color: "white",
    marginBottom: 4,
  },
  subtitleText: {
    ...(lightTheme.typography.body as object),
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: lightTheme.borderRadius.md,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
  },
  // Only TextStyle properties for text components
  statNumber: {
    ...(lightTheme.typography.h2 as object),
    color: "white",
    fontWeight: "bold",
  },
  statLabel: {
    ...(lightTheme.typography.caption as object),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  formCard: {
    margin: lightTheme.spacing.md,
    marginTop: -12,
    borderRadius: lightTheme.borderRadius.lg,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  formContent: {
    padding: lightTheme.spacing.lg,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: lightTheme.spacing.lg,
    paddingBottom: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  formHeaderText: {
    marginLeft: lightTheme.spacing.md,
    flex: 1,
  },
  // Only TextStyle properties for text components
  formTitle: {
    ...(lightTheme.typography.h2 as object),
    color: lightTheme.colors.primary,
    marginBottom: 4,
  },
  formSubtitle: {
    ...(lightTheme.typography.body as object),
    color: lightTheme.colors.textSecondary,
  },
  input: {
    marginBottom: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.surface,
  },
  // Only TextStyle properties for text components
  sectionLabel: {
    ...(lightTheme.typography.body as object),
    fontWeight: "600",
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.sm,
    marginTop: lightTheme.spacing.sm,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: lightTheme.spacing.md,
  },
  chip: {
    margin: 4,
    backgroundColor: lightTheme.colors.background,
  },
  selectedChip: {
    backgroundColor: lightTheme.colors.primary,
  },
  // Only TextStyle properties for text components
  chipText: {
    color: lightTheme.colors.textSecondary,
  },
  selectedChipText: {
    color: "white",
  },
  generateButton: {
    marginTop: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: lightTheme.borderRadius.md,
  },
  generateButtonContent: {
    paddingVertical: 12,
  },
  plansSection: {
    margin: lightTheme.spacing.md,
    marginTop: 0,
  },
  plansSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing.md,
  },
  // Only TextStyle properties for text components
  sectionTitle: {
    ...(lightTheme.typography.h2 as object),
    color: lightTheme.colors.primary,
  },
  viewAllButton: {
    borderColor: lightTheme.colors.primary,
  },
  planCard: {
    marginBottom: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  planTitleContainer: {
    flex: 1,
    marginRight: lightTheme.spacing.sm,
  },
  // Only TextStyle properties for text components
  planTitle: {
    ...(lightTheme.typography.h3 as object),
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.sm,
    lineHeight: 24,
  },
  levelBadge: {
    alignSelf: "flex-start",
  },
  planMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: lightTheme.spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  // Only TextStyle properties for text components
  metaText: {
    ...(lightTheme.typography.bodySmall as object),
    color: lightTheme.colors.textSecondary,
    marginLeft: 4,
  },
  progressSection: {
    marginBottom: lightTheme.spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: lightTheme.spacing.sm,
  },
  // Only TextStyle properties for text components
  progressLabel: {
    ...(lightTheme.typography.bodySmall as object),
    color: lightTheme.colors.textPrimary,
    fontWeight: "500",
  },
  // Only TextStyle properties for text components
  progressPercentage: {
    ...(lightTheme.typography.bodySmall as object),
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: lightTheme.colors.border,
  },
  // Only TextStyle properties for text components
  planDate: {
    ...(lightTheme.typography.caption as object),
    color: lightTheme.colors.textSecondary,
  },
  snackbar: {
    backgroundColor: lightTheme.colors.primary,
  },
});
