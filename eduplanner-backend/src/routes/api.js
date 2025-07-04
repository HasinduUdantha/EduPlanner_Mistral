// import express from "express";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import {
//   generatePlan,
//   updatePlan,
// } from "../services/ollamaService.js";
// import {
//   generatePlanSchema,
//   updatePlanSchema,
// } from "../utils/validation.js";
// import Plan from "../models/plan.js";
// import User from "../models/user.js";

// const JWT_SECRET = process.env.JWT_SECRET || "eduplanner_secret";
// const router = express.Router();

// // === SIGNUP ===
// router.post("/signup", async (req, res) => {
//   console.log('Signup request received:', { email: req.body.email });
//   const { name, email, password } = req.body;

//   try {
//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     if (!name) {
//       return res.status(400).json({ error: "Name is required" });
//     }

//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(400).json({ error: "Email already exists" });
//     }

//     console.log('Creating new user...');
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name: name.trim(),
//       email: email.toLowerCase().trim(),
//       password: hashedPassword
//     });

//     console.log('User created successfully:', user._id);

//     const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     res.status(201).json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email
//       }
//     });
//   } catch (err) {
//     console.error("Signup error:", err);
//     if (err.code === 11000) {
//       return res.status(400).json({ error: "Email already exists" });
//     }
//     res.status(500).json({ error: "Internal server error. Please try again." });
//   }
// });

// // === LOGIN ===
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   console.log("Login attempt:", { email });

//   try {
//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email
//       }
//     });
//   } catch (err) {
//     console.error("Login error:", err.message);
//     res.status(500).json({ error: "Login failed" });
//   }
// });

// // === PLAN GENERATION ===
// router.post("/generate-plan", async (req, res) => {
//   try {
//     const validatedData = generatePlanSchema.parse(req.body);
//     const { userId } = req.body;

//     console.log("Generating plan for user:", userId);

//     const studyPlan = await generatePlan(validatedData);

//     const savedPlan = await Plan.create({
//       userId: userId,
//       plan: studyPlan,
//     });

//     res.json({ plan: studyPlan, planId: savedPlan._id });
//   } catch (error) {
//     console.error("❌ Generate plan error:", error.message);
//     res.status(400).json({ error: error.message });
//   }
// });

// // === PLAN UPDATE ===
// router.post("/update-plan", async (req, res) => {
//   try {
//     const validatedData = updatePlanSchema.parse(req.body);
//     const updatedPlan = await updatePlan(validatedData);
//     res.json({ plan: updatedPlan });
//   } catch (error) {
//     console.error("❌ Update plan error:", error.message);
//     res.status(400).json({ error: error.message });
//   }
// });

// // === STUDY PLAN HISTORY ===
// router.get("/study-plan-history/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     if (!userId) return res.status(400).json({ error: "User ID is required" });

//     const history = await Plan.find({ userId }).sort({ createdAt: -1 });
//     res.json(history);
//   } catch (err) {
//     console.error("❌ Error fetching plan history:", err.message);
//     res.status(500).json({ error: "Failed to fetch plan history." });
//   }
// });

// router.get("/study-plan-latest/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     if (!userId) return res.status(400).json({ error: "User ID is required" });

//     const latestPlan = await Plan.findOne({ userId }).sort({ createdAt: -1 });
//     if (!latestPlan) {
//       return res.status(404).json({ error: "No plans found" });
//     }

//     res.json(latestPlan);
//   } catch (err) {
//     console.error("❌ Error fetching latest study plan:", err.message);
//     res.status(500).json({ error: "Failed to fetch plan." });
//   }
// });

// router.patch("/update-plan-progress/:planId", async (req, res) => {
//   try {
//     const { planId } = req.params;
//     const { progress } = req.body;

//     const updated = await Plan.findByIdAndUpdate(
//       planId,
//       { progress, updatedAt: new Date() },
//       { new: true }
//     );

//     res.json(updated);
//   } catch (err) {
//     console.error("Error updating progress:", err.message);
//     res.status(500).json({ error: "Failed to update progress" });
//   }
// });

// export default router;
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

// === AUTHENTICATION MIDDLEWARE ===
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

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

// === NEW: MISSING ENDPOINTS FOR FRONTEND ===

// Get user's study plans (matches frontend getUserPlans call)
router.get("/plans/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const plans = await Plan.find({ userId }).sort({ createdAt: -1 });
    res.json({ plans });
  } catch (err) {
    console.error("❌ Error fetching user plans:", err.message);
    res.status(500).json({ error: "Failed to fetch user plans." });
  }
});

// Get specific plan by ID (matches frontend getStudyPlan call)
router.get("/plan/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    if (!planId) return res.status(400).json({ error: "Plan ID is required" });

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(plan);
  } catch (err) {
    console.error("❌ Error fetching plan:", err.message);
    res.status(500).json({ error: "Failed to fetch plan." });
  }
});

// Delete plan (matches frontend deleteStudyPlan call)
router.delete("/plan/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    if (!planId) return res.status(400).json({ error: "Plan ID is required" });

    const deletedPlan = await Plan.findByIdAndDelete(planId);
    if (!deletedPlan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting plan:", err.message);
    res.status(500).json({ error: "Failed to delete plan." });
  }
});

// Daily motivation endpoint (matches frontend getDailyMotivation call)
router.get("/daily-motivation", async (req, res) => {
  try {
    const motivationalQuotes = [
      "Every expert was once a beginner. Keep learning!",
      "Success is the sum of small efforts repeated day in and day out.",
      "The beautiful thing about learning is that no one can take it away from you.",
      "Education is the most powerful weapon which you can use to change the world.",
      "Learning never exhausts the mind. Keep growing!",
      "The capacity to learn is a gift; the ability to learn is a skill.",
      "Study hard, dream big, achieve more!",
      "Knowledge is power. Keep building yours every day."
    ];
    
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    res.json({ motivation: randomQuote });
  } catch (err) {
    console.error("❌ Error fetching daily motivation:", err.message);
    res.status(500).json({ error: "Failed to fetch motivation." });
  }
});

// === EXISTING ENDPOINTS (FIXED) ===

// Study plan history (matches frontend getStudyPlanHistory call)
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

// Latest study plan (matches frontend getLatestStudyPlan call)
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

// Update plan progress (matches frontend updateStudyPlanProgress call)
router.patch("/plan/:planId/progress", async (req, res) => {
  try {
    const { planId } = req.params;
    const { progress } = req.body;

    const updated = await Plan.findByIdAndUpdate(
      planId,
      { progress, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating progress:", err.message);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

export default router;
