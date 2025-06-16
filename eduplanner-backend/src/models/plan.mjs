import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  userId: { type: String, required: false, index: true },
  plan: { type: Object, required: true },
  versions: [
    {
      plan: { type: Object, required: true },
      feedback: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Plan", planSchema);