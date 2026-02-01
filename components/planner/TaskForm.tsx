"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Bell } from "lucide-react"
import React from "react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTasks } from "@/contexts/TasksContext"
import type { Task, Reminder } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "../ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"


interface TaskFormProps {
  task: Task | null;
  date: string; // YYYY-MM-DD
  onFinished: () => void;
}

export function TaskForm({ task, date, onFinished }: TaskFormProps) {
  const { addTask, updateTask } = useTasks();
  const { toast } = useToast();

  const formSchema = z.object({
    name: z.string().min(1, "Task name cannot be empty."),
    reminderEnabled: z.boolean(),
    reminderTime: z.string().optional(),
    reminderMode: z.enum(["notification", "alarm"]),
  }).refine(data => {
      if (data.reminderEnabled) {
          return !!data.reminderTime;
      }
      return true;
  }, {
      message: "Time is required for a reminder.",
      path: ["reminderTime"],
  }).refine(data => {
    if (data.reminderEnabled && data.reminderTime) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (date === todayStr) {
            const [hours, minutes] = data.reminderTime.split(':').map(Number);
            const reminderDateTime = new Date();
            reminderDateTime.setHours(hours, minutes, 0, 0);
            return reminderDateTime > new Date();
        }
    }
    return true;
  }, {
    message: "Cannot set a reminder for a past time on today's date.",
    path: ["reminderTime"],
  });


  let defaultReminderTime: string | undefined;
  if (task?.reminder?.reminderDateTime) {
      const d = new Date(task.reminder.reminderDateTime);
      defaultReminderTime = format(d, "HH:mm");
  }


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: task?.name || "",
      reminderEnabled: !!task?.reminder,
      reminderTime: defaultReminderTime,
      reminderMode: task?.reminder?.reminderMode || "notification",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    let reminder: Reminder | undefined;
    if (values.reminderEnabled && values.reminderTime) {
        const [hours, minutes] = values.reminderTime.split(":");
        const reminderDateTime = new Date(date + 'T00:00:00'); // Use task date
        reminderDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        reminder = {
            reminderDateTime: reminderDateTime.toISOString(),
            reminderMode: values.reminderMode,
        }
    }

    const taskData = {
      name: values.name,
      date: date,
      reminder: reminder,
    };

    if (task) {
        updateTask({ ...task, ...taskData });
        toast({ title: "Task Updated!", description: `"${taskData.name}" has been saved.` });
    } else {
        addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'completed'>);
        toast({ title: "Task Created!", description: `You've added "${taskData.name}" to your planner.` });
    }
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Follow up with the team" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell /> Reminders</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control} name="reminderEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Reminders</FormLabel>
                    <FormDescription>Get a notification or alarm for this task.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch("reminderEnabled") && (
              <div className="space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="reminderTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control} name="reminderMode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reminder Type</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4 pt-1"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="notification" id="task-mode-notification" /></FormControl>
                                        <FormLabel htmlFor="task-mode-notification" className="font-normal cursor-pointer">Notification</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="alarm" id="task-mode-alarm" /></FormControl>
                                        <FormLabel htmlFor="task-mode-alarm" className="font-normal cursor-pointer">Alarm</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">{task ? 'Save Changes' : 'Create Task'}</Button>
      </form>
    </Form>
  )
}
