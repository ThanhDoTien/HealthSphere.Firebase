'use client';

import { useMemo, useState, useEffect } from 'react';
import { Flame, Lightbulb } from 'lucide-react';

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
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import AddWeightForm from '@/components/dashboard/AddWeightForm';

const weightChartConfig = {
  weight: {
    label: 'Weight (kg)',
    color: '#F2994A',
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [today, setToday] = useState('');

  useEffect(() => {
    // This runs only on the client, after hydration, avoiding mismatch
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  // Weight query (last 30 entries)
  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
      orderBy('date', 'desc'),
      limit(30)
    );
  }, [firestore, user]);

  // Queries for today's data
  const mealsQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(
      collection(firestore, 'users', user.uid, 'meals'),
      where('date', '==', today)
    );
  }, [firestore, user, today]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(
      collection(firestore, 'users', user.uid, 'activities'),
      where('date', '==', today)
    );
  }, [firestore, user, today]);

  const sleepQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(
      collection(firestore, 'users', user.uid, 'sleep'),
      where('date', '==', today)
    );
  }, [firestore, user, today]);

  const { data: weightData } = useCollection(weightQuery);
  const { data: mealData } = useCollection(mealsQuery);
  const { data: activityData } = useCollection(activitiesQuery);
  const { data: sleepData } = useCollection(sleepQuery);

  const chartData = useMemo(() => {
    if (!weightData) return [];
    // The data is fetched in descending order, so we reverse it for the chart
    return weightData
      .map((d) => ({
        date: new Date(d.date + 'T00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: d.weight,
      }))
      .reverse();
  }, [weightData]);

  const caloriesConsumed = useMemo(() => {
    if (!mealData) return 0;
    return mealData.reduce((sum, meal) => sum + meal.calories, 0);
  }, [mealData]);

  const caloriesBurned = useMemo(() => {
    if (!activityData) return 0;
    return activityData.reduce((sum, activity) => sum + activity.caloriesBurned, 0);
  }, [activityData]);

  const sleepHours = useMemo(() => {
    if (!sleepData || sleepData.length === 0) return 0;
    return sleepData.reduce((sum, sleep) => sum + sleep.duration, 0);
  }, [sleepData]);

  const currentWeight = weightData?.[0]?.weight;

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {userProfile?.name || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Here is your health summary for today.
        </p>
      </header>

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Calories Consumed</CardDescription>
                <CardTitle className="text-4xl">{caloriesConsumed.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Today
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Calories Burned</CardDescription>
                <CardTitle className="text-4xl">{caloriesBurned.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Today
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sleep Hour</CardDescription>
                <CardTitle className="text-4xl">{sleepHours.toFixed(1)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Today
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current Weight</CardDescription>
                <CardTitle className="text-4xl">
                  {currentWeight ? `${currentWeight} kg` : 'N/A'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {weightData && weightData.length > 1
                    ? `${(
                        currentWeight - weightData[weightData.length - 1].weight
                      ).toFixed(1)}kg change`
                    : 'Log weight to see trend'}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Weight Tracking</CardTitle>
              <CardDescription>Last 30 entries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarChart
                data={chartData}
                config={weightChartConfig}
                yAxisWidth={40}
                className="h-64"
                showLegend={false}
              />
              {user && <AddWeightForm userId={user.uid} />}
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
              <CardDescription>
                Based on your goals and activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Recipe Suggestion</p>
                  <p className="text-sm text-muted-foreground">
                    Try a grilled chicken salad for a high-protein, low-calorie
                    lunch.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Flame className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Exercise Suggestion</p>
                  <p className="text-sm text-muted-foreground">
                    A 30-minute brisk walk can help you reach your daily calorie
                    burn goal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Activities</CardTitle>
              <CardDescription>
                Summary of your activities today.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
               {activityData && activityData.length > 0 ? (
                activityData.map((activity) => (
                    <div key={activity.id} className="flex items-center">
                        <div>{activity.name}</div>
                        <div className="ml-auto font-semibold">{activity.caloriesBurned} kcal</div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground">No activities logged today.</p>
            )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
