import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Checkbox,
  Text,
  Button,
  ActivityIndicator,
  Chip,
  Surface,
  IconButton,
  TextInput,
  Modal,
  Portal,
  ProgressBar,
} from "react-native-paper";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  getLatestStudyPlan,
  updateStudyPlanProgress,
  updateStudyPlan,
  getStudyPlan,
} from "../../utils/api";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Theme colors matching our design system
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

interface PlanData {
  _id: string;
  userId: string;
  plan: {
    title?: string;
    subject: string;
    level: string;
    duration: string;
    daily_time: string;
    total_days: number;
    days: Array<{
      day: number;
      topics:
        | Array<{
            topic_name: string;
            sub_topics: string[];
          }>
        | string[];
      activities: string[];
      time_required: number;
    }>;
  };
  progress?: Progress;
  createdAt: string;
  updatedAt?: string;
}

interface Progress {
  [dayKey: string]: {
    [itemIndex: string]: boolean;
  };
}

export default function WeeklyPlanScreen() {
  const router = useRouter();

  let params: any = {};
  try {
    params = useLocalSearchParams() || {};
  } catch (error) {
    console.warn("Error getting search params:", error);
    params = {};
  }

  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [currentDay, setCurrentDay] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Screen focused, checking for plan changes...");
      loadPlan();
    }, [params.plan, params.planId])
  );

  useEffect(() => {
    console.log("📱 Params changed, reloading plan...");
    loadPlan();
  }, [params.plan, params.planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      let planToLoad = null;

      console.log("🔍 Loading plan with params:", {
        hasPlan: !!params.plan,
        planId: params.planId,
        planLength: params.plan ? params.plan.length : 0,
      });

      if (params && typeof params.plan === "string") {
        try {
          planToLoad = JSON.parse(params.plan);
          console.log("✅ Plan loaded from navigation params:", planToLoad._id);
          console.log("📋 Plan subject:", planToLoad.plan?.subject);

          if (currentPlanId && currentPlanId !== planToLoad._id) {
            console.log("🔄 Different plan detected, clearing state...");
            setProgress({});
            setExpandedDays(new Set([1]));
          }

          setCurrentPlanId(planToLoad._id);
          const normalizedPlan = normalizePlanData(planToLoad);
          setPlanData(normalizedPlan);

          if (normalizedPlan?.progress) {
            setProgress(normalizedPlan.progress);
          }

          console.log("✅ Successfully loaded specific plan from navigation");
          return;
        } catch (e) {
          console.warn("⚠️ Failed to parse plan from params:", e);
        }
      }

      if (!planToLoad && params?.planId) {
        try {
          planToLoad = await getStudyPlan(params.planId as string);
          console.log("✅ Plan loaded by ID from API:", planToLoad._id);
          setCurrentPlanId(planToLoad._id);
        } catch (e) {
          console.warn("⚠️ Failed to load plan by ID:", e);
        }
      }

      if (!planToLoad && !params?.plan && !params?.planId) {
        const userId = await SecureStore.getItemAsync("userId");
        if (!userId) {
          setError("Please login to view your study plans");
          router.replace("/(auth)/login");
          return;
        }

        try {
          planToLoad = await getLatestStudyPlan(userId);
          console.log("✅ Latest plan loaded from API as fallback");
          setCurrentPlanId(planToLoad._id);
        } catch (apiError) {
          console.error("❌ Failed to load latest plan:", apiError);
          setError("No study plans found. Create one from the home screen.");
          return;
        }
      }

      if (!planToLoad) {
        setError("No study plan found");
        return;
      }

      const normalizedPlan = normalizePlanData(planToLoad);
      setPlanData(normalizedPlan);

      if (normalizedPlan.progress) {
        setProgress(normalizedPlan.progress);
      }

      console.log(
        "✅ Plan successfully loaded:",
        normalizedPlan._id,
        normalizedPlan.plan?.subject
      );
    } catch (error) {
      console.error("❌ Error in loadPlan:", error);
      setError("An unexpected error occurred while loading your study plan");
    } finally {
      setLoading(false);
    }
  };

  const normalizePlanData = (plan: any): PlanData => {
    const normalizedDays =
      plan.plan.days?.map((day: any) => {
        let normalizedTopics = [];

        if (Array.isArray(day.topics)) {
          if (day.topics.length > 0 && typeof day.topics[0] === "string") {
            normalizedTopics = day.topics.map((topic: string) => ({
              topic_name: topic,
              sub_topics: [],
            }));
          } else {
            normalizedTopics = day.topics;
          }
        }

        return {
          ...day,
          topics: normalizedTopics,
          activities: day.activities || [],
        };
      }) || [];

    return {
      ...plan,
      plan: {
        ...plan.plan,
        days: normalizedDays,
      },
    };
  };

  const toggleTask = async (dayKey: string, itemIndex: string) => {
    const updatedProgress = {
      ...progress,
      [dayKey]: {
        ...(progress[dayKey] || {}),
        [itemIndex]: !(progress[dayKey] || {})[itemIndex],
      },
    };

    setProgress(updatedProgress);

    try {
      if (planData?._id) {
        await updateStudyPlanProgress(planData._id, updatedProgress);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      setProgress(progress);
    }
  };

  const toggleDayExpansion = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim() || !planData?._id) return;

    try {
      setLoading(true);
      const updatedPlan = await updateStudyPlan(planData._id, feedback.trim());
      setPlanData(updatedPlan);
      setFeedback("");
      setShowFeedbackModal(false);
      Alert.alert(
        "Success",
        "Your study plan has been updated based on your feedback!"
      );
    } catch (error) {
      console.error("Error updating plan:", error);
      Alert.alert("Error", "Failed to update plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDayProgress = (day: number) => {
    const dayKey = `day_${day}`;
    const dayData = planData?.plan.days.find((d) => d.day === day);
    if (!dayData) return 0;

    const totalItems =
      (dayData.topics?.length || 0) + (dayData.activities?.length || 0);
    if (totalItems === 0) return 0;

    const completedItems = Object.values(progress[dayKey] || {}).filter(
      Boolean
    ).length;
    return Math.round((completedItems / totalItems) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage === 0) return theme.colors.textSecondary;
    if (percentage < 30) return theme.colors.error;
    if (percentage < 70) return theme.colors.warning;
    return theme.colors.success;
  };

  const getCompletedDays = () => {
    if (!planData?.plan.days) return 0;
    return planData.plan.days.filter((day) => getDayProgress(day.day) === 100)
      .length;
  };

  const formatCreatedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your study plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <MaterialIcons
              name="error"
              size={64}
              color={theme.colors.error}
              style={styles.errorIcon}
            />
            <Title style={styles.errorTitle}>Oops! Something went wrong</Title>
            <Paragraph style={styles.errorDescription}>{error}</Paragraph>
            <View style={styles.errorButtons}>
              <Button
                mode="outlined"
                onPress={() => router.push("/")}
                style={styles.homeButton}
                icon="home"
              >
                Go to Home
              </Button>
              <Button
                mode="contained"
                onPress={loadPlan}
                style={styles.retryButton}
                icon="refresh"
              >
                Try Again
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!planData) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <MaterialIcons
              name="school"
              size={64}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Title style={styles.emptyTitle}>No Study Plan Found</Title>
            <Paragraph style={styles.emptyDescription}>
              Generate a study plan from the home screen to get started.
            </Paragraph>
            <Button
              mode="contained"
              onPress={() => router.push("/")}
              style={styles.createButton}
              icon="plus"
            >
              Create Study Plan
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const { plan } = planData;
  const overallProgress =
    plan.days?.length > 0
      ? plan.days.reduce((acc, day) => acc + getDayProgress(day.day), 0) /
        plan.days.length
      : 0;
  const completedDays = getCompletedDays();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* Enhanced Header with Subject and Plan Details */}
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
              <Text style={styles.headerSubject}>{plan.subject}</Text>
              <Text style={styles.headerLevel}>{plan.level} Level</Text>
            </View>
            <IconButton
              icon="comment-text-outline"
              size={24}
              iconColor="white"
              onPress={() => setShowFeedbackModal(true)}
            />
          </View>

          {/* Plan Title */}
          <View style={styles.planTitleSection}>
            <Title style={styles.planTitle}>
              {plan.title || `${plan.subject} Study Plan`}
            </Title>
          </View>

          {/* Plan Details Grid */}
          <View style={styles.planDetailsGrid}>
            <View style={styles.detailItem}>
              <MaterialIcons name="calendar-today" size={20} color="white" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>{plan.total_days}</Text>
                <Text style={styles.detailLabel}>Total Days</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="access-time" size={20} color="white" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>
                  {plan.daily_time
                    ?.split("/")[0]
                    ?.replace(/\*\*/g, "")
                    .trim() || "Daily"}
                </Text>
                <Text style={styles.detailLabel}>Study Time</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={20} color="white" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>{plan.duration}</Text>
                <Text style={styles.detailLabel}>Duration</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="check-circle" size={20} color="white" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>
                  {completedDays}/{plan.total_days}
                </Text>
                <Text style={styles.detailLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>Overall Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round(overallProgress)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${overallProgress}%` },
                ]}
              />
            </View>
          </View>

          {/* Plan Meta Information */}
          <View style={styles.planMeta}>
            <Text style={styles.planMetaText}>
              Created on {formatCreatedDate(planData.createdAt)}
            </Text>
            {planData.updatedAt &&
              planData.updatedAt !== planData.createdAt && (
                <Text style={styles.planMetaText}>
                  • Last updated {formatCreatedDate(planData.updatedAt)}
                </Text>
              )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Plan */}
        {plan.days?.map((day, dayIndex) => {
          const isExpanded = expandedDays.has(day.day);
          const dayProgress = getDayProgress(day.day);
          const isCompleted = dayProgress === 100;

          return (
            <Card
              key={day.day}
              style={[styles.dayCard, isCompleted && styles.completedDayCard]}
            >
              <TouchableOpacity
                onPress={() => toggleDayExpansion(day.day)}
                activeOpacity={0.7}
              >
                <Card.Content>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayTitleContainer}>
                      <View
                        style={[
                          styles.dayNumber,
                          {
                            backgroundColor: isCompleted
                              ? theme.colors.success
                              : theme.colors.primary,
                          },
                        ]}
                      >
                        {isCompleted ? (
                          <MaterialIcons name="check" size={20} color="white" />
                        ) : (
                          <Text style={styles.dayNumberText}>{day.day}</Text>
                        )}
                      </View>
                      <View style={styles.dayInfo}>
                        <Title style={styles.dayTitle}>Day {day.day}</Title>
                        <Text style={styles.dayMeta}>
                          {day.time_required} minutes •{" "}
                          {(day.topics?.length || 0) +
                            (day.activities?.length || 0)}{" "}
                          items
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dayProgress}>
                      <Text
                        style={[
                          styles.dayProgressText,
                          { color: getStatusColor(dayProgress) },
                        ]}
                      >
                        {dayProgress}%
                      </Text>
                      <IconButton
                        icon={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        iconColor={theme.colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.dayProgressBar}>
                    <View
                      style={[
                        styles.dayProgressBarFill,
                        {
                          width: `${dayProgress}%`,
                          backgroundColor: getStatusColor(dayProgress),
                        },
                      ]}
                    />
                  </View>
                </Card.Content>
              </TouchableOpacity>

              {isExpanded && (
                <Animated.View style={styles.dayContent}>
                  <Card.Content style={styles.dayContentPadding}>
                    {/* Topics */}
                    {day.topics?.map((topic, topicIndex) => (
                      <Surface key={topicIndex} style={styles.topicContainer}>
                        <View style={styles.topicHeader}>
                          <Checkbox
                            status={
                              progress[`day_${day.day}`]?.[
                                `topic_${topicIndex}`
                              ]
                                ? "checked"
                                : "unchecked"
                            }
                            onPress={() =>
                              toggleTask(
                                `day_${day.day}`,
                                `topic_${topicIndex}`
                              )
                            }
                            color={theme.colors.primary}
                          />
                          <Text style={styles.topicTitle}>
                            {typeof topic === "string"
                              ? topic
                              : topic.topic_name}
                          </Text>
                        </View>

                        {typeof topic === "object" &&
                          topic.sub_topics?.map((subTopic, subIndex) => (
                            <View key={subIndex} style={styles.subTopicItem}>
                              <Checkbox
                                status={
                                  progress[`day_${day.day}`]?.[
                                    `subtopic_${topicIndex}_${subIndex}`
                                  ]
                                    ? "checked"
                                    : "unchecked"
                                }
                                onPress={() =>
                                  toggleTask(
                                    `day_${day.day}`,
                                    `subtopic_${topicIndex}_${subIndex}`
                                  )
                                }
                                color={theme.colors.accent}
                              />
                              <Text style={styles.subTopicText}>
                                {subTopic}
                              </Text>
                            </View>
                          ))}
                      </Surface>
                    ))}

                    {/* Activities */}
                    {day.activities?.map((activity, activityIndex) => (
                      <View key={activityIndex} style={styles.activityItem}>
                        <Checkbox
                          status={
                            progress[`day_${day.day}`]?.[
                              `activity_${activityIndex}`
                            ]
                              ? "checked"
                              : "unchecked"
                          }
                          onPress={() =>
                            toggleTask(
                              `day_${day.day}`,
                              `activity_${activityIndex}`
                            )
                          }
                          color={theme.colors.warning}
                        />
                        <MaterialIcons
                          name="assignment"
                          size={16}
                          color={theme.colors.warning}
                          style={styles.activityIcon}
                        />
                        <Text style={styles.activityText}>{activity}</Text>
                      </View>
                    ))}
                  </Card.Content>
                </Animated.View>
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* Feedback Modal */}
      <Portal>
        <Modal
          visible={showFeedbackModal}
          onDismiss={() => setShowFeedbackModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <MaterialIcons
              name="comment-text-outline"
              size={32}
              color={theme.colors.primary}
            />
            <View style={styles.modalHeaderText}>
              <Title style={styles.modalTitle}>Provide Feedback</Title>
              <Paragraph style={styles.modalDescription}>
                Help us improve your study plan based on your experience.
              </Paragraph>
            </View>
          </View>

          <TextInput
            label="Your feedback"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            style={styles.feedbackInput}
            mode="outlined"
            placeholder="Tell us how the plan is working for you..."
            theme={{
              colors: {
                primary: theme.colors.primary,
                outline: theme.colors.border,
              },
            }}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowFeedbackModal(false)}
              style={styles.modalCancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleFeedbackSubmit}
              disabled={!feedback.trim()}
              style={styles.modalSubmitButton}
            >
              Submit Feedback
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorCard: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorIcon: {
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  errorDescription: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  errorButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  homeButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  retryButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  header: {
    paddingTop: 60,
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
    backgroundColor:"red",
    justifyContent: "center",
    height: 50,
  },
  headerSubject: {
    fontSize: 24,
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
  planTitleSection: {
    marginBottom: theme.spacing.lg,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    lineHeight: 26,
  },
  planDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  detailTextContainer: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  detailLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  planMeta: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  planMetaText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  dayCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedDayCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  dayNumberText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  dayMeta: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  dayProgress: {
    alignItems: "center",
  },
  dayProgressText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dayProgressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginTop: theme.spacing.md,
    overflow: "hidden",
  },
  dayProgressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  dayContent: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  dayContentPadding: {
    paddingTop: theme.spacing.md,
  },
  topicContainer: {
    backgroundColor: `${theme.colors.primary}05`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    elevation: 1,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  subTopicItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: theme.spacing.lg,
    marginBottom: 4,
  },
  subTopicText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.warning}10`,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  activityIcon: {
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  activityText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalHeaderText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  modalDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  feedbackInput: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  modalSubmitButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  emptyCard: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  emptyIcon: {
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
});
