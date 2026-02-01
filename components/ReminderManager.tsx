"use client";

import { useEffect, useRef } from "react";
import { useHabits } from "@/contexts/HabitsContext";
import { useTasks } from "@/contexts/TasksContext";
import { format } from "date-fns";
import type { Habit, Task, Reminder } from "@/lib/types";

type RemindableItem = (Habit | Task) & { reminder?: Reminder };
type ActiveAlarmsMap = Map<string, { oscillator: OscillatorNode; context: AudioContext }>;
type TriggeredRemindersMap = Map<string, boolean>; // Key is now `itemId-yyyy-mm-dd`

export function ReminderManager() {
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const activeAlarms = useRef<ActiveAlarmsMap>(new Map());
  const triggeredReminders = useRef<TriggeredRemindersMap>(new Map());

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const stopAlarm = (itemId: string) => {
    const alarm = activeAlarms.current.get(itemId);
    if (alarm) {
      try {
        alarm.oscillator.stop();
        alarm.context.close();
      } catch (e) {
        // Ignore errors if context is already closed
      } finally {
        activeAlarms.current.delete(itemId);
      }
    }
  };

  const playAlarm = (itemId: string) => {
    stopAlarm(itemId); // Stop any existing alarm for this item

    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();

    // Beep pattern
    const beepInterval = setInterval(() => {
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
    }, 1000);

    oscillator.onended = () => {
        clearInterval(beepInterval);
    };

    activeAlarms.current.set(itemId, { oscillator, context: audioContext });
  };
  
  const triggerReminder = (item: RemindableItem) => {
    const title = "Habitual Reminder";
    const body = `Just a friendly nudge for: ${item.name}`;

    if (item.reminder?.reminderMode === 'alarm') {
      playAlarm(item.id);
      const notification = new Notification(title, {
        body: `${body} (Alarming)`,
        tag: item.id,
        requireInteraction: true,
      });
      notification.onclick = () => {
        stopAlarm(item.id);
        notification.close();
      }
    } else {
      new Notification(title, {
        body: body,
        tag: item.id,
      });
    }
  };


  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const allItems: RemindableItem[] = [...habits, ...tasks];

      for (const item of allItems) {
        if (!item.reminder || !item.reminder.reminderDateTime) {
          stopAlarm(item.id);
          continue;
        }

        const isHabit = 'frequency' in item;
        const reminderTemplate = new Date(item.reminder.reminderDateTime);

        let reminderTimeForToday: Date;

        if (isHabit) {
            // For habits, create a reminder for *today* at the specified time
            reminderTimeForToday = new Date();
            reminderTimeForToday.setHours(reminderTemplate.getHours(), reminderTemplate.getMinutes(), reminderTemplate.getSeconds(), 0);
        } else {
            // For tasks, the reminder time is absolute
            reminderTimeForToday = reminderTemplate;
        }
        
        const reminderDateStr = format(reminderTimeForToday, 'yyyy-MM-dd');

        let isCompleted = false;
        if (isHabit) { // It's a Habit
          isCompleted = (item as Habit).completionMap[reminderDateStr]?.completionLevel === 1;
        } else if ('completed' in item) { // It's a Task
          isCompleted = (item as Task).completed;
        }
        
        // If completed for the reminder's date, stop any active alarm and continue.
        if (isCompleted) {
            stopAlarm(item.id);
            continue;
        }
        
        // Time is up for today, and it's not completed
        if (now >= reminderTimeForToday) {
            const triggeredKey = `${item.id}-${reminderDateStr}`;
            if (!triggeredReminders.current.has(triggeredKey)) {
                triggerReminder(item);
                triggeredReminders.current.set(triggeredKey, true);
            }
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(intervalId);
  }, [habits, tasks]);

  return null;
}
