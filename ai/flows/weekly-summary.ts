'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a weekly summary report of habit performance.
 *
 * - `generateWeeklySummary` - A function that analyzes habit data and returns a summary.
 * - `WeeklySummaryInput` - The input type for the function.
 * - `WeeklySummaryOutput` - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { WeeklyAnalyticsReportSchema, type WeeklyAnalyticsReport } from '@/lib/analytics';

export type WeeklySummaryInput = WeeklyAnalyticsReport;


const WeeklySummaryOutputSchema = z.object({
    summaryTitle: z.string().describe('A title for the report including the date range.'),
    overallPerformance: z.string().describe('A short, encouraging sentence (1-2 sentences) about the week\'s overall performance.'),
    highlights: z.array(z.string()).describe('A list of 2-3 key positive achievements or maintained streaks.'),
    challenges: z.array(z.string()).describe('A list of 1-2 areas for improvement or frequently missed habits.'),
    consistencyReport: z.string().describe('A brief comment on the current consistency score.'),
    finalInsight: z.string().describe('A concluding motivational tip or a question for reflection for the week ahead.'),
});
export type WeeklySummaryOutput = z.infer<typeof WeeklySummaryOutputSchema>;

export async function generateWeeklySummary(
  input: WeeklySummaryInput
): Promise<WeeklySummaryOutput> {
  return weeklySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklySummaryPrompt',
  input: { schema: z.object({ 
    formattedData: z.string(),
    dateRange: z.string(),
    currentConsistencyScore: z.number(),
  }) },
  output: { schema: WeeklySummaryOutputSchema },
  prompt: `You are a friendly and insightful AI coach that creates a weekly habit summary.
  Analyze the user's habit data for the past week ({{dateRange}}).

  Data:
  - Current Consistency Score: {{currentConsistencyScore}}%
  - Habits Data for the last 7 days:
  {{{formattedData}}}

  Your task is to generate a structured report. Be encouraging and focus on actionable insights.
  - Write a title for the report.
  - Summarize the overall performance in 1-2 sentences.
  - Identify 2-3 key highlights (e.g., "Great job hitting your 'Workout' goal!" or "You've got a new 5-day streak in 'Reading'!") Factor in difficulty; completing a 'hard' habit is a big deal.
  - Point out 1-2 challenges without being discouraging (e.g., "It looks like weekends were tough for 'Waking up early'." or "The 'hard' habit 'Learn Piano' was a bit of a struggle this week.").
  - Comment on the consistency score. If it's high, celebrate it. If it's low, be encouraging.
  - Provide a short, forward-looking insight to motivate them for the next week.
  
  Do not just list the raw data. Create a human-readable, narrative-style summary based on the data points.
  `,
});

const weeklySummaryFlow = ai.defineFlow(
  {
    name: 'weeklySummaryFlow',
    inputSchema: WeeklyAnalyticsReportSchema,
    outputSchema: WeeklySummaryOutputSchema,
  },
  async (input) => {
    let formattedData = '';
    input.habitsData.forEach(habit => {
        formattedData += `Habit: "${habit.habitName}" (Difficulty: ${habit.difficulty}, Current Streak: ${habit.currentStreak} days)\n`;
        let statusLine = "  - Weekly Progress: ";
        let hasData = false;
        habit.completionHistory.forEach((status, i) => {
            const day = input.dayNames[i];
            if (status === null) {
                // Not tracked
            } else if (status > 0) {
                statusLine += `${day} (${status * 100}%), `;
                hasData = true;
            } else { // status is 0
                const reason = habit.missedReasons[i];
                statusLine += `${day} (Missed${reason ? `: ${reason}` : ''}), `;
                hasData = true;
            }
        });
        if (hasData) {
            formattedData += statusLine.slice(0, -2) + '\n';
        } else {
            formattedData += "  - No tracked data for this week.\n";
        }
    });

    const { output } = await prompt({ 
        formattedData, 
        dateRange: input.dateRange,
        currentConsistencyScore: input.currentConsistencyScore,
    });
    return output!;
  }
);
