"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from '@/contexts/HabitsContext';
import { getDailyHabitStats, getWeeklyHabitStats, getMonthlyHabitStats } from '@/lib/habit-utils';

interface HabitProgressPieChartProps {
  period: 'daily' | 'weekly' | 'monthly';
}

const COLORS = ['hsl(var(--chart-3))', 'hsl(var(--muted))'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent === 0) return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function HabitProgressPieChart({ period }: HabitProgressPieChartProps) {
    const { habits, isLoading } = useHabits();

    const { data, title, description } = useMemo(() => {
        if (isLoading || habits.length === 0) {
            return { data: [], title: '', description: '' };
        }

        let stats;
        let title;
        let description;

        switch (period) {
            case 'daily':
                stats = getDailyHabitStats(habits);
                title = 'Daily Progress';
                description = 'Your habit completion for today.';
                break;
            case 'weekly':
                stats = getWeeklyHabitStats(habits);
                title = 'Weekly Progress';
                description = 'Your habit completion for the last 7 days.';
                break;
            case 'monthly':
                stats = getMonthlyHabitStats(habits);
                title = 'Monthly Progress';
                description = 'Your habit completion for this month.';
                break;
        }

        const chartData = [
            { name: 'Completed', value: stats.completed },
            { name: 'Pending', value: stats.pending },
        ];

        return { data: chartData, title, description };
    }, [habits, isLoading, period]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2"/>
                    <Skeleton className="h-4 w-40"/>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-6">
                    <Skeleton className="h-48 w-48 rounded-full"/>
                </CardContent>
            </Card>
        );
    }
    
    const completedValue = data[0]?.value ?? 0;
    const totalValue = data.reduce((sum, entry) => sum + entry.value, 0);
    const isAllComplete = totalValue > 0 && completedValue === totalValue;

    if (habits.length === 0) return null;

    return (
        <Card className="shadow-sm transition-shadow hover:shadow-lg flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                {totalValue > 0 ? (
                    <div className="w-full h-[250px] filter drop-shadow-sm">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={completedValue > 0 && (totalValue - completedValue) > 0 ? renderCustomizedLabel : false}
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={3} />
                                    ))}
                                </Pie>
                                <Legend 
                                    iconType="circle"
                                    content={({ payload }) => (
                                        <ul className="flex justify-center gap-6 mt-4 text-sm">
                                            {payload?.map((entry, index) => {
                                                if(isAllComplete && entry.value === 'Pending') return null;

                                                return (
                                                    <li key={`item-${index}`} className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: entry.color}} />
                                                        <span className="text-muted-foreground">{entry.value}:</span>
                                                        <span className="font-semibold text-foreground">{Number(entry.payload?.value).toFixed(1)}</span>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[250px] text-center">
                         <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-5xl">📊</span>
                        </div>
                        <p className="text-muted-foreground font-medium mt-4">Not enough data yet</p>
                        <p className="text-sm text-muted-foreground">Track some habits to see your progress.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
