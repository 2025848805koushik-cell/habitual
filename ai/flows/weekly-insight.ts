'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing weekly habit data and generating an insight.
 *
 * - `generateWeeklyInsight` - A function that analyzes habit data and returns an insight.
 * - `WeeklyInsightInput` - The input type for the generateWeeklyInsight function.
 * - `WeeklyInsightOutput` - The return type for the generateWeeklyInsight function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { WeeklyAnalyticsReportSchema, type WeeklyAnalyticsReport } from '@/lib/analytics';

export type WeeklyInsightInput = WeeklyAnalyticsReport;

const WeeklyInsightOutputSchema = z.object({
  insight: z
    .string()
    .describe('A short, actionable, and encouraging insight based on the user\'s weekly habit performance. Should be 1-3 sentences.'),
});
export type WeeklyInsightOutput = z.infer<typeof WeeklyInsightOutputSchema>;

export async function generateWeeklyInsight(
  input: WeeklyInsightInput
): Promise<WeeklyInsightOutput> {
  return weeklyInsightFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklyInsightPrompt',
  input: { schema: z.object({ formattedData: z.string() }) },
  output: { schema: WeeklyInsightOutputSchema },
  prompt: `You are a friendly and insightful AI assistant that helps users understand their habits.
  Analyze the user's habit completion data for the past 7 days, provided below. Completion is tracked from 0 (0%) to 1 (100%). Also consider the difficulty of each habit.

  Data:
  {{{formattedData}}}

  Your task is to identify one key pattern or insight from this data. Look for things like:
  - Is there a specific day of the week where habits are consistently missed? (e.g., "It looks like Saturdays are a tough day for sticking to habits.")
  - Is there a common reason for missing habits? (e.g., "I noticed 'Tired' was a common reason for missed habits this week.")
  - Is there a specific habit that is being neglected? Is it a 'hard' one?
  - Acknowledge strong performance, especially on 'hard' habits. (e.g., "Great job on your consistency with the 'hard' habits this week!")

  Based on your analysis, generate a single, concise insight. It should be encouraging and, if possible, gently suggest an area for focus. Frame it as a friendly observation. Do not be overly verbose. Keep it to 1-3 sentences.
  Example insight: "You've been great with your morning habits, but it seems like motivation dips on weekends. Maybe a small reward for Saturday completions could help?"
  Another example: "Amazing consistency this week! You've even conquered your hard habits. Keep up the great momentum!"
  `,
});

const weeklyInsightFlow = ai.defineFlow(
  {
    name: 'weeklyInsightFlow',
    inputSchema: WeeklyAnalyticsReportSchema,
    outputSchema: WeeklyInsightOutputSchema,
  },
  async (input) => {
    // Format the data into a readable string for the prompt.
    let formattedData = `The last 7 days were: ${input.dayNames.join(', ')}.\n\n`;
    input.habitsData.forEach(habit => {
        formattedData += `Habit: "${habit.habitName}" (Difficulty: ${habit.difficulty})\n`;
        let statusLine = "  - Progress: ";
        let hasData = false;
        habit.completionHistory.forEach((status, i) => {
            const day = input.dayNames[i];
            if (status === null) {
                // Not tracked yet on this day, so don't report it
            } else if (status > 0) {
                statusLine += `${day} (Completed ${status * 100}%), `;
                hasData = true;
            } else { // status is 0
                const reason = habit.missedReasons[i];
                statusLine += `${day} (Missed${reason ? `: ${reason}` : ''}), `;
                hasData = true;
            }
        });

        if (hasData) {
            formattedData += statusLine.slice(0, -2) + '\n'; // Remove trailing comma and space
        } else {
            formattedData += "  - No data for the last 7 days.\n"
        }
    });

    const { output } = await prompt({ formattedData });
    return output!;
  }
);
