"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from '@/lib/types';

interface PlannerProgressChartProps {
  tasks: Task[];
  isLoading: boolean;
}

// Use green for completed tasks and red for pending tasks.
const COLORS = ['hsl(var(--chart-3))', 'hsl(var(--destructive))'];

// A custom label component to display percentages on the slices
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    // Don't render a label for a 0% slice
    if (percent === 0) return null;
    
    // Position the label inside the slice
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export function PlannerProgressChart({ tasks, isLoading }: PlannerProgressChartProps) {
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
    
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;

    const data = [
        { name: 'Completed', value: completed },
        { name: 'Pending', value: pending },
    ];
    
    const isAllComplete = tasks.length > 0 && pending === 0;

    const chartColors = isAllComplete
      ? ['hsl(var(--chart-3))', 'hsl(var(--muted))'] // If all complete, show a full green circle.
      : COLORS;

    return (
        <Card className="shadow-sm transition-shadow hover:shadow-lg flex flex-col">
            <CardHeader>
                <CardTitle>Daily Progress</CardTitle>
                <CardDescription>Your task completion for the selected day.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                {tasks.length > 0 ? (
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
                                    // Only show labels if there are both completed and pending tasks
                                    label={completed > 0 && pending > 0 ? renderCustomizedLabel : false}
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5} // This creates the spacing between slices
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} stroke="hsl(var(--card))" strokeWidth={3} />
                                    ))}
                                </Pie>
                                <Legend 
                                    iconType="circle"
                                    content={({ payload }) => (
                                        <ul className="flex justify-center gap-6 mt-4 text-sm">
                                            {payload?.map((entry, index) => {
                                                // Don't show "Pending" in the legend if all tasks are complete
                                                if(isAllComplete && entry.value === 'Pending') return null;

                                                return (
                                                    <li key={`item-${index}`} className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: entry.color}} />
                                                        <span className="text-muted-foreground">{entry.value}:</span>
                                                        <span className="font-semibold text-foreground">{entry.payload?.value}</span>
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
                            <span className="text-5xl">🎉</span>
                        </div>
                        <p className="text-muted-foreground font-medium mt-4">All clear!</p>
                        <p className="text-sm text-muted-foreground">No tasks planned for this day.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
