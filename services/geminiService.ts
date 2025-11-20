
import { GoogleGenAI, Type } from "@google/genai";
import { Habit, AIInsight, AIHabitPlan, HabitCategory } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON response (remove markdown code blocks if present)
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateHabitBlueprint = async (goal: string, language: 'en' | 'fa' = 'en'): Promise<AIHabitPlan> => {
  const model = "gemini-2.5-flash";
  const langName = language === 'fa' ? 'Persian (Farsi)' : 'English';
  
  const prompt = `
    User Goal: "${goal}"
    Target Language: ${langName}
    
    Create a "Habit Inception" plan. 
    1. Identify the core habit.
    2. Create a "Micro Step" (The Seed): This is a version of the habit so easy it's impossible to say no to.
    3. Categorize it.

    IMPORTANT: Output 'title', 'description', 'microStep', and 'frequency' in ${langName}.
    Output 'category' exactly as one of these English strings: "Health", "Productivity", "Mindfulness", "Learning", "Creativity", "Other".
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy name for the habit" },
            description: { type: Type.STRING, description: "A 1-sentence description of the full habit" },
            microStep: { type: Type.STRING, description: "The tiny, <2 minute version of the habit to start with" },
            category: { type: Type.STRING, enum: Object.values(HabitCategory) },
            frequency: { type: Type.STRING, description: "Suggested frequency, e.g., Daily" }
          },
          required: ["title", "description", "microStep", "category", "frequency"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJson(text)) as AIHabitPlan;
  } catch (error) {
    console.error("Gemini Blueprint Error:", error);
    throw error;
  }
};

export const getHabitCoaching = async (habit: Habit, language: 'en' | 'fa' = 'en'): Promise<AIInsight> => {
  const model = "gemini-2.5-flash";
  const langName = language === 'fa' ? 'Persian (Farsi)' : 'English';
  
  // Summarize recent history
  const last7Days = habit.logs.slice(-7);
  const completionRate = last7Days.filter(l => l.completed).length / (last7Days.length || 1);
  
  const prompt = `
    Act as a supportive but tactical habit coach.
    Habit: ${habit.title}
    Micro-Step: ${habit.description}
    Current Streak: ${habit.streak}
    Recent Completion Rate (last 7 active days): ${(completionRate * 100).toFixed(0)}%
    
    Provide a brief insight in ${langName}.
    1. A short motivational message or observation.
    2. A specific, actionable tip to maintain or fix the streak.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            actionableTip: { type: Type.STRING }
          },
          required: ["message", "actionableTip"]
        }
      }
    });

    const text = response.text;
    if (!text) return { message: "Keep going!", actionableTip: "Consistency is key." };

    return JSON.parse(cleanJson(text)) as AIInsight;
  } catch (error) {
    console.error("Gemini Coaching Error:", error);
    return { message: "Stay focused.", actionableTip: "Try to do the micro-step today." };
  }
};
