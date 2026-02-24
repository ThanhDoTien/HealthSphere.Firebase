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
import { useTranslation } from '@/context/LanguageContext';

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
  const [yesterday, setYesterday] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    // This runs only on the client, after hydration, avoiding mismatch
    const todayDate = new Date();
    setToday(todayDate.toISOString().split('T')[0]);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    setYesterday(yesterdayDate.toISOString().split('T')[0]);
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

  // Queries for yesterday's data
  const yesterdayMealsQuery = useMemoFirebase(() => {
    if (!user || !yesterday) return null;
    return query(
      collection(firestore, 'users', user.uid, 'meals'),
      where('date', '==', yesterday)
    );
  }, [firestore, user, yesterday]);

  const yesterdayActivitiesQuery = useMemoFirebase(() => {
    if (!user || !yesterday) return null;
    return query(
      collection(firestore, 'users', user.uid, 'activities'),
      where('date', '==', yesterday)
    );
  }, [firestore, user, yesterday]);

  const yesterdaySleepQuery = useMemoFirebase(() => {
    if (!user || !yesterday) return null;
    return query(
      collection(firestore, 'users', user.uid, 'sleep'),
      where('date', '==', yesterday)
    );
  }, [firestore, user, yesterday]);


  const { data: weightData } = useCollection(weightQuery);
  const { data: mealData } = useCollection(mealsQuery);
  const { data: activityData } = useCollection(activitiesQuery);
  const { data: sleepData } = useCollection(sleepQuery);
  const { data: yesterdayMealData } = useCollection(yesterdayMealsQuery);
  const { data: yesterdayActivityData } = useCollection(yesterdayActivitiesQuery);
  const { data: yesterdaySleepData } = useCollection(yesterdaySleepQuery);

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

  // Today's totals
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

  // Yesterday's totals
  const yesterdayCaloriesConsumed = useMemo(() => {
    if (!yesterdayMealData) return 0;
    return yesterdayMealData.reduce((sum, meal) => sum + meal.calories, 0);
  }, [yesterdayMealData]);
  
  const yesterdayCaloriesBurned = useMemo(() => {
    if (!yesterdayActivityData) return 0;
    return yesterdayActivityData.reduce((sum, activity) => sum + activity.caloriesBurned, 0);
  }, [yesterdayActivityData]);

  const yesterdaySleepHours = useMemo(() => {
    if (!yesterdaySleepData || yesterdaySleepData.length === 0) return 0;
    return yesterdaySleepData.reduce((sum, sleep) => sum + sleep.duration, 0);
  }, [yesterdaySleepData]);
  
  const getComparisonText = (current: number, previous: number, unit: string) => {
    const diff = current - previous;
    if (diff === 0) return t('dashboard.comparison.same');
    const value = `${diff > 0 ? '+' : ''}${unit === 'hours' ? diff.toFixed(1) : diff.toLocaleString()}`;
    return t('dashboard.comparison.fromYesterday', { value, unit });
  };

  const currentWeight = weightData?.[0]?.weight;

  const weightChangeText = useMemo(() => {
    if (!weightData) return t('dashboard.weight.noTrend');

    const todayEntry = weightData.find(w => w.date === today);
    const yesterdayEntry = weightData.find(w => w.date === yesterday);

    if (todayEntry && yesterdayEntry) {
        const diff = todayEntry.weight - yesterdayEntry.weight;
        if (diff === 0) return t('dashboard.comparison.same');
        return t('dashboard.weight.fromYesterday', { value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` });
    }

    if (weightData.length > 1) {
        const latest = weightData[0];
        const previous = weightData[1];
        const diff = latest.weight - previous.weight;
        if (diff === 0) return t('dashboard.weight.noChange');
        return t('dashboard.weight.sinceLast', { value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` });
    }
    
    return t('dashboard.weight.noTrend');
  }, [weightData, today, yesterday, t]);

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {userProfile?.name ? t('dashboard.welcome', { name: userProfile.name }) : t('dashboard.welcomeUser')}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.summary')}
        </p>
      </header>

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.caloriesConsumed')}</CardDescription>
                <CardTitle className="text-4xl">{caloriesConsumed.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {yesterdayMealData && yesterdayMealData.length > 0 ? getComparisonText(caloriesConsumed, yesterdayCaloriesConsumed, 'kcal') : t('dashboard.comparison.today')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.caloriesBurned')}</CardDescription>
                <CardTitle className="text-4xl">{caloriesBurned.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {yesterdayActivityData && yesterdayActivityData.length > 0 ? getComparisonText(caloriesBurned, yesterdayCaloriesBurned, 'kcal') : t('dashboard.comparison.today')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.sleepHour')}</CardDescription>
                <CardTitle className="text-4xl">{sleepHours.toFixed(1)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {yesterdaySleepData && yesterdaySleepData.length > 0 ? getComparisonText(sleepHours, yesterdaySleepHours, 'hours') : t('dashboard.comparison.today')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.currentWeight')}</CardDescription>
                <CardTitle className="text-4xl">
                  {currentWeight ? `${currentWeight} kg` : 'N/A'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {weightChangeText}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.weightTrackingTitle')}</CardTitle>
              <CardDescription>{t('dashboard.weightTrackingDescription')}</CardDescription>
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
              <CardTitle>{t('dashboard.aiSuggestionsTitle')}</CardTitle>
              <CardDescription>
                {t('dashboard.aiSuggestionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t('dashboard.recipeSuggestion')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.recipeSuggestionText')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Flame className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t('dashboard.exerciseSuggestion')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.exerciseSuggestionText')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.todaysActivitiesTitle')}</CardTitle>
              <CardDescription>
                {t('dashboard.todaysActivitiesDescription')}
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
                <p className="text-sm text-muted-foreground">{t('dashboard.noActivities')}</p>
            )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
