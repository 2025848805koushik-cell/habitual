"use client"

import React from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useHabits } from "@/contexts/HabitsContext"
import { getMonthlyChartData } from "@/lib/habit-utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "./ui/skeleton"

export function ProgressCharts() {
  const { habits, isLoading } = useHabits()
  const [currentDate, setCurrentDate] = React.useState(new Date())

  const monthlyData = React.useMemo(() => getMonthlyChartData(habits, currentDate), [habits, currentDate])
  
  const chartConfig = {
    completions: {
      label: "Progress",
      color: "hsl(var(--primary))",
    },
  }

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
    )
  }

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle>Monthly Progress</CardTitle>
        <CardDescription>Total habit progress each day this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <LineChart
              data={monthlyData}
              margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                cursor={true}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="var(--color-completions)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "var(--color-completions)",
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                }}
                activeDot={{
                  r: 6,
                  fill: "var(--color-completions)",
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
