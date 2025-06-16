import axios from 'axios';
import { storePlan } from './storage';
import { API_URL } from './config';

// STUDY PLAN GENERATION
export const generateStudyPlan = async (data: {
  subject: string;
  level: string;
  duration: string;
  dailyTime: string;
  userId: string;
}) => {
  const response = await axios.post(`${API_URL}/generate-plan`, data);
  return response.data;
};

// STUDY PLAN UPDATE
export const updateStudyPlan = async (planId: string, feedback: string) => {
  try {
    const response = await axios.post(`${API_URL}/update-plan`, {
      planId,
      feedback,
    });
    await storePlan(response.data.plan);
    return response.data;
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

// 🧠 MOTIVATION REQUEST
export const generateMotivation = async (data: {
  userId: string;
  subject: string;
  progress?: string;
  emotion?: string;
  userFeedback?: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/motivation`, data);
    return response.data; // { motivation: "..." }
  } catch (error) {
    console.error('Error generating motivation:', error);
    throw error;
  }
};

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

export async function signupUser(email: string, password: string) {
  try{
    const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Signup failed');
  return data;
} catch (err: any) {
  throw new Error(err.message || 'Signup failed');
}

}


export async function fetchMotivationalMessage() {
  const response = await fetch(`${API_URL}/motivation`);
  if (!response.ok) throw new Error('Failed to fetch motivational message');
  return response.json();
}

export async function getMotivationHistory(userId: string) {
  const response = await fetch(`${API_URL}/motivation-history/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch motivation history');
  }
  return response.json();
}

export async function getStudyPlanHistory(userId: string) {
  const response = await fetch(`${API_URL}/study-plan-history/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch study plan history');
  return response.json();
}

export async function deleteStudyPlan(planId: string) {
  const response = await fetch(`${API_URL}/delete-plan/${planId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete study plan');
  return response.json();
}

export async function getLatestStudyPlan(userId: string) {
  const response = await fetch(`${API_URL}/study-plan-latest/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch latest study plan');
  return response.json();
}

export async function updateStudyPlanProgress(planId: string, progress: any) {
  const response = await fetch(`${API_URL}/update-plan-progress/${planId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress }),
  });

  if (!response.ok) throw new Error('Failed to update study plan progress');
  return response.json();
}
