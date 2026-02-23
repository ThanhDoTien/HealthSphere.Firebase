'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { LineChart as LineChartComponent } from '@/components/ui/line-chart';
import { type ChartConfig } from '@/components/ui/chart';
import AddMealForm from '@/components/dashboard/AddMealForm';
import { Loader2 } from 'lucide-react';

const calorieChartConfig = {
  calories: {
    label: 'Calories',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function CaloriesPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  // Fetch last 30 days of meal data
  const mealQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'meals'),
      orderBy('date', 'desc'),
      limit(200) // limit to recent meals to avoid pulling too much data
    );
  }, [firestore, user]);

  const { data: mealData, isLoading: mealLoading } = useCollection(mealQuery);

  const chartData = useMemo(() => {
    if (!mealData) return [];

    const dailyCalories: { [date: string]: number } = {};

    mealData.forEach((meal) => {
      const date = meal.date;
      if (dailyCalories[date]) {
        dailyCalories[date] += meal.calories;
      } else {
        dailyCalories[date] = meal.calories;
      }
    });

    return Object.keys(dailyCalories)
      .map((date) => ({
        date: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        calories: dailyCalories[date],
        fullDate: date, // for sorting
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(-30); // show last 30 days
  }, [mealData]);

  const isLoading = userLoading || mealLoading;

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Calorie Intake</CardTitle>
          <CardDescription>Log your meals and track your daily calorie consumption.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LineChartComponent
              data={chartData}
              config={calorieChartConfig}
              yAxisWidth={40}
              className="h-64"
              showLegend={false}
            />
          )}
          <div>
            <h3 className="text-lg font-medium mb-4">Log a Meal</h3>
            {user && <AddMealForm userId={user.uid} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
