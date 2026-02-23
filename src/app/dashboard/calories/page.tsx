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
import { collection, query, orderBy } from 'firebase/firestore';
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

  const mealQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'meals'),
      orderBy('date', 'desc')
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
        date: new Date(date + 'T00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        calories: dailyCalories[date],
        fullDate: date, // for sorting
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(-30); // show last 30 days
  }, [mealData]);

  const dailyMeals = useMemo(() => {
    if (!mealData) return {};
    const groupedMeals: { [date: string]: typeof mealData } = {};

    mealData.forEach((meal) => {
      const date = meal.date;
      if (groupedMeals[date]) {
        groupedMeals[date].push(meal);
      } else {
        groupedMeals[date] = [meal];
      }
    });
    return groupedMeals;
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

          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">Daily Meal Log</h3>
            {isLoading ? (
               <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
               </div>
            ) : Object.keys(dailyMeals).length > 0 ? (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {Object.entries(dailyMeals).map(([date, meals]) => (
                  <div key={date}>
                    <h4 className="font-semibold mb-2 text-md sticky top-0 bg-card py-2 border-b">
                      {new Date(date + 'T00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h4>
                    <ul className="space-y-2 pt-2">
                      {meals.map((meal) => (
                        <li key={meal.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{meal.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{meal.mealType}</p>
                          </div>
                          <p className="font-semibold">{meal.calories} kcal</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No meals logged yet. Add one above to get started!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
