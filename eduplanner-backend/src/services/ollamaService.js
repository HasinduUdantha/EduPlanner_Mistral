import axios from "axios";
import Plan from "../models/plan.js";

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const MODEL_NAME = process.env.MODEL_NAME || "EduPlanner_mistral";

export const generatePlan = async (data) => {
  const { subject, level, duration, dailyTime, userId } = data;
  const weeksMatch = duration.match(/(\d+)\s*week/);
  const totalDays = weeksMatch ? parseInt(weeksMatch[1]) * 7 : 7;

  const prompt = `[INST]
You are EduPlanner, an AI-powered personalized study planning assistant. You generate adaptive, structured study plans in JSON format that align with individual learning preferences and academic goals. Your responses must be formatted exactly as requested.

Generate a personalized study plan for:
The user wants to learn "${subject}" at a ${level} level.
They can study ${dailyTime} per day for ${duration}.

IMPORTANT REQUIREMENTS:
- Always include "title" field with format: "{subject} {level} Study Plan"
- "level" must be: Beginner, Intermediate, or Advanced
- "daily_time" format: "1 hour/day" or "2 hours/day"
- "time_required" must be 60 for 1hr/day plans, 120 for 2hr/day plans
- Days with topics should have empty "activities" array
- Days with activities should have empty "topics" array (for practice/review days)
- Each topic must have "topic_name" and "sub_topics" array
- Ensure valid JSON format for MongoDB storage
- Mobile-friendly content structure for React Native display
- Progressive difficulty within each level
- Realistic daily time allocation

Generate a complete plan with exactly **${totalDays} daily topics**.

Return the result **exactly in this format**, wrapped in \`\`\`json\`\`\` markers:

\`\`\`json
{
  "study_plan": {
    "title": "${subject} ${level} Study Plan",
    "subject": "${subject}",
    "level": "${level}",
    "duration": "${duration}",
    "daily_time": "${dailyTime}",
    "total_days": ${totalDays},
    "days": [
      {
        "day": 1,
        "topics": [
          {
            "topic_name": "Topic Name",
            "sub_topics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
          }
        ],
        "activities": [],
        "time_required": ${dailyTime.includes("1 hour") ? 60 : 120}
      }
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

  const studyPlanMatch = rawOutput.match(/``````/);
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

  const updatedPlanMatch = rawOutput.match(/``````/);

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
