"use client";

import React, { useState } from "react";
import { Clipboard, FileText, Bot, AlertTriangle, Sparkles, CheckCircle, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useHabits } from "@/contexts/HabitsContext";
import { useToast } from "@/hooks/use-toast";
import { getWeeklySummaryAction } from "@/app/actions";
import type { WeeklySummaryOutput } from "@/ai/flows/weekly-summary";
import { generateWeeklyAnalytics } from "@/lib/analytics";

export function WeeklySummaryCard() {
  const { habits, isLoading: habitsLoading } = useHabits();
  const [summary, setSummary] = useState<WeeklySummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    try {
      const summaryData = generateWeeklyAnalytics(habits);
      const result = await getWeeklySummaryAction(summaryData);
      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        setError(result.error || "An unknown error occurred.");
      }
    } catch (e) {
      setError("An unexpected error occurred while generating your summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateReportText = (): string => {
    if (!summary) return "";
    let text = `${summary.summaryTitle}\n\n`;
    text += `${summary.overallPerformance}\n\n`;
    text += `Consistency Report:\n- ${summary.consistencyReport}\n\n`;
    text += "Highlights:\n";
    summary.highlights.forEach(h => text += `- ${h}\n`);
    text += "\nChallenges:\n";
    summary.challenges.forEach(c => text += `- ${c}\n`);
    text += `\nThis week's insight:\n${summary.finalInsight}\n`;
    return text;
  };

  const handleCopyToClipboard = () => {
    const reportText = generateReportText();
    navigator.clipboard.writeText(reportText).then(() => {
      toast({
        title: "Copied to Clipboard!",
        description: "Your weekly summary has been copied.",
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy the summary to your clipboard.",
      });
    });
  };

  if (habitsLoading || habits.length === 0) {
      return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Weekly Report">
                          <FileText className="h-5 w-5" />
                      </Button>
                  </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                  <p>Weekly Report</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary"/>
              Weekly Report
          </DialogTitle>
          <DialogDescription>
              Generate an AI-powered summary of your last 7 days of activity.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
          {isLoading && (
              <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-3/4 mt-4" />
                  <Skeleton className="h-4 w-full" />
              </div>
          )}
          {error && (
              <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <p>{error}</p>
              </div>
          )}
          {summary && (
              <div className="space-y-4 text-sm">
                  <h3 className="font-bold text-base text-foreground">{summary.summaryTitle}</h3>
                  <p>{summary.overallPerformance}</p>
                  
                  <div>
                    <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-green-500" /> Highlights</h4>
                    <ul className="list-disc list-inside pl-2 text-muted-foreground">
                      {summary.highlights.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold flex items-center gap-2"><TrendingDown className="h-4 w-4 text-amber-500" /> Challenges</h4>
                    <ul className="list-disc list-inside pl-2 text-muted-foreground">
                      {summary.challenges.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  
                  <div>
                      <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-500" /> Consistency</h4>
                      <p className="pl-2 text-muted-foreground">{summary.consistencyReport}</p>
                  </div>

                  <div className="bg-accent/50 p-3 rounded-md border-accent/80">
                      <h4 className="font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> This Week's Tip</h4>
                      <p className="pl-2 text-muted-foreground italic">{summary.finalInsight}</p>
                  </div>
              </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full sm:w-auto">
              <Bot className="mr-2 h-4 w-4" />
              {isLoading ? "Generating..." : summary ? "Regenerate" : "Generate Report"}
          </Button>
          {summary && (
              <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy to Clipboard
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
