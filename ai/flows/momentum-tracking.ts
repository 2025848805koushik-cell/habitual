'use server';

/**
 * @fileOverview This file defines a Genkit flow for tracking user habit completion momentum and providing personalized encouraging messages if slippage is detected.
 *
 * - `trackMomentumAndEncourage` -  A function that tracks momentum and provides encouraging messages.
 * - `MomentumTrackingInput` - The input type for the trackMomentumAndEncourage function.
 * - `MomentumTrackingOutput` - The return type for the trackMomentumAndEncourage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MomentumTrackingInputSchema = z.object({
  habitName: z.string().describe('The name of the habit being tracked.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty of the habit.'),
  completionHistory: z
    .array(z.boolean())
    .describe(
      'An array of booleans representing the completion history of the habit.  True indicates completion, false indicates non-completion. The array should represent the last 7 days.'
    ),
});
export type MomentumTrackingInput = z.infer<typeof MomentumTrackingInputSchema>;

const MomentumTrackingOutputSchema = z.object({
  encouragementMessage: z
    .string()
    .describe(
      'A personalized encouraging message to motivate the user to get back on track with their habit. If there is no slippage, the message should be positive and encouraging.'
    ),
});
export type MomentumTrackingOutput = z.infer<typeof MomentumTrackingOutputSchema>;

export async function trackMomentumAndEncourage(
  input: MomentumTrackingInput
): Promise<MomentumTrackingOutput> {
  return trackMomentumAndEncourageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'momentumTrackingPrompt',
  input: {schema: MomentumTrackingInputSchema},
  output: {schema: MomentumTrackingOutputSchema},
  prompt: `You are a motivational AI assistant that analyzes user habit completion data and provides encouraging messages.

  Analyze the user's habit completion history for the past 7 days for the habit "{{habitName}}". This habit is rated as '{{difficulty}}' difficulty.
  The completion history is represented as an array of booleans, where true indicates completion and false indicates non-completion.

  Completion History: {{{completionHistory}}}

  Determine if there has been a significant slippage in the user's progress compared to their typical completion rate.
  If there is a significant decrease in habit completions, provide a personalized encouraging message to motivate the user to get back on track.
  If the user is maintaining a consistent completion rate, provide a positive and encouraging message to reinforce their progress.

  Ensure the encouragement message is tailored to the specific habit being tracked and its difficulty. Be more understanding for 'hard' habits.
`,
});

const trackMomentumAndEncourageFlow = ai.defineFlow(
  {
    name: 'trackMomentumAndEncourageFlow',
    inputSchema: MomentumTrackingInputSchema,
    outputSchema: MomentumTrackingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
