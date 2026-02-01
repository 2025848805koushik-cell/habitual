import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  differenceInDays,
  parseISO,
} from 'date-fns';
import type { Habit, HabitCompletion } from './types';

/**
 * Calculates both the current and longest streaks for a habit.
 * @param completionMap - The record of habit completions.
 * @returns An object with `currentStreak` and `longestStreak`.
 */
export const calculateStreaks = (completionMap: Record<string, HabitCompletion>): { currentStreak: number; longestStreak: number } => {
    if (!completionMap || Object.keys(completionMap).length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    const RECOVERY_DAYS_ALLOWED = 1;

    // Sort completion dates chronologically
    const sortedDates = Object.keys(completionMap)
        .filter(dateStr => completionMap[dateStr]?.completionLevel === 1)
        .map(dateStr => parseISO(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    let longestStreak = 0;
    let currentStreak = 0;

    // Calculate longest streak
    for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
            currentStreak = 1;
        } else {
            const gap = differenceInDays(sortedDates[i], sortedDates[i - 1]) - 1;
            if (gap <= RECOVERY_DAYS_ALLOWED) {
                currentStreak++;
            } else {
                // Streak is broken
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1; // Start a new streak
            }
        }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Calculate current streak (based on most recent completion)
    const today = new Date();
    const lastCompletionDate = sortedDates[sortedDates.length - 1];
    const gapFromToday = differenceInDays(today, lastCompletionDate);

    if (gapFromToday > RECOVERY_DAYS_ALLOWED) {
        // If the last completion was too long ago, the current streak is 0.
        return { currentStreak: 0, longestStreak };
    }

    // If we are here, the current streak is the one ending on the last completion date.
    // We need to re-calculate it from the last break.
    let finalCurrentStreak = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
        if (i === sortedDates.length - 1) {
            finalCurrentStreak = 1;
        } else {
            const gap = differenceInDays(sortedDates[i+1], sortedDates[i]) - 1;
            if (gap <= RECOVERY_DAYS_ALLOWED) {
                finalCurrentStreak++;
            } else {
                break; // Streak broken
            }
        }
    }

    return { currentStreak: finalCurrentStreak, longestStreak };
};

export const getDailyTotalCompletions = (habits: Habit[]): number => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return habits.filter(h => h.completionMap?.[todayStr]?.completionLevel === 1).length;
};


export const getMonthlyChartData = (habits: Habit[], date: Date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const chartData = daysInMonth.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const totalCompletionLevel = habits.reduce((acc, habit) => {
      return acc + (habit.completionMap?.[dayStr]?.completionLevel || 0);
    }, 0);
    return {
      date: format(day, 'MMM d'),
      completions: totalCompletionLevel,
    };
  });
  return chartData;
};

export const getHeatmapData = (habits: Habit[], month: Date): Record<string, { intensity: number, completed: number, total: number }> => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const heatmapData: Record<string, { intensity: number, completed: number, total: number }> = {};

  daysInMonth.forEach(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);

    const trackableHabits = habits.filter(habit => {
      const creationDate = new Date(habit.createdAt);
      creationDate.setHours(0, 0, 0, 0);
      return dayStart >= creationDate;
    });

    const totalCompletionLevel = trackableHabits.reduce((acc, habit) => {
        return acc + (habit.completionMap?.[dayStr]?.completionLevel || 0);
    }, 0);

    let intensity = 0;
    if (trackableHabits.length > 0) {
      intensity = (totalCompletionLevel / trackableHabits.length) * 100;
    }

    heatmapData[dayStr] = {
        intensity,
        completed: totalCompletionLevel,
        total: trackableHabits.length
    };
  });

  return heatmapData;
};

/**
 * Calculates a consistency score for a set of habits.
 * @param habits - An array of habit objects.
 * @returns A consistency score from 0 to 100.
 */
export const calculateConsistencyScore = (habits: Habit[]): number => {
  if (habits.length === 0) return 0;

  const today = new Date();

  const habitScores = habits.map(habit => {
    const creationDate = new Date(habit.createdAt);
    const lookbackDays = 30;

    let completionValueSum = 0;
    let trackedDayCount = 0;
    
    for (let i = 0; i < lookbackDays; i++) {
        const day = subDays(today, i);
        if (day >= creationDate) {
            trackedDayCount++;
            const dayStr = format(day, 'yyyy-MM-dd');
            completionValueSum += habit.completionMap?.[dayStr]?.completionLevel || 0;
        }
    }

    const recentSuccessRate = trackedDayCount > 0 ? (completionValueSum / trackedDayCount) * 100 : 0;
    const streakScore = Math.min(habit.currentStreak / 30, 1) * 100;

    const habitScore = recentSuccessRate * 0.7 + streakScore * 0.3;
    
    const difficultyWeight = {
      easy: 0.9,
      medium: 1.0,
      hard: 1.1,
    }[habit.difficulty];

    return habitScore * difficultyWeight;
  });

  const totalScore = habitScores.reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / habits.length;

  return Math.round(Math.min(averageScore, 100)); // Cap at 100
};

export const getDailyHabitStats = (habits: Habit[]) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const trackableToday = habits.filter(habit => {
      const creationDate = new Date(habit.createdAt);
      creationDate.setHours(0, 0, 0, 0);
      return new Date() >= creationDate;
  });
  const total = trackableToday.length;
  if (total === 0) return { completed: 0, pending: 0, total: 0 };
  
  const completed = trackableToday.reduce((acc, habit) => {
      return acc + (habit.completionMap?.[todayStr]?.completionLevel || 0);
  }, 0);
  
  return { completed, pending: total - completed, total };
};

export const getWeeklyHabitStats = (habits: Habit[]) => {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  
  let totalCompletionSum = 0;
  let totalPossibleSum = 0;

  last7Days.forEach(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);

    const trackableHabits = habits.filter(habit => {
      const creationDate = new Date(habit.createdAt);
      creationDate.setHours(0, 0, 0, 0);
      return dayStart >= creationDate;
    });

    totalPossibleSum += trackableHabits.length;
    totalCompletionSum += trackableHabits.reduce((acc, habit) => {
        return acc + (habit.completionMap?.[dayStr]?.completionLevel || 0);
    }, 0);
  });

  return { completed: totalCompletionSum, pending: totalPossibleSum - totalCompletionSum, total: totalPossibleSum };
};

export const getMonthlyHabitStats = (habits: Habit[]) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const daysInMonthSoFar = eachDayOfInterval({ start: monthStart, end: today });

    let totalCompletionSum = 0;
    let totalPossibleSum = 0;

    daysInMonthSoFar.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
    
        const trackableHabits = habits.filter(habit => {
          const creationDate = new Date(habit.createdAt);
          creationDate.setHours(0, 0, 0, 0);
          return dayStart >= creationDate;
        });

        totalPossibleSum += trackableHabits.length;
        totalCompletionSum += trackableHabits.reduce((acc, habit) => {
            return acc + (habit.completionMap?.[dayStr]?.completionLevel || 0);
        }, 0);
    });

    return { completed: totalCompletionSum, pending: totalPossibleSum - totalCompletionSum, total: totalPossibleSum };
};
