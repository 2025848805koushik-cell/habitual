"use client";

import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { useHabits } from '@/contexts/HabitsContext';
import { getHeatmapData } from '@/lib/habit-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from './ui/skeleton';

const DayWithTooltip: React.FC<{ date: Date; displayMonth: Date; data: ReturnType<typeof getHeatmapData> }> = ({ date, displayMonth, data }) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = data[dateStr];

    return (
        <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
                <span className="relative z-10">{format(date, 'd')}</span>
            </TooltipTrigger>
            {dayData && isSameMonth(date, displayMonth) && (
                <TooltipContent>
                    <p>{format(date, 'MMMM d, yyyy')}</p>
                    {dayData.total > 0 ? (
                        <p>{dayData.completed} of {dayData.total} habits completed ({Math.round(dayData.intensity)}%).</p>
                    ) : (
                        <p>No habits tracked on this day.</p>
                    )}
                </TooltipContent>
            )}
        </Tooltip>
    );
};

export function HabitHeatmap() {
    const { habits, isLoading } = useHabits();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const heatmapData = useMemo(() => getHeatmapData(habits, currentMonth), [habits, currentMonth]);

    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const modifierStyles = useMemo(() => {
        const styles: Record<string, React.CSSProperties> = {};
        for (const dateStr in heatmapData) {
            const date = new Date(dateStr + 'T12:00:00');
            if (!isSameMonth(date, currentMonth)) continue;

            const data = heatmapData[dateStr];
            if (data && data.total > 0) {
                if (data.intensity > 0) {
                    const opacity = 0.2 + (data.intensity / 100) * 0.8;
                    styles[dateStr] = {
                        backgroundColor: `hsl(var(--primary))`,
                        opacity: opacity,
                        color: data.intensity > 60 ? 'hsl(var(--primary-foreground))' : 'inherit',
                    };
                } else {
                     styles[dateStr] = {
                        backgroundColor: `hsl(var(--muted))`,
                        opacity: 0.5,
                    };
                }
            }
        }
        return styles;
    }, [heatmapData, currentMonth]);
    
    const modifiers = useMemo(() => {
       return Object.keys(modifierStyles).reduce((acc, dateStr) => {
           acc[dateStr] = new Date(dateStr + 'T12:00:00');
           return acc;
       }, {} as Record<string, Date>);
    }, [modifierStyles]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2"/>
                    <Skeleton className="h-4 w-48"/>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full"/>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm transition-shadow hover:shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Habit Heatmap</CardTitle>
                        <CardDescription>Daily completion intensity for {format(currentMonth, 'MMMM yyyy')}.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <TooltipProvider>
                    <Calendar
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        showOutsideDays
                        modifiers={modifiers}
                        modifierStyles={modifierStyles}
                        components={{
                            DayContent: (props) => <DayWithTooltip date={props.date} displayMonth={currentMonth} data={heatmapData} />
                        }}
                        classNames={{
                           day_today: "border-2 border-primary/80",
                        }}
                    />
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
