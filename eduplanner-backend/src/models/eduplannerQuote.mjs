import mongoose from "mongoose";

const eduplannerQuoteSchema = new mongoose.Schema({
  quote: String,
  topics: [String],
  subject: String
});

export default mongoose.model("EduplannerQuote", eduplannerQuoteSchema, "eduplanner_quotes");
