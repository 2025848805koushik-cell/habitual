"use server";

import { trackMomentumAndEncourage, MomentumTrackingInput } from '@/ai/flows/momentum-tracking';
import { generateWeeklyInsight, WeeklyInsightInput, WeeklyInsightOutput } from '@/ai/flows/weekly-insight';
import { generateWeeklySummary, WeeklySummaryInput, WeeklySummaryOutput } from '@/ai/flows/weekly-summary';

export async function getEncouragementAction(input: MomentumTrackingInput): Promise<{success: boolean; message: string}> {
  try {
    const result = await trackMomentumAndEncourage(input);
    return { success: true, message: result.encouragementMessage };
  } catch (error) {
    console.error("AI action failed:", error);
    return { success: false, message: "Failed to get encouragement. Please try again later." };
  }
}

export async function getWeeklyInsightAction(input: WeeklyInsightInput): Promise<{success: boolean; insight: string}> {
  try {
    const result = await generateWeeklyInsight(input);
    return { success: true, insight: result.insight };
  } catch (error) {
    console.error("AI action failed:", error);
    return { success: false, insight: "Could not generate an insight at this time. Please try again later." };
  }
}

export async function getWeeklySummaryAction(input: WeeklySummaryInput): Promise<{success: boolean; summary: WeeklySummaryOutput | null, error?: string}> {
  try {
    const result = await generateWeeklySummary(input);
    return { success: true, summary: result };
  } catch (error) {
    console.error("AI action failed:", error);
    return { success: false, summary: null, error: "Could not generate a summary at this time. Please try again later." };
  }
}
