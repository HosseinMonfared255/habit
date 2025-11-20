export enum HabitCategory {
  HEALTH = 'Health',
  PRODUCTIVITY = 'Productivity',
  MINDFULNESS = 'Mindfulness',
  LEARNING = 'Learning',
  CREATIVITY = 'Creativity',
  OTHER = 'Other'
}

export interface HabitLog {
  date: string; // ISO Date string YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  startDate: string;
  targetFrequency: string; // e.g., "Daily", "Weekly"
  streak: number;
  logs: HabitLog[];
  color: string;
  aiMotivation?: string; // Last AI insight
}

export interface AIHabitPlan {
  title: string;
  description: string;
  microStep: string; // The "Seed" - easiest version of the habit
  category: HabitCategory;
  frequency: string;
}

export interface AIInsight {
  message: string;
  actionableTip: string;
}
