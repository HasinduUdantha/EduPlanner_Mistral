import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Button,
  Text,
  TextInput,
  Card,
  Title,
  Paragraph,
  Chip,
  Surface,
  ActivityIndicator,
  Snackbar,
  ProgressBar,
  IconButton,
  Avatar,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { generateStudyPlan, getUserPlans, getDailyMotivation } from '../../utils/api';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { lightTheme } from '../../utils/theme';

const { width } = Dimensions.get('window');

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
  
  // Form state
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('beginner');
  const [duration, setDuration] = useState('1 week');
  const [dailyTime, setDailyTime] = useState('1 hour');
  const [goals, setGoals] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Data state
  const [studyPlans, setStudyPlans] = useState<StudyPlanCard[]>([]);
  const [motivation, setMotivation] = useState('');
  const [userName, setUserName] = useState('');
  const [userStats, setUserStats] = useState({
    totalPlans: 0,
    completedPlans: 0,
    currentStreak: 0,
    totalStudyTime: 0,
  });

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

      const [motivationData, plansData] = await Promise.all([
        getDailyMotivation().catch(() => ({ motivation: 'Keep learning and growing every day!' })),
        getUserPlans(userId || 'guest').catch(() => ({ plans: [] }))
      ]);

      setMotivation(motivationData.motivation);
      
      const processedPlans = (plansData.plans || []).map((plan: any) => ({
        ...plan,
        completionPercentage: calculateCompletionPercentage(plan)
      }));
      
      setStudyPlans(processedPlans);
      
      // Calculate user stats
      setUserStats({
        totalPlans: processedPlans.length,
        completedPlans: processedPlans.filter((plan: StudyPlanCard) => plan.completionPercentage === 100).length,
        currentStreak: Math.floor(Math.random() * 15) + 1, // Mock data
        totalStudyTime: Math.floor(Math.random() * 100) + 20, // Mock data
      });
    } catch (err) {
      console.error('Error loading home data:', err);
    }
  };

  const calculateCompletionPercentage = (plan: any) => {
    if (!plan.progress || !plan.plan.days) return 0;
    
    const totalTasks = plan.plan.days.reduce((acc: number, day: any) => {
      return acc + (day.topics?.length || 0) + (day.activities?.length || 0);
    }, 0);
    
    if (totalTasks === 0) return 0;
    
    const completedTasks = Object.values(plan.progress).reduce((acc: number, dayProgress: any) => {
      return acc + Object.values(dayProgress).filter(Boolean).length;
    }, 0);
    
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const handleGeneratePlan = async () => {
    if (loading || !subject.trim()) return;

    try {
      setLoading(true);
      
      const userId = await SecureStore.getItemAsync('userId');
      const payload = {
        subject: subject.trim(),
        level,
        duration,
        dailyTime,
        goals: goals.trim(),
        userId: userId || 'guest',
      };

      const response = await generateStudyPlan(payload);
      
      setSnackbarMessage('Study plan generated successfully!');
      setSnackbarVisible(true);
      
      setSubject('');
      setGoals('');
      
      await loadHomeData();
      
      router.push({
        pathname: '/weekly',
        params: { plan: JSON.stringify(response) }
      });
    } catch (err: any) {
      setSnackbarMessage(err.message || 'Failed to generate study plan');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // In your home screen (index.tsx)
const handleCardPress = (plan: StudyPlanCard) => {
  console.log('🔍 Navigating to specific plan:', plan._id);
  
  // Ensure the plan data is properly structured for the weekly screen
  const planToPass = {
    _id: plan._id,
    userId: plan.userId || 'guest',
    plan: plan.plan,
    progress: plan.progress || {},
    createdAt: plan.createdAt,
    // updatedAt: plan.updatedAt || plan.createdAt
  };

  console.log('📦 Plan data being passed:', JSON.stringify(planToPass, null, 2));

  router.push({
    pathname: '/weekly',
    params: { 
      plan: JSON.stringify(planToPass),
      planId: plan._id,
      source: 'home_card' // Add source tracking
    }
  });
};



  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return lightTheme.colors.textSecondary;
    if (percentage < 30) return lightTheme.colors.error;
    if (percentage < 70) return lightTheme.colors.warning;
    return lightTheme.colors.success;
  };

  const levelOptions = ['beginner', 'intermediate', 'advanced'];
  const durationOptions = ['1 week', '2 weeks', '3 weeks', '4 weeks'];
  const timeOptions = ['30 minutes', '1 hour', '2 hours', '3 hours'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={lightTheme.colors.primary} />
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadHomeData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={[lightTheme.colors.primary, lightTheme.colors.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.userSection}>
              <Avatar.Text 
                size={56} 
                label={userName ? userName.charAt(0).toUpperCase() : 'U'} 
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>
                  Welcome back{userName ? `, ${userName}` : ''}! 👋
                </Text>
                <Text style={styles.subtitleText}>
                  Ready to continue your learning journey?
                </Text>
              </View>
            </View>
            
            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.totalPlans}</Text>
                <Text style={styles.statLabel}>Total Plans</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.totalStudyTime}h</Text>
                <Text style={styles.statLabel}>Study Time</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Plan Generation Form */}
        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            <View style={styles.formHeader}>
              <MaterialIcons name="add-circle" size={32} color={lightTheme.colors.primary} />
              <View style={styles.formHeaderText}>
                <Title style={styles.formTitle}>Create Study Plan</Title>
                <Paragraph style={styles.formSubtitle}>
                  Generate a personalized learning path
                </Paragraph>
              </View>
            </View>
            
            <TextInput
              label="What do you want to learn?"
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., JavaScript, Python, React"
              left={<TextInput.Icon icon="book" />}
              theme={{
                colors: {
                  primary: lightTheme.colors.primary,
                  outline: lightTheme.colors.border,
                },
              }}
            />

            <Text style={styles.sectionLabel}>Skill Level</Text>
            <View style={styles.chipContainer}>
              {levelOptions.map((option) => (
                <Chip
                  key={option}
                  selected={level === option}
                  onPress={() => setLevel(option)}
                  style={[
                    styles.chip,
                    level === option && styles.selectedChip
                  ]}
                  textStyle={level === option ? styles.selectedChipText : styles.chipText}
                  icon={level === option ? "check" : undefined}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Chip>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Study Duration</Text>
            <View style={styles.chipContainer}>
              {durationOptions.map((option) => (
                <Chip
                  key={option}
                  selected={duration === option}
                  onPress={() => setDuration(option)}
                  style={[
                    styles.chip,
                    duration === option && styles.selectedChip
                  ]}
                  textStyle={duration === option ? styles.selectedChipText : styles.chipText}
                  icon={duration === option ? "check" : undefined}
                >
                  {option}
                </Chip>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Daily Time Commitment</Text>
            <View style={styles.chipContainer}>
              {timeOptions.map((option) => (
                <Chip
                  key={option}
                  selected={dailyTime === option}
                  onPress={() => setDailyTime(option)}
                  style={[
                    styles.chip,
                    dailyTime === option && styles.selectedChip
                  ]}
                  textStyle={dailyTime === option ? styles.selectedChipText : styles.chipText}
                  icon={dailyTime === option ? "check" : undefined}
                >
                  {option}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Learning Goals (Optional)"
              value={goals}
              onChangeText={setGoals}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="What specific skills do you want to achieve?"
              left={<TextInput.Icon icon="target" />}
              theme={{
                colors: {
                  primary: lightTheme.colors.primary,
                  outline: lightTheme.colors.border,
                },
              }}
            />

            <Button
              mode="contained"
              onPress={handleGeneratePlan}
              loading={loading}
              disabled={loading || !subject.trim()}
              style={styles.generateButton}
              contentStyle={styles.generateButtonContent}
              icon="plus"
            >
              {loading ? 'Generating Your Plan...' : 'Generate Study Plan'}
            </Button>
          </Card.Content>
        </Card>

        {/* Motivation Card */}
        {motivation && (
          <Card style={styles.motivationCard}>
            <Card.Content>
              <View style={styles.motivationHeader}>
                <MaterialIcons name="lightbulb" size={24} color={lightTheme.colors.warning} />
                <Title style={styles.motivationTitle}>Daily Motivation</Title>
              </View>
              <Paragraph style={styles.motivationText}>{motivation}</Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Study Plans Grid */}
        {studyPlans.length > 0 && (
          <View style={styles.plansSection}>
            <View style={styles.plansSectionHeader}>
              <Title style={styles.sectionTitle}>Your Study Plans</Title>
              <Button
                mode="outlined"
                onPress={() => router.push('/history')}
                compact
                style={styles.viewAllButton}
              >
                View All
              </Button>
            </View>

            {studyPlans.slice(0, 3).map((plan, index) => (
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
                          {plan.plan.title || `${plan.plan.subject} Study Plan`}
                        </Title>
                        <Chip 
                          style={[styles.levelBadge, { backgroundColor: `${lightTheme.colors.primary}20` }]}
                          textStyle={{ color: lightTheme.colors.primary, fontSize: 12 }}
                        >
                          {plan.plan.level}
                        </Chip>
                      </View>
                      <IconButton
                        icon="chevron-right"
                        size={20}
                        iconColor={lightTheme.colors.textSecondary}
                      />
                    </View>
                    
                    <View style={styles.planMeta}>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="schedule" size={16} color={lightTheme.colors.textSecondary} />
                        <Text style={styles.metaText}>{plan.plan.duration}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="timer" size={16} color={lightTheme.colors.textSecondary} />
                        <Text style={styles.metaText}>
                          {plan.plan.daily_time?.split('/')[0]?.replace(/\*\*/g, '').trim() || 'Daily study'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={[
                          styles.progressPercentage,
                          { color: getProgressColor(plan.completionPercentage || 0) }
                        ]}>
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  // Only TextStyle properties for text components
  welcomeText: {
    ...(lightTheme.typography.h2 as object),
    color: 'white',
    marginBottom: 4,
  },
  subtitleText: {
    ...(lightTheme.typography.body as object),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: lightTheme.borderRadius.md,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  // Only TextStyle properties for text components
  statNumber: {
    ...(lightTheme.typography.h2 as object),
    color: 'white',
    fontWeight: 'bold',
  },
  statLabel: {
    ...(lightTheme.typography.caption as object),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  formCard: {
    margin: lightTheme.spacing.md,
    marginTop: -12,
    borderRadius: lightTheme.borderRadius.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  formContent: {
    padding: lightTheme.spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    color: lightTheme.colors.textPrimary,
    marginBottom: lightTheme.spacing.sm,
    marginTop: lightTheme.spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    color: 'white',
  },
  generateButton: {
    marginTop: lightTheme.spacing.md,
    backgroundColor: lightTheme.colors.primary,
    borderRadius: lightTheme.borderRadius.md,
  },
  generateButtonContent: {
    paddingVertical: 12,
  },
  motivationCard: {
    margin: lightTheme.spacing.md,
    marginTop: 0,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: `${lightTheme.colors.warning}10`,
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.sm,
  },
  // Only TextStyle properties for text components
  motivationTitle: {
    ...(lightTheme.typography.h3 as object),
    color: lightTheme.colors.warning,
    marginLeft: lightTheme.spacing.sm,
  },
  // Only TextStyle properties for text components
  motivationText: {
    ...(lightTheme.typography.body as object),
    color: lightTheme.colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  plansSection: {
    margin: lightTheme.spacing.md,
    marginTop: 0,
  },
  plansSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    alignSelf: 'flex-start',
  },
  planMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.sm,
  },
  // Only TextStyle properties for text components
  progressLabel: {
    ...(lightTheme.typography.bodySmall as object),
    color: lightTheme.colors.textPrimary,
    fontWeight: '500',
  },
  // Only TextStyle properties for text components
  progressPercentage: {
    ...(lightTheme.typography.bodySmall as object),
    fontWeight: 'bold',
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
