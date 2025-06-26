// utils/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { storePlan } from './storage';
import { API_URL } from './config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Increase to 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      SecureStore.deleteItemAsync('userToken');
      SecureStore.deleteItemAsync('userId');
    }
    return Promise.reject(error);
  }
);

// AUTHENTICATION FUNCTIONS
export const signupUser = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Signup failed');
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};


// STUDY PLAN FUNCTIONS
export const generateStudyPlan = async (data: {
  subject: string;
  level: string;
  duration: string;
  dailyTime: string;
  goals?: string;
  userId?: string;
}) => {
  try {
    const response = await apiClient.post('/generate-plan', data);
    console.log("Api called");
    // Store plan locally for offline access
    if (response.data) {
      await storePlan(response.data);
    }
    
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to generate study plan';
    throw new Error(message);
  }
};

export const updateStudyPlan = async (
  planId: string, 
  feedback: string,
  progressData?: any,
  currentDay?: number
) => {
  try {
    const response = await apiClient.put('/update-plan', {
      planId,
      feedback,
      progressData,
      currentDay,
    });
    
    // Store updated plan locally
    if (response.data) {
      await storePlan(response.data);
    }
    
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update study plan';
    throw new Error(message);
  }
};

export const getUserPlans = async (userId: string) => {
  try {
    const response = await apiClient.get(`/plans/${userId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch user plans';
    throw new Error(message);
  }
};

export const getStudyPlan = async (planId: string) => {
  try {
    const response = await apiClient.get(`/plan/${planId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch study plan';
    throw new Error(message);
  }
};

export const deleteStudyPlan = async (planId: string) => {
  try {
    const response = await apiClient.delete(`/plan/${planId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to delete study plan';
    throw new Error(message);
  }
};

// MOTIVATION FUNCTIONS
export const generateMotivation = async (data: {
  subject: string;
  emotion?: string;
  progress?: string;
  userGoals?: string;
}) => {
  try {
    const response = await apiClient.post('/generate-motivation', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to generate motivation';
    throw new Error(message);
  }
};

export const getDailyMotivation = async () => {
  try {
    const response = await apiClient.get('/daily-motivation');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch daily motivation';
    throw new Error(message);
  }
};

export const getMotivationHistory = async (userId: string) => {
  try {
    const response = await apiClient.get(`/motivation-history/${userId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch motivation history';
    throw new Error(message);
  }
};

// PROGRESS TRACKING FUNCTIONS
export const updateStudyPlanProgress = async (planId: string, progress: {
  dayCompleted: number;
  topicsCompleted: string[];
  timeSpent: number;
  difficulty: string;
  notes?: string;
}) => {
  try {
    const response = await apiClient.patch(`/plan/${planId}/progress`, { progress });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update progress';
    throw new Error(message);
  }
};

export const getStudyProgress = async (userId: string, planId?: string) => {
  try {
    const endpoint = planId ? `/progress/${userId}/${planId}` : `/progress/${userId}`;
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch study progress';
    throw new Error(message);
  }
};

// FEEDBACK AND EMOTION ANALYSIS
export const inferEmotionFromFeedback = async (userText: string) => {
  try {
    const response = await apiClient.post('/infer-emotion', { userText });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to analyze emotion';
    throw new Error(message);
  }
};

// USER PROFILE FUNCTIONS
export const getUserProfile = async (userId: string) => {
  try {
    const response = await apiClient.get(`/user/${userId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch user profile';
    throw new Error(message);
  }
};

export const updateUserProfile = async (userId: string, profileData: {
  name?: string;
  email?: string;
  learningPreferences?: any;
  goals?: string[];
}) => {
  try {
    const response = await apiClient.put(`/user/${userId}`, profileData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to update user profile';
    throw new Error(message);
  }
};

// ANALYTICS AND INSIGHTS
export const getStudyAnalytics = async (userId: string, timeframe: string = '30d') => {
  try {
    const response = await apiClient.get(`/analytics/${userId}?timeframe=${timeframe}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch analytics';
    throw new Error(message);
  }
};

// ADAPTIVE LEARNING FUNCTIONS
export const adaptPlanBasedOnBehavior = async (planId: string, behaviorData: {
  completionRate: number;
  timeSpentPerDay: number[];
  difficultyFeedback: string[];
  engagementLevel: number;
}) => {
  try {
    const response = await apiClient.post(`/plan/${planId}/adapt`, { behaviorData });
    
    // Store adapted plan locally
    if (response.data) {
      await storePlan(response.data);
    }
    
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Failed to adapt study plan';
    throw new Error(message);
  }
};

// UTILITY FUNCTIONS
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error: any) {
    throw new Error('API service unavailable');
  }
};

// Export the configured axios instance for custom requests
export { apiClient };
