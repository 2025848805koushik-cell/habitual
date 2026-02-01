"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useHabits } from "@/contexts/HabitsContext";
import { getWeeklyInsightAction } from "@/app/actions";
import { generateWeeklyAnalytics } from "@/lib/analytics";

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export function WeeklyInsightCard() {
  const { habits, isLoading: habitsLoading } = useHabits();
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
    }

    if (habitsLoading || habits.length === 0) {
      setIsLoading(false);
      return;
    }

    const lastInsightDateStr = localStorage.getItem("lastInsightDate");
    const now = new Date().getTime();

    if (lastInsightDateStr && (now - new Date(lastInsightDateStr).getTime()) < ONE_WEEK_IN_MS) {
      const storedInsight = localStorage.getItem("weeklyInsight");
      if (storedInsight) {
        setInsight(storedInsight);
      }
      setIsLoading(false);
    } else {
      const fetchInsight = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const analysisData = generateWeeklyAnalytics(habits);
          const result = await getWeeklyInsightAction(analysisData);
          if (result.success) {
            setInsight(result.insight);
            localStorage.setItem("weeklyInsight", result.insight);
            localStorage.setItem("lastInsightDate", new Date().toISOString());
          } else {
            setError(result.insight);
          }
        } catch (e) {
          setError("An unexpected error occurred while generating your weekly insight.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchInsight();
    }
  }, [habits, habitsLoading]);

  if (habits.length === 0 || habitsLoading) {
    return null;
  }

  let icon = <Lightbulb className="h-5 w-5" />;
  let tooltipContent = "Weekly Insight";
  let dialogTitle = "Your Weekly Insight";
  let dialogDescription = insight;
  let hasContent = !!(insight || error);
  
  if (isLoading) {
    icon = <Lightbulb className="h-5 w-5 animate-pulse" />;
    tooltipContent = "Analyzing your week...";
    hasContent = false;
  } else if (error) {
    icon = <AlertTriangle className="h-5 w-5 text-destructive" />;
    tooltipContent = "Insight Error";
    dialogTitle = "Weekly Insight Error";
    dialogDescription = error;
  } else if (!insight) {
    tooltipContent = "No new insight yet";
    hasContent = false;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => hasContent && setIsDialogOpen(true)} 
              disabled={!hasContent || isLoading}
              aria-label={tooltipContent}
            >
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {error ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Lightbulb className="h-5 w-5 text-primary" />}
              {dialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4 text-base text-foreground">
              {dialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
