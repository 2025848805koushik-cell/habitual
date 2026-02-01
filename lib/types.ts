export type HabitCompletion = {
  completionLevel: number; // 0, 0.25, 0.5, 0.75, 1
  reason?: string; // for 0% completion
};

export type Reminder = {
  reminderDateTime: string; // ISO string for the scheduled time
  reminderMode: 'notification' | 'alarm';
};

/**
 * The single source of truth for a Habit.
 * All optional fields have safe defaults to ensure creation never fails.
 */
export type Habit = {
  // Core fields
  id: string; // unique, auto-generated
  name: string; // required, non-empty
  createdAt: string; // auto-set ISO string

  // Configuration
  habitType: 'standard' | 'timer'; // default: 'standard'
  duration?: number; // in minutes, for timer type
  allowPartial: boolean; // default: false, for standard type
  color: string; // default: a blue color
  priority: 'low' | 'medium' | 'high'; // default: 'medium'
  difficulty: 'easy' | 'medium' | 'hard'; // default: 'medium'

  // Goal
  frequency: 'daily' | 'weekly' | 'monthly'; // default: 'daily'
  times: number; // default: 1

  // Reminder (optional, nested)
  reminder?: Reminder;

  // Tracking State
  completionMap: Record<string, HabitCompletion>; // date string 'YYYY-MM-DD' -> completion data
  currentStreak: number; // default: 0
  longestStreak: number; // default: 0
};


export type Task = {
  id: string;
  name:string;
  date: string; // 'YYYY-MM-DD'
  completed: boolean;
  createdAt: string;
  reminder?: Reminder;
};
