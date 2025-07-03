import { z } from "zod";

export const generatePlanSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.string().min(1, "Duration is required"),
  dailyTime: z.string().min(1, "Daily time is required"),
  userId: z.string().optional(),
});


export const updatePlanSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  feedback: z.string().min(1, "Feedback is required"),
});

