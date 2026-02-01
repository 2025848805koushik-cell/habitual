import { format, subDays } from 'date-fns';
import { z } from 'zod';
import type { Habit } from './types';

// Zod Schemas for validation in AI flows
export const HabitWeeklyAnalyticsSchema = z.object({
  habitName: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  completionHistory: z.array(z.number().nullable()).describe('Completion level (0-1) for the last 7 days.'),
  missedReasons: z.array(z.string().nullable()).describe('Reasons for missing the habit.'),
  currentStreak: z.number(),
});

export const WeeklyAnalyticsReportSchema = z.object({
  habitsData: z.array(HabitWeeklyAnalyticsSchema),
  currentConsistencyScore: z.number(),
  dayNames: z.array(z.string()).describe('The names of the last 7 days, e.g., ["Monday", "Tuesday", ...]'),
  dateRange: z.string().describe('e.g., "October 28 - November 3"'),
});

// TypeScript Types
export type HabitWeeklyAnalytics = z.infer<typeof HabitWeeklyAnalyticsSchema>;
export type WeeklyAnalyticsReport = z.infer<typeof WeeklyAnalyticsReportSchema>;


export function generateWeeklyAnalytics(habits: Habit[]): WeeklyAnalyticsReport {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
    const dayNames = last7Days.map(day => format(day, 'eeee'));
    const dateRange = `${format(last7Days[0], 'MMMM d')} - ${format(last7Days[6], 'MMMM d')}`;

    const habitsData = habits.map(habit => {
        const completionHistory: (number | null)[] = [];
        const missedReasons: (string | null)[] = [];
        const creationDate = new Date(habit.createdAt);
        creationDate.setHours(0, 0, 0, 0);

        last7Days.forEach(day => {
            const loopDay = new Date(day);
            loopDay.setHours(0, 0, 0, 0);
            const dateStr = format(loopDay, "yyyy-MM-dd");

            if (loopDay < creationDate) {
                completionHistory.push(null);
                missedReasons.push(null);
            } else {
                const completionData = habit.completionMap[dateStr];
                completionHistory.push(completionData?.completionLevel ?? 0);
                missedReasons.push(completionData?.reason ?? null);
            }
        });

        return {
          habitName: habit.name,
          difficulty: habit.difficulty,
          completionHistory,
          missedReasons,
          currentStreak: habit.currentStreak,
        };
    });

    const totalConsistency = habits.length > 0
      ? habits.reduce((sum, h) => sum + ((h.difficulty === 'hard' ? 1.1 : h.difficulty === 'easy' ? 0.9 : 1.0) * h.currentStreak), 0) / habits.length
      : 0;

    return {
        habitsData,
        dayNames,
        dateRange,
        currentConsistencyScore: Math.min(100, Math.round(totalConsistency)),
    };
}
