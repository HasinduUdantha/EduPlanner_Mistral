import express from "express";
import jwt from "jsonwebtoken";
import {
  generatePlan,
  updatePlan,
  generateMotivation,
  inferEmotionFromFeedback,
  getDailyMotivation,
} from "../services/ollamaService.mjs";

import {
  generatePlanSchema,
  updatePlanSchema,
  motivationRequestSchema,
} from "../utils/validation.mjs";

import Plan from "../models/plan.mjs";
import MotivationHistory from "../models/motivationHistory.mjs";
import User from "../models/user.mjs";

const JWT_SECRET = process.env.JWT_SECRET || "eduplanner_secret";
const router = express.Router();

// === SIGNUP ===
import bcrypt from 'bcrypt';

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds
    const user = await User.create({ email, password: hashedPassword });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});


// === LOGIN ===
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});


// === PLAN GENERATION ===
router.post("/generate-plan", async (req, res) => {
  try {
    const validatedData = generatePlanSchema.parse(req.body);
    const { userId } = req.body;

    const studyPlan = await generatePlan(validatedData);

    const savedPlan = await Plan.create({
      userId: userId,
      plan: studyPlan
    });

    res.json({ plan: studyPlan, planId: savedPlan._id });
  } catch (error) {
    console.error("❌ Generate plan error:", error.message);
    res.status(400).json({ error: error.message });
  }
});



// === PLAN UPDATE ===
router.post("/update-plan", async (req, res) => {
  try {
    const validatedData = updatePlanSchema.parse(req.body);
    const updatedPlan = await updatePlan(validatedData);
    res.json({ plan: updatedPlan });
  } catch (error) {
    console.error("❌ Update plan error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// === MOTIVATION WITH RAG + HISTORY ===
router.post("/motivation", async (req, res) => {
  try {
    const { subject, emotion, progress, userId, userFeedback } =
      motivationRequestSchema.parse(req.body);

    let finalEmotion = emotion;
    if (!emotion && userFeedback) {
      const detected = await inferEmotionFromFeedback(userFeedback);
      finalEmotion = detected.emotion;
    }

    let motivation;
    try {
      motivation = await generateMotivation({
        subject,
        emotion: finalEmotion,
        progress,
      });
    } catch {
      motivation = await getDailyMotivation();
    }

    await MotivationHistory.create({
      userId: userId || "guest",
      subject,
      emotion: finalEmotion,
      progress,
      motivation: motivation.motivation,
    });

    res.json(motivation);
  } catch (error) {
    console.error("❌ Motivation error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// === MOTIVATION HISTORY ===
router.get("/motivation-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const history = await MotivationHistory.find({ userId }).sort({
      createdAt: -1,
    });

    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching motivation history:", err.message);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});



// === STUDY PLAN HISTORY ===
router.get("/study-plan-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const history = await Plan.find({ userId }).sort({ createdAt: -1 });

    res.json(history);
  } catch (err) {
    console.error("❌ Error fetching plan history:", err.message);
    res.status(500).json({ error: "Failed to fetch plan history." });
  }
});

router.get("/study-plan-latest/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const latestPlan = await Plan.findOne({ userId }).sort({ createdAt: -1 });

    if (!latestPlan) {
      return res.status(404).json({ error: "No plans found" });
    }

    res.json(latestPlan);
  } catch (err) {
    console.error("❌ Error fetching latest study plan:", err.message);
    res.status(500).json({ error: "Failed to fetch plan." });
  }
});

router.patch('/update-plan-progress/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { progress } = req.body;

    const updated = await Plan.findByIdAndUpdate(
      planId,
      { progress, updatedAt: new Date() },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Error updating progress:', err.message);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
