"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Task, Reminder } from "@/lib/types";
import { format, addDays } from "date-fns";

const generateSampleTasks = (): Task[] => {
    const tasks: Task[] = [];
    const today = new Date();
    const sampleTaskNames = ["Finalize report", "Call John", "Schedule dentist appointment", "Buy groceries", "Plan weekend trip"];

    for (let i = 0; i < 5; i++) {
        const date = i < 2 ? today : addDays(today, i - 1);
        const dateStr = format(date, "yyyy-MM-dd");
        if (i < sampleTaskNames.length) {
            let reminder: Reminder | undefined;
            if (i === 1) { // Add a sample date-time reminder
                const reminderDate = new Date();
                reminderDate.setDate(reminderDate.getDate() + 1);
                reminderDate.setHours(9, 0, 0, 0);
                reminder = {
                    reminderDateTime: reminderDate.toISOString(),
                    reminderMode: 'notification'
                };
            }

            tasks.push({
                id: `task-${i + 1}-${new Date().getTime()}`,
                name: sampleTaskNames[i],
                date: dateStr,
                completed: i % 2 === 0 && i < 2,
                createdAt: new Date().toISOString(),
                reminder: reminder,
            });
        }
    }
    return tasks;
};

interface TasksContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  setTaskCompletion: (taskId: string, completed: boolean) => void;
  isLoading: boolean;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

const migrateTaskReminder = (oldTask: any): Task => {
    const { reminder, ...rest } = oldTask;
    let newReminder: Reminder | undefined = undefined;

    if (reminder && reminder.reminderDateTime && typeof reminder.reminderDateTime === 'string') {
        newReminder = reminder as Reminder;
    }
    
    return { ...rest, reminder: newReminder };
};


export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedTasksRaw = localStorage.getItem("tasks");
      if (storedTasksRaw) {
        const tasksData = JSON.parse(storedTasksRaw);
        // Migration check for old duration-based reminders
        if (tasksData.length > 0 && (tasksData[0].reminder?.hasOwnProperty('durationValue'))) {
            const migratedTasks = tasksData.map(migrateTaskReminder);
            setTasks(migratedTasks);
        } else {
            setTasks(tasksData);
        }
      } else {
        setTasks(generateSampleTasks().map(migrateTaskReminder));
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
      setTasks(generateSampleTasks().map(migrateTaskReminder));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
      } catch (error) {
        console.error("Failed to save tasks to localStorage", error);
      }
    }
  }, [tasks, isLoading]);

  const addTask = (newTaskData: Omit<Task, "id" | "createdAt" | "completed">) => {
    const newTask: Task = {
      id: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      completed: false,
      ...newTaskData,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const setTaskCompletion = (taskId: string, completed: boolean) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed } : task
      )
    );
  };
  
  const value = { tasks, addTask, updateTask, deleteTask, setTaskCompletion, isLoading };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
};
