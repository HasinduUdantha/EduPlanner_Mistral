// src/models/motivationHistory.mjs

import mongoose from "mongoose";

const motivationHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  subject: String,
  emotion: String,
  progress: String,
  motivation: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("MotivationHistory", motivationHistorySchema);
