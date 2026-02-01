"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Habit, HabitCompletion, Reminder } from "@/lib/types";
import { format, subDays } from "date-fns";
import { calculateStreaks } from "@/lib/habit-utils";

// --- Sample Data Generation ---
const generateSampleCompletionMap = (createdAt: Date) => {
  const completionMap: Record<string, HabitCompletion> = {};
  let currentDate = new Date();
  let startDate = new Date(createdAt);

  while (currentDate >= startDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    let shouldComplete = Math.random() < 0.7; // 70% chance of completion
    
    if (shouldComplete) {
       completionMap[dateStr] = { completionLevel: 1 };
    } else {
      const reason = (Math.random() < 0.3) ? ["Forgot", "Busy", "Tired"][Math.floor(Math.random() * 3)] : undefined;
      completionMap[dateStr] = { completionLevel: 0, reason };
    }
    currentDate = subDays(currentDate, 1);
  }
  return completionMap;
};

const sampleHabits: Habit[] = [
  {
    id: "1",
    name: "Read for 20 minutes",
    createdAt: subDays(new Date(), 30).toISOString(),
    habitType: 'standard',
    allowPartial: true,
    color: "#64B5F6",
    priority: "high",
    difficulty: "medium",
    frequency: "daily",
    times: 1,
    reminder: {
      reminderDateTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      reminderMode: 'notification',
    },
    completionMap: generateSampleCompletionMap(subDays(new Date(), 30)),
    currentStreak: 5,
    longestStreak: 12,
  },
  {
    id: "2",
    name: "Workout",
    createdAt: subDays(new Date(), 60).toISOString(),
    habitType: 'standard',
    allowPartial: false,
    color: "#9575CD",
    priority: "medium",
    difficulty: "hard",
    frequency: "weekly",
    times: 3,
    completionMap: generateSampleCompletionMap(subDays(new Date(), 60)),
    currentStreak: 2,
    longestStreak: 8,
  },
    {
    id: "4",
    name: "Meditate for 10 minutes",
    createdAt: subDays(new Date(), 45).toISOString(),
    habitType: 'timer',
    duration: 10,
    allowPartial: false,
    color: "#81C784",
    priority: "low",
    difficulty: "easy",
    frequency: "daily",
    times: 1,
    completionMap: generateSampleCompletionMap(subDays(new Date(), 45)),
    currentStreak: 1,
    longestStreak: 5,
  },
];


// --- Context Definition ---
interface HabitsContextType {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "completionMap" | "currentStreak" | "longestStreak">) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  setCompletion: (habitId: string, date: string, level: number) => void;
  logMissedReason: (habitId: string, date: string, reason: string) => void;
  isLoading: boolean;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

const migrateHabitReminder = (oldHabit: any): Habit => {
    const { reminder, ...rest } = oldHabit;
    
    // Discard old reminder structures (duration-based or other legacy formats)
    let newReminder: Reminder | undefined = undefined;
    
    // Only keep reminder if it already conforms to the new DateTime structure
    if (reminder && reminder.reminderDateTime && typeof reminder.reminderDateTime === 'string') {
        newReminder = reminder as Reminder;
    }

    return { ...rest, reminder: newReminder };
};


// --- Provider Component ---
export const HabitsProvider = ({ children }: { children: ReactNode }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedHabitsRaw = localStorage.getItem("habits");
      if (storedHabitsRaw) {
        const parsedHabits = JSON.parse(storedHabitsRaw) as any[];
        // Check for old duration-based reminders to trigger migration
        if (parsedHabits.length > 0 && (parsedHabits[0].reminder?.hasOwnProperty('durationValue'))) {
            const migratedHabits = parsedHabits.map(migrateHabitReminder);
            setHabits(migratedHabits);
        } else {
            setHabits(parsedHabits as Habit[]);
        }
      } else {
        setHabits(sampleHabits.map(migrateHabitReminder));
      }
    } catch (error) {
      console.error("Failed to load habits from localStorage", error);
      setHabits(sampleHabits.map(migrateHabitReminder));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("habits", JSON.stringify(habits));
      } catch (error) {
        console.error("Failed to save habits to localStorage", error);
      }
    }
  }, [habits, isLoading]);

  const addHabit = (newHabitData: Omit<Habit, "id" | "createdAt" | "completionMap" | "currentStreak" | "longestStreak">) => {
    const newHabit: Habit = {
      id: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      completionMap: {},
      currentStreak: 0,
      longestStreak: 0,
      ...newHabitData,
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const updateHabit = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => (h.id === updatedHabit.id ? updatedHabit : h)));
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  const updateHabitStreaks = (habit: Habit, newCompletionMap: Record<string, HabitCompletion>): Habit => {
      const { currentStreak, longestStreak } = calculateStreaks(newCompletionMap);
      return {
          ...habit,
          completionMap: newCompletionMap,
          currentStreak,
          longestStreak: Math.max(habit.longestStreak, longestStreak),
      };
  }

  const setCompletion = (habitId: string, date: string, level: number) => {
    setHabits(prev =>
      prev.map(habit => {
        if (habit.id === habitId) {
          const newCompletionMap = { ...habit.completionMap };
          newCompletionMap[date] = { ...newCompletionMap[date], completionLevel: level };

          // If completing, remove any previously logged reason.
          if (level > 0) {
            delete newCompletionMap[date].reason;
          }
          
          return updateHabitStreaks(habit, newCompletionMap);
        }
        return habit;
      })
    );
  };
  
  const logMissedReason = (habitId: string, date: string, reason: string) => {
    setHabits(prev =>
      prev.map(habit => {
        if (habit.id === habitId) {
          const newCompletionMap = { ...habit.completionMap };
          newCompletionMap[date] = { completionLevel: 0, reason: reason };
          return updateHabitStreaks(habit, newCompletionMap);
        }
        return habit;
      })
    );
  };

  const value = { habits, addHabit, updateHabit, deleteHabit, setCompletion, logMissedReason, isLoading };

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
};

// --- Custom Hook ---
export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error("useHabits must be used within a HabitsProvider");
  }
  return context;
};
