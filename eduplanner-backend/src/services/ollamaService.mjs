// src/services/ollamaService.mjs
import axios from "axios";
import Plan from "../models/plan.mjs";
import EduplannerQuote from "../models/eduplannerQuote.mjs";

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const MODEL_NAME = process.env.MODEL_NAME || "EduPlanner_mistral";

export const generatePlan = async (data) => {
  const { subject, level, duration, dailyTime, userId } = data;
  const weeksMatch = duration.match(/(\d+)\s*week/);
  const totalDays = weeksMatch ? parseInt(weeksMatch[1]) * 7 : 7; // default to 7

  const prompt = `[INST]
You are EduPlanner, a tool that generates structured and adaptive study plans.

The user wants to learn "${subject}" at a ${level} level.
They can study ${dailyTime} per day for ${duration}.

Generate a complete plan with exactly **${totalDays} daily topics**.
Each day should be labeled clearly:
- “Day 1: ...”
- “Day 2: ...”
- …
- “Day ${totalDays}: ...”

Return the result **exactly in this format**, wrapped in \`\`\`json\`\`\` markers:
\`\`\`json
{
  "study_plan": {
    "subject": "${subject}",
    "level": "${level}",
    "duration": "${duration}",
    "daily_time": "${dailyTime}",
    "topics": [
      "Day 1: ...",
      "Day 2: ...",
      ...
      "Day ${totalDays}: ..."
    ]
  }
}
\`\`\`
[/INST]`;

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
