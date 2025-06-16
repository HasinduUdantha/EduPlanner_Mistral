// scripts/importMotivations.mjs

import fs from "fs";
import readline from "readline";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Connect to DB
await mongoose.connect(process.env.MONGO_URI);

// Define schema (reuse your existing model if needed)
const motivationSchema = new mongoose.Schema({
  quote: String,
  author: String,
  topics: [String],
  subject: String
});
const Motivation = mongoose.model("Motivation", motivationSchema);

// File path
const fileStream = fs.createReadStream("./eduplanner_quotes.jsonl");
const rl = readline.createInterface({ input: fileStream });

for await (const line of rl) {
  if (line.trim()) {
    try {
      const doc = JSON.parse(line);
      await Motivation.create(doc);
    } catch (err) {
      console.error("Error inserting:", err.message);
    }
  }
}

console.log("✅ Motivational quotes imported!");
process.exit();
