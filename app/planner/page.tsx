"use client";

import React, { useState, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { Plus, Goal, MoreVertical, Edit, Trash2, Calendar as CalendarIcon, Bell } from 'lucide-react';

import { useTasks } from '@/contexts/TasksContext';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MainNav } from '@/components/MainNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TaskForm } from '@/components/planner/TaskForm';
import { PlannerProgressChart } from '@/components/planner/PlannerProgressChart';
import { cn } from '@/lib/utils';

const DateSelector = ({ selectedDate, setSelectedDate }: { selectedDate: Date, setSelectedDate: (date: Date) => void }) => {
    const today = new Date();
    const dates = Array.from({ length: 8 }, (_, i) => addDays(today, i));

    return (
        <div className="flex space-x-2 overflow-x-auto pb-2">
            {dates.map(date => (
                <Button
                    key={date.toISOString()}
                    variant={isSameDay(date, selectedDate) ? 'default' : 'outline'}
                    onClick={() => setSelectedDate(date)}
                    className="flex flex-col h-auto px-4 py-2"
                >
                    <span className="text-xs">{format(date, 'EEE')}</span>
                    <span className="text-lg font-bold">{format(date, 'd')}</span>
                </Button>
            ))}
        </div>
    );
};

const TaskItem = ({ task, onEdit, onDelete }: { task: Task, onEdit: () => void, onDelete: () => void }) => {
    const { setTaskCompletion } = useTasks();

    const reminderDate = task.reminder?.reminderDateTime ? new Date(task.reminder.reminderDateTime) : null;
    const isReminderDateValid = reminderDate && !isNaN(reminderDate.getTime());

    return (
        <div className="flex items-center space-x-4 p-3 bg-card rounded-lg border">
            <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={(checked) => setTaskCompletion(task.id, !!checked)}
                className="h-5 w-5"
            />
            <div className="flex-1">
                <label htmlFor={`task-${task.id}`} className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
                    {task.name}
                </label>
                {isReminderDateValid && reminderDate && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                        <Bell className="h-3 w-3"/>
                        {format(reminderDate, "MMM d, h:mm a")}
                    </p>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this task.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};


export default function PlannerPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { tasks, deleteTask, isLoading } = useTasks();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const handleOpenForm = (task?: Task) => {
        setEditingTask(task || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingTask(null);
    };

    const filteredTasks = useMemo(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return tasks.filter(task => task.date === dateStr);
    }, [tasks, selectedDate]);

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
                            <Plus className="mr-2 h-4 w-4" /> Add Task
                        </Button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <div className="container py-4 md:py-8">
                    <div className="mx-auto grid w-full max-w-7xl gap-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Daily Planner</h1>
                                <p className="text-muted-foreground">Plan your day and stay organized.</p>
                            </div>
                        </div>

                        <DateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-2 shadow-sm transition-shadow hover:shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5 text-primary"/>
                                        Tasks for {format(selectedDate, 'MMMM d, yyyy')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : filteredTasks.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredTasks.map(task => (
                                                <TaskItem
                                                    key={task.id}
                                                    task={task}
                                                    onEdit={() => handleOpenForm(task)}
                                                    onDelete={() => deleteTask(task.id)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                                            <h3 className="text-lg font-semibold">No tasks for this day</h3>
                                            <p className="text-sm text-muted-foreground mt-1">Click "Add Task" to plan your day.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-8">
                               <PlannerProgressChart tasks={filteredTasks} isLoading={isLoading}/>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
                        <DialogDescription>
                            {editingTask ? "Update the details of your task." : "Plan an activity for " + format(selectedDate, 'MMMM d')}
                        </DialogDescription>
                    </DialogHeader>
                    <TaskForm
                        task={editingTask}
                        date={format(selectedDate, 'yyyy-MM-dd')}
                        onFinished={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
