"use client";

import React, { useState } from "react";
import { Plus, Goal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HabitForm } from "@/components/HabitForm";
import { HabitList } from "@/components/HabitList";
import { StatsCards } from "@/components/StatsCards";
import { ProgressCharts } from "@/components/ProgressCharts";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Habit } from "@/lib/types";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { MainNav } from "@/components/MainNav";
import { HabitProgressPieChart } from "@/components/HabitProgressPieChart";

export default function HabitualPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleOpenForm = (habit?: Habit) => {
    setEditingHabit(habit || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHabit(null);
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <div className="flex items-center space-x-2">
              <Goal className="h-6 w-6 text-primary" />
              <span className="inline-block font-bold text-xl font-headline">Habitual</span>
            </div>
            <MainNav />
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button onClick={() => handleOpenForm()}>
              <Plus className="mr-2 h-4 w-4" /> Add Habit
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-4 md:py-8">
          <div className="mx-auto grid w-full max-w-7xl gap-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Dashboard
            </h1>
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <HabitProgressPieChart period="daily" />
              <HabitProgressPieChart period="weekly" />
              <HabitProgressPieChart period="monthly" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProgressCharts />
              <HabitHeatmap />
            </div>
            <HabitList onEditHabit={handleOpenForm} />
          </div>
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingHabit ? "Edit Habit" : "Create New Habit"}</DialogTitle>
            <DialogDescription>
              {editingHabit ? "Update the details of your habit." : "Fill out the form to create a new habit to track."}
            </DialogDescription>
          </DialogHeader>
          <HabitForm habit={editingHabit} onFinished={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
