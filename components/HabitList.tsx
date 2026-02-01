"use client"

import React, { useState } from "react"
import { useHabits } from "@/contexts/HabitsContext"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import type { Habit } from "@/lib/types"
import { HabitCard } from "./HabitCard"
import { Skeleton } from "./ui/skeleton"

interface HabitListProps {
  onEditHabit: (habit: Habit) => void;
}

export function HabitList({ onEditHabit }: HabitListProps) {
  const { habits, isLoading } = useHabits()

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        {Array.from({length: 4}).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex space-x-2">
                {Array.from({length: 7}).map((_, j) => (
                  <Skeleton key={j} className="h-8 w-8 rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <CardHeader>
          <CardTitle>No Habits Yet</CardTitle>
          <CardDescription>Click "Add Habit" to start tracking your goals.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} onEdit={() => onEditHabit(habit)} />
      ))}
    </div>
  )
}
