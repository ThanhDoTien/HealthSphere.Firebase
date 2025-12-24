"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts";

const calorieData = [
  { date: "Mon", calories: 2100 },
  { date: "Tue", calories: 1950 },
  { date: "Wed", calories: 2250 },
  { date: "Thu", calories: 1800 },
  { date: "Fri", calories: 2400 },
  { date: "Sat", calories: 2600 },
  { date: "Sun", calories: 2300 },
];

const weightData = [
  { week: 1, weight: 70.5 },
  { week: 2, weight: 70.2 },
  { week: 3, weight: 70.1 },
  { week: 4, weight: 69.8 },
  { week: 5, weight: 69.5 },
  { week: 6, weight: 69.6 },
  { week: 7, weight: 69.2 },
  { week: 8, weight: 69.0 },
];

const calorieChartConfig = {
  calories: {
    label: "Calories",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const weightChartConfig = {
    weight: {
        label: "Weight (kg)",
        color: "hsl(var(--chart-2))",
    }
} satisfies ChartConfig;

export default function ProgressPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Your Progress"
        description="Visualize your journey with charts and graphs."
      />
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Calorie Intake - Last 7 Days</CardTitle>
            <CardDescription>
              This chart shows your daily calorie consumption.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={calorieChartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={calorieData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    label={{ value: "kcal", position: "insideTopLeft", dy: -10, fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="calories" fill="var(--color-calories)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weight Change - Last 8 Weeks</CardTitle>
            <CardDescription>
              Track your weight trend over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weightChartConfig} className="h-[300px] w-full">
              <LineChart accessibilityLayer data={weightData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `Week ${value}`}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    domain={['dataMin - 1', 'dataMax + 1']}
                    label={{ value: "kg", position: "insideTopLeft", dy: -10, fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Line
                  dataKey="weight"
                  type="monotone"
                  stroke="var(--color-weight)"
                  strokeWidth={2}
                  dot={{
                    fill: "var(--color-weight)",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
