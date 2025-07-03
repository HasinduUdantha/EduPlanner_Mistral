import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  generatePlan,
  updatePlan,
} from "../services/ollamaService.js";
import {
  generatePlanSchema,
  updatePlanSchema,
} from "../utils/validation.js";
import Plan from "../models/plan.js";
import User from "../models/user.js";

const JWT_SECRET = process.env.JWT_SECRET || "eduplanner_secret";
const router = express.Router();

// === SIGNUP ===
router.post("/signup", async (req, res) => {
  console.log('Signup request received:', { email: req.body.email });
  const { name, email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    console.log('Creating new user...');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    console.log('User created successfully:', user._id);

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error. Please try again." });
  }
});

// === LOGIN ===
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email });

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// === PLAN GENERATION ===
router.post("/generate-plan", async (req, res) => {
  try {
    const validatedData = generatePlanSchema.parse(req.body);
    const { userId } = req.body;

    console.log("Generating plan for user:", userId);

    const studyPlan = await generatePlan(validatedData);

    const savedPlan = await Plan.create({
      userId: userId,
      plan: studyPlan,
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

router.patch("/update-plan-progress/:planId", async (req, res) => {
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
    console.error("Error updating progress:", err.message);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

export default router;
