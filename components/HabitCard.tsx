"use client"

import React, { useState, useEffect } from "react"
import { format, subDays, isFuture, isToday } from "date-fns"
import { Checkbox } from "./ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { useHabits } from "@/contexts/HabitsContext"
import type { Habit } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { MoreVertical, Bot, Trash2, Edit, Bell, Timer, Play, Pause, X, CheckCircle2, Check } from "lucide-react"
import { Progress } from "./ui/progress"
import { getEncouragementAction } from "@/app/actions"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { MissedReasonDialog } from "./MissedReasonDialog"

interface HabitCardProps {
  habit: Habit
  onEdit: () => void
}

const today = new Date();
const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

const partialCompletionLevels = [
    { level: 0, label: 'X', display: 'Missed' },
    { level: 0.25, label: '¼', display: '25% Complete' },
    { level: 0.5, label: '½', display: '50% Complete' },
    { level: 0.75, label: '¾', display: '75% Complete' },
    { level: 1, label: <Check className="w-4 h-4" />, display: '100% Complete' },
];

export function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { setCompletion, deleteHabit, logMissedReason } = useHabits();
  const [isEncouragementLoading, setIsEncouragementLoading] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [reasonDialogState, setReasonDialogState] = useState<{ open: boolean, date?: string }>({ open: false });

  const isTimerHabit = habit.habitType === 'timer';
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isCompletedToday = habit.completionMap[todayStr]?.completionLevel === 1;

  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [timeLeft, setTimeLeft] = useState(habit.duration ? habit.duration * 60 : 0);

  const reminderDate = habit.reminder?.reminderDateTime ? new Date(habit.reminder.reminderDateTime) : null;
  const isReminderDateValid = reminderDate && !isNaN(reminderDate.getTime());

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (timerState === 'running') {
      timerId = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [timerState]);

  useEffect(() => {
    if (timeLeft <= 0 && timerState === 'running') {
      if (!isCompletedToday) {
          setCompletion(habit.id, todayStr, 1);
      }
      setTimerState('idle');
      new Notification("Habit Complete!", { body: `You've completed your habit: ${habit.name}` });
    }
  }, [timeLeft, timerState, isCompletedToday, habit.id, habit.name, todayStr, setCompletion]);
  
  useEffect(() => {
      if (isCompletedToday && timerState !== 'idle') {
          setTimerState('idle');
          setTimeLeft(habit.duration ? habit.duration * 60 : 0);
      }
  }, [isCompletedToday, timerState, habit.duration]);


  const completionsLast7Days = last7Days.reduce((sum, day) => {
    const level = habit.completionMap[format(day, 'yyyy-MM-dd')]?.completionLevel || 0;
    return sum + level;
  }, 0);

  const progress = habit.frequency === 'daily' 
    ? (completionsLast7Days / 7) * 100 
    : (completionsLast7Days / habit.times) * 100;

  const handleGetEncouragement = async () => {
    setIsEncouragementLoading(true);
    const completionHistory = last7Days.map(day => (habit.completionMap[format(day, 'yyyy-MM-dd')]?.completionLevel || 0) > 0);
    const result = await getEncouragementAction({ 
      habitName: habit.name, 
      completionHistory,
      difficulty: habit.difficulty,
    });
    if(result.success) {
      setEncouragementMessage(result.message);
    } else {
      setEncouragementMessage("I'm sorry, I couldn't come up with anything right now. But I know you can do it!");
    }
    setIsEncouragementLoading(false);
    setIsAIModalOpen(true);
  }

  const priorityMap = { low: "outline", medium: "secondary", high: "default" } as const;
  const difficultyMap = { easy: "secondary", medium: "outline", hard: "default" } as const;

  const handlePartialCompletionChange = (dateStr: string, level: number) => {
    if (isFuture(new Date(dateStr + "T00:00:00"))) return;
    
    // Prevent re-clicking the same level from doing anything
    const currentLevel = habit.completionMap[dateStr]?.completionLevel;
    if (currentLevel === level) return;

    if (level === 0) {
      setReasonDialogState({ open: true, date: dateStr });
    } else {
      setCompletion(habit.id, dateStr, level);
    }
  };

  return (
    <Card style={{ borderLeft: `4px solid ${habit.color}` }} className="flex flex-col transition-shadow duration-200 hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline text-lg">{habit.name}</CardTitle>
          <CardDescription>
            {isTimerHabit
              ? `${habit.duration} minutes, ${habit.frequency}`
              : `${habit.times} time${habit.times > 1 ? 's' : ''} ${habit.frequency}`
            }
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant={difficultyMap[habit.difficulty]} className="capitalize">{habit.difficulty}</Badge>
            <Badge variant={priorityMap[habit.priority]} className="capitalize">{habit.priority}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4 text-destructive" /><span className="text-destructive">Delete</span></DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. This will permanently delete your habit and all its data.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteHabit(habit.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {habit.reminder && isReminderDateValid && reminderDate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Bell className="mr-2 h-4 w-4" />
            <span className="capitalize">
              Reminder: Daily @ {format(reminderDate, "h:mm a")} ({habit.reminder.reminderMode})
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Weekly Progress</span>
          <span>{completionsLast7Days.toFixed(2)} / {habit.frequency === 'daily' ? 7 : habit.times}</span>
        </div>
        <Progress value={progress} />

        {isTimerHabit ? (
          <div className="flex flex-col items-center justify-center space-y-4 pt-4 text-center">
            {isCompletedToday ? (
                 <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                    <p className="font-semibold">Completed for today!</p>
                    <p className="text-sm text-muted-foreground">Well done!</p>
                 </div>
            ) : (
                <>
                    <p className="text-6xl font-bold font-mono tabular-nums">
                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </p>
                    {timerState === 'idle' && (
                        <Button size="lg" onClick={() => setTimerState('running')}><Timer className="mr-2 h-5 w-5" />Start {habit.duration} min Timer</Button>
                    )}
                    {timerState === 'running' && (
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="lg" onClick={() => setTimerState('paused')}><Pause className="mr-2 h-5 w-5" /> Pause</Button>
                             <Button variant="ghost" size="icon" onClick={() => { setTimerState('idle'); setTimeLeft(habit.duration! * 60);}}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    )}
                    {timerState === 'paused' && (
                         <div className="flex items-center gap-4">
                            <Button size="lg" onClick={() => setTimerState('running')}><Play className="mr-2 h-5 w-5" /> Resume</Button>
                             <Button variant="destructive" size="lg" onClick={() => { setTimerState('idle'); setTimeLeft(habit.duration! * 60);}}>
                                <X className="mr-2 h-5 w-5" /> Cancel
                             </Button>
                        </div>
                    )}
                </>
            )}
          </div>
        ) : (
          <div className="flex justify-between space-x-2 pt-2">
            <TooltipProvider>
              {last7Days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const completionData = habit.completionMap[dateStr];
                const completionLevel = completionData?.completionLevel || 0;
                const missedReason = completionData?.reason;
                const isDisabled = isFuture(day) && !isToday(day);

                return (
                  <div key={dateStr} className="flex flex-col items-center gap-2 w-full">
                    <span className="text-xs text-muted-foreground">{format(day, "eee")}</span>
                    {habit.allowPartial ? (
                        <div className="flex flex-col items-center gap-2">
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-10 w-10 rounded-lg p-0" disabled={isDisabled}>
                                                <div className="h-full w-full rounded-lg flex items-center justify-center transition-all duration-200"
                                                    style={{ backgroundColor: completionLevel > 0 ? habit.color : 'hsl(var(--muted))', opacity: completionLevel > 0 ? completionLevel * 0.8 + 0.2 : 1 }}
                                                >
                                                  {completionLevel === 1 && <Check className="h-5 w-5 text-white"/>}
                                                  {completionLevel > 0 && completionLevel < 1 && <span className="text-sm font-bold text-primary-foreground">{`${completionLevel * 100}`}</span>}
                                                  {completionLevel === 0 && <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>}
                                                </div>
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{format(day, "MMMM d, yyyy")}</p>
                                        {completionLevel > 0 && <p className="text-xs">{completionLevel * 100}% Complete</p>}
                                        {missedReason && <p className="text-xs text-muted-foreground">Reason: {missedReason}</p>}
                                        {completionLevel === 0 && !missedReason && !isDisabled && <p className="text-xs text-muted-foreground">Missed</p>}
                                    </TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent>
                                    {partialCompletionLevels.map(({level, label, display}) => (
                                        <DropdownMenuItem key={level} onSelect={() => handlePartialCompletionChange(dateStr, level)}>
                                            <span className="flex items-center justify-center w-5 mr-2">{label}</span>
                                            <span>{display}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-2">
                                <Checkbox
                                checked={completionLevel === 1}
                                onCheckedChange={(checked) => {
                                    if (checked) { setCompletion(habit.id, dateStr, 1); } 
                                    else { setReasonDialogState({ open: true, date: dateStr }); }
                                }}
                                disabled={isDisabled}
                                className="h-8 w-8 rounded-md"
                                style={completionLevel === 1 ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
                                />
                            </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{format(day, "MMMM d, yyyy")}</p>
                                {missedReason && <p className="text-xs text-muted-foreground">Reason: {missedReason}</p>}
                                {completionLevel < 1 && !missedReason && !isDisabled && <p className="text-xs text-muted-foreground">Missed</p>}
                            </TooltipContent>
                        </Tooltip>
                    )}
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleGetEncouragement} disabled={isEncouragementLoading}>
          <Bot className="mr-2 h-4 w-4" />
          {isEncouragementLoading ? "Thinking..." : "Get Encouragement"}
        </Button>
      </CardFooter>

      <AlertDialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> A message for you</AlertDialogTitle>
            <AlertDialogDescription className="pt-4 text-base text-foreground">{encouragementMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setIsAIModalOpen(false)}>Got it, thanks!</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MissedReasonDialog
        open={reasonDialogState.open}
        onOpenChange={(open) => { if (!open) setReasonDialogState({ open: false }); }}
        onSave={(reason) => {
            if (reasonDialogState.date) logMissedReason(habit.id, reasonDialogState.date, reason);
            setReasonDialogState({ open: false });
        }}
        onSkip={() => {
            if (reasonDialogState.date) setCompletion(habit.id, reasonDialogState.date, 0);
            setReasonDialogState({ open: false });
        }}
      />
    </Card>
  )
}
