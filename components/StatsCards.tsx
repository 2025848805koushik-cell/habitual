"use client";

import React from "react";
import { Target, CheckCircle, ShieldCheck, Award } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHabits } from "@/contexts/HabitsContext";
import { getDailyTotalCompletions, calculateConsistencyScore } from "@/lib/habit-utils";
import { Skeleton } from "./ui/skeleton";

export function StatsCards() {
  const { habits, isLoading } = useHabits();

  const totalHabits = habits.length;
  
  const dailyCompletions = React.useMemo(() => getDailyTotalCompletions(habits), [habits]);
  const consistencyScore = React.useMemo(() => calculateConsistencyScore(habits), [habits]);
  
  const bestStreak = React.useMemo(() => {
    if (habits.length === 0) return 0;
    const streaks = habits.map(habit => habit.longestStreak);
    return Math.max(0, ...streaks);
  }, [habits]);

  const stats = [
    {
      title: "Total Habits",
      value: totalHabits,
      icon: <Target className="h-4 w-4 text-muted-foreground" />,
      description: "Number of habits you are tracking",
    },
    {
      title: "Daily Completions",
      value: dailyCompletions,
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      description: "Habits completed today",
    },
    {
      title: "Consistency Score",
      value: `${consistencyScore}%`,
      icon: <ShieldCheck className="h-4 w-4 text-muted-foreground" />,
      description: "Reflects overall consistency",
    },
    {
      title: "Best Streak",
      value: `${bestStreak} days`,
      icon: <Award className="h-4 w-4 text-muted-foreground" />,
      description: "Longest consecutive streak",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-sm hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
