// src/services/ollamaService.mjs
import axios from "axios";
import Plan from "../models/plan.mjs";
import EduplannerQuote from "../models/eduplannerQuote.mjs";

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const MODEL_NAME =
  process.env.MODEL_NAME || "eduplanner-comprehensive-llama:latest";

export const generatePlan = async (data) => {
  const { subject, level, duration, dailyTime, userId } = data;
  const weeksMatch = duration.match(/(\d+)\s*week/);
  const totalDays = weeksMatch ? parseInt(weeksMatch[1]) * 7 : 7; // default to 7

  const prompt = `You are EduPlanner, an AI-powered personalized study planning assistant. You generate adaptive, structured study plans in JSON format that align with individual learning preferences and academic goals.
  give me a plan for learning a subject in a specific level and duration, with daily study time.:
  Subject: ${subject}
  Level: ${level}
  Duration: ${duration} (${totalDays} days total) 
  Daily Study Time: ${dailyTime}
`
//   const prompt = `You are EduPlanner, an AI-powered personalized study planning assistant. You generate adaptive, structured study plans in JSON format that align with individual learning preferences and academic goals. Your responses must be formatted exactly as requested.Generate a personalized study plan for:
// - Subject: ${subject}
// - Level: ${level}
// - Duration: ${duration} (${totalDays} days total)
// - Daily Study Time: ${dailyTime}

// Create a detailed plan with exactly ${totalDays} daily topics, each with specific learning objectives and recommended activities.

// IMPORTANT REQUIREMENTS:
// - Always include "title" field with format: "{subject} {level} Study Plan"
// - "level" must be: Beginner, Intermediate, or Advanced
// - "daily_time" format: "1 hour/day (X days)" or "2 hours/day (X days)"
// - "time_required" must be 60 for 1hr/day plans, 120 for 2hr/day plans
// - Days with topics should have empty "activities" array
// - Days with activities should have empty "topics" array (for practice/review days)
// - Each topic must have "topic_name" and "sub_topics" array
// - Ensure valid JSON format for MongoDB storage
// - Mobile-friendly content structure for React Native display
// - Progressive difficulty within each level
// - Realistic daily time allocation

// Return the result **exactly in this format**, wrapped in \`\`\`json\`\`\` markers:
// \`\`\`json
// {
//   "study_plan": {
//     "title": "${subject} ${level} Study Plan"
//     "subject": "${subject}",
//     "level": "${level}",
//     "duration": "${duration}",
//     "daily_time": "${dailyTime}",
//     "total_days": ${totalDays},
//     "days": [
//       {
//         "day": 1,
//         "topics": [
//           {
//             "topic_name": "Topic Name",
//             "sub_topics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
//           }
//         ],
//         "activities": [],
//         "time_required": 60, 
//       }
//     ]
//   }
// }\`\`\``;

  console.log("Ollama Prompt:", prompt);
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL_NAME,
    prompt,
    stream: false,
  });
  const rawOutput = response.data.response || "";
  console.log("Raw Ollama Response:", rawOutput);

  if (!rawOutput) throw new Error("Ollama returned an empty response");

  const studyPlanMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/);
  let planData;
  if (studyPlanMatch) {
    console.log("JSON match found in response");
    const studyPlan = JSON.parse(studyPlanMatch[1]);
    planData = studyPlan.study_plan || studyPlan;
  } else {
    console.log("No JSON match; attempting raw parse");
    try {
      const studyPlan = JSON.parse(rawOutput);
      planData = studyPlan.study_plan || studyPlan;
    } catch (e) {
      throw new Error("Ollama response is not valid JSON: " + rawOutput);
    }
  }
  if (!planData.subject) {
    planData.subject = subject;
  }

  if (!planData) throw new Error("No study plan data extracted from response");
  // const newPlan = new Plan({ userId: userId || "guest", plan: planData });
  // await newPlan.save();
  return planData;
};

export const updatePlan = async (data) => {
  const { planId, feedback } = data;
  const plan = await Plan.findById(planId);
  if (!plan) throw new Error("Plan not found");

  const currentPlanJSON = JSON.stringify(plan.plan, null, 2);
  const prompt = `[INST] Here is the current study plan in JSON:
\`\`\`json
${currentPlanJSON}
\`\`\`
User feedback: "${feedback}"
Revise the plan accordingly and return the updated JSON object named "study_plan" wrapped in \`\`\`json\`\`\` markers. [/INST]`;
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL_NAME,
    prompt,
    stream: false,
  });
  const rawOutput = response.data.response;
  console.log("Raw Ollama Response:", rawOutput);

  const updatedPlanMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/);
  if (!updatedPlanMatch) {
    console.log("No JSON match found in response");
    throw new Error("No valid JSON in response");
  }
  const updatedPlan = JSON.parse(updatedPlanMatch[1]);

  const planData = updatedPlan.study_plan || updatedPlan;
  if (!planData) throw new Error("No study plan data extracted from response");

  plan.versions.push({ plan: plan.plan, feedback, timestamp: new Date() });
  plan.plan = planData;
  plan.updatedAt = new Date();
  await plan.save();
  return planData;
};

export const generateMotivation = async ({ subject, emotion, progress }) => {
  const query = {
    $or: [
      { subject: subject.toLowerCase() },
      { topics: { $in: [emotion, progress].filter(Boolean) } },
    ],
  };

  const quotes = await EduplannerQuote.find(query).limit(3);
  if (!quotes.length) {
    throw new Error("No matching quotes found from RAG source.");
  }

  const quoteBlock = quotes.map((q, i) => `${i + 1}. "${q.quote}"`).join("\n");

  const prompt = `[INST]
The user is studying ${subject}.
They are feeling ${emotion || "neutral"} and their progress is: ${
    progress || "unknown"
  }.

Here are relevant motivational quotes from the EduPlanner knowledge base:
${quoteBlock}

Now generate a personalized motivational message in JSON:
{
  "motivation": "<message>"
}
[/INST] \`\`\`json\n`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL_NAME,
    prompt,
    stream: false,
  });

  const raw = response.data.response;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No valid JSON in LLM response.");
  return JSON.parse(match[0]);
};

export const getDailyMotivation = async () => {
  const total = await EduplannerQuote.countDocuments();
  const random = Math.floor(Math.random() * total);
  const quote = await EduplannerQuote.findOne().skip(random);
  return {
    motivation: quote?.quote || "You're doing great. Keep moving forward!",
  };
};

export const inferEmotionFromFeedback = async (userText) => {
  const prompt = `[INST]
The user wrote: "${userText}"
Please identify their emotion in one word (e.g., 'stressed', 'discouraged', 'motivated').
Return only a JSON object:
{
  "emotion": "<inferred_emotion>"
}
[/INST] \`\`\`json\n`;

  const response = await axios.post(OLLAMA_URL, {
    model: MODEL_NAME,
    prompt,
    stream: false,
  });

  const raw = response.data.response;
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) {
    return { emotion: "neutral" }; // fallback
  }

  return JSON.parse(match[0]);
};
