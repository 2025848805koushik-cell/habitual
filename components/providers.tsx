"use client";

import { ThemeProvider } from "@/components/ThemeProvider";
import { HabitsProvider } from "@/contexts/HabitsContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { Toaster } from "@/components/ui/toaster";
import { ReminderManager } from "@/components/ReminderManager";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <HabitsProvider>
        <TasksProvider>
          <ReminderManager />
          {children}
          <Toaster />
        </TasksProvider>
      </HabitsProvider>
    </ThemeProvider>
  );
}
