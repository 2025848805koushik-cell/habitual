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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useHabits } from "@/contexts/HabitsContext"
import type { Habit, Reminder } from "@/lib/types"
import { Switch } from "./ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

const colorOptions = [
  { label: "Blue", value: "#64B5F6" },
  { label: "Purple", value: "#9575CD" },
  { label: "Green", value: "#81C784" },
  { label: "Orange", value: "#FFB74D" },
  { label: "Red", value: "#E57373" },
  { label: "Teal", value: "#4DB6AC" },
];

interface HabitFormProps {
  habit: Habit | null;
  onFinished: () => void;
}

export function HabitForm({ habit, onFinished }: HabitFormProps) {
  const { addHabit, updateHabit } = useHabits();
  const { toast } = useToast();

  const formSchema = z.object({
    name: z.string().min(1, "Habit name cannot be empty."),
    color: z.string(),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    times: z.coerce.number().min(1, { message: "Must be at least 1."}),
    priority: z.enum(["low", "medium", "high"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    habitType: z.enum(['standard', 'timer']),
    duration: z.coerce.number().int().min(1).optional(),
    allowPartial: z.boolean(),
    
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
        const [hours, minutes] = data.reminderTime.split(':').map(Number);
        const reminderDateTime = new Date();
        reminderDateTime.setHours(hours, minutes, 0, 0);
        return reminderDateTime > new Date();
    }
    return true;
  }, {
      message: "Cannot set a reminder for a time in the past.",
      path: ["reminderTime"],
  });


  let defaultReminderTime: string | undefined;
  if (habit?.reminder?.reminderDateTime) {
      const d = new Date(habit.reminder.reminderDateTime);
      defaultReminderTime = format(d, "HH:mm");
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: habit?.name || "",
      habitType: habit?.habitType || 'standard',
      allowPartial: habit?.allowPartial || false,
      duration: habit?.duration || undefined,
      color: habit?.color || colorOptions[0].value,
      priority: habit?.priority || "medium",
      difficulty: habit?.difficulty || "medium",
      frequency: habit?.frequency || "daily",
      times: habit?.times || 1,
      reminderEnabled: !!habit?.reminder,
      reminderTime: defaultReminderTime,
      reminderMode: habit?.reminder?.reminderMode || "notification",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    let reminder: Reminder | undefined;

    if (values.reminderEnabled && values.reminderTime) {
      const [hours, minutes] = values.reminderTime.split(":");
      const reminderDateTime = new Date();
      reminderDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      reminder = {
          reminderDateTime: reminderDateTime.toISOString(),
          reminderMode: values.reminderMode,
      }
    }
    
    const habitData: Omit<Habit, 'id' | 'createdAt' | 'completionMap' | 'currentStreak' | 'longestStreak'> = {
      name: values.name,
      color: values.color,
      frequency: values.frequency,
      times: values.times,
      priority: values.priority,
      difficulty: values.difficulty,
      habitType: values.habitType,
      duration: values.habitType === 'timer' ? values.duration : undefined,
      allowPartial: values.habitType === 'standard' ? values.allowPartial : false,
      reminder: reminder,
    };

    if (habit) {
        const updatedHabit = { ...habit, ...habitData };
        updateHabit(updatedHabit);
        toast({ title: "Habit Updated!", description: `"${habitData.name}" has been saved.` });
    } else {
        addHabit(habitData);
        toast({ title: "Habit Created!", description: `You are now tracking "${habitData.name}".` });
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
              <FormLabel>Habit Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Read for 20 minutes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Card>
          <CardHeader><CardTitle className="text-base">Tracking</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="habitType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'timer') form.setValue('allowPartial', false);
                        else form.setValue('duration', undefined);
                      }}
                      defaultValue={field.value}
                      className="flex space-x-4 pt-1"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="standard" id="type-standard" /></FormControl>
                        <FormLabel htmlFor="type-standard" className="font-normal cursor-pointer">Standard (Check-off)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="timer" id="type-timer" /></FormControl>
                        <FormLabel htmlFor="type-timer" className="font-normal cursor-pointer">Timer</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("habitType") === 'timer' && (
              <FormField
                control={form.control} name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 10" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === "" ? undefined : +e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {form.watch("habitType") === 'standard' && (
              <FormField
                control={form.control} name="allowPartial"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Allow Partial Completion</FormLabel>
                      <FormDescription>Track progress in increments.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>


        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell /> Reminders</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control} name="reminderEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Reminders</FormLabel>
                    <FormDescription>Get a notification or alarm daily.</FormDescription>
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
                                        <FormControl><RadioGroupItem value="notification" id="mode-notification" /></FormControl>
                                        <FormLabel htmlFor="mode-notification" className="font-normal cursor-pointer">Notification</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="alarm" id="mode-alarm" /></FormControl>
                                        <FormLabel htmlFor="mode-alarm" className="font-normal cursor-pointer">Alarm</FormLabel>
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

        <Card>
          <CardHeader><CardTitle className="text-base">Categorization</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control} name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a color" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {colorOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: option.value }}/>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control} name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Goal</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control} name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="times"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Times</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">{habit ? 'Save Changes' : 'Create Habit'}</Button>
      </form>
    </Form>
  )
}
