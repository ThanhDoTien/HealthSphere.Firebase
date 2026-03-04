'use client';

import { useMemo, useState, useEffect } from 'react';
import { Utensils, Dumbbell, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import AddWeightForm from '@/components/dashboard/AddWeightForm';
import { useTranslation } from '@/context/LanguageContext';
import BmiMeter from '@/components/dashboard/BmiMeter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type HealthSuggestionResponse } from '@/ai/flows/suggestion-flow';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';

const weightChartConfig = {
  weight: {
    label: 'Weight (kg)',
    color: '#F2994A',
  },
} satisfies ChartConfig;

type WeightLog = {
  weight: number;
  date: string;
};

export default function DashboardPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [today, setToday] = useState('');
  const { t } = useTranslation();

  const [weightFilter, setWeightFilter] = useState('30');

  useEffect(() => {
    const todayDate = new Date();
    setToday(todayDate.toISOString().split('T')[0]);
  }, []);

  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
      orderBy('date', 'desc'),
      limit(30)
    );
  }, [firestore, user]);

  const latestWeightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
      orderBy('date', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

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

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  const { data: weightData } = useCollection<WeightLog>(weightQuery);
  const { data: latestWeightData } = useCollection<WeightLog>(latestWeightQuery);
  const { data: mealData } = useCollection(mealsQuery);
  const { data: activityData } = useCollection(activitiesQuery);
  const { data: sleepData } = useCollection(sleepQuery);
  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<HealthSuggestionResponse>(suggestionDocRef);

  const chartData = useMemo(() => {
    if (!weightData) return [];
    const limitCount = parseInt(weightFilter);
    return weightData
      .slice(0, limitCount)
      .map((d) => ({
        date: new Date(d.date + 'T00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: d.weight,
      }))
      .reverse();
  }, [weightData, weightFilter]);

  const caloriesConsumed = useMemo(() => {
    if (!mealData) return 0;
    return mealData.reduce((sum, meal) => sum + meal.calories, 0);
  }, [mealData]);

  const baseTDEE = useMemo(() => {
    if (!userProfile) return 0;
    const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
    const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
    return calculateTDEE(bmr, userProfile.activityLevel);
  }, [userProfile, latestWeightData]);

  const caloriesBurned = useMemo(() => {
    const activityBurn = activityData ? activityData.reduce((sum, activity) => sum + activity.caloriesBurned, 0) : 0;
    return baseTDEE + activityBurn;
  }, [baseTDEE, activityData]);

  const sleepHours = useMemo(() => {
    if (!sleepData || sleepData.length === 0) return 0;
    return sleepData.reduce((sum, sleep) => sum + sleep.duration, 0);
  }, [sleepData]);

  const currentWeight = latestWeightData?.[0]?.weight || weightData?.[0]?.weight;

  const firstMeal = suggestionData?.mealSuggestions?.[0];
  const firstWorkout = suggestionData?.workoutSuggestion?.[0];

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
            <div className="sm:col-span-2 md:col-span-4 lg:col-span-2 xl:col-span-2">
              {userProfile && <BmiMeter height={userProfile.height} weight={currentWeight || userProfile.weight} />}
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.caloriesConsumed')}</CardDescription>
                <CardTitle className="text-4xl">{caloriesConsumed.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">{t('dashboard.comparison.today')}</div>
              </CardContent>
            </Card>
            <Card className="border-accent/50 bg-accent/5">
              <CardHeader className="pb-2">
                <CardDescription className="text-accent-foreground/70">{t('dashboard.caloriesBurned')}</CardDescription>
                <CardTitle className="text-4xl text-accent">{Math.round(caloriesBurned).toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {Math.round(baseTDEE).toLocaleString()} (Base) + {activityData?.reduce((s, a) => s + a.caloriesBurned, 0) || 0} (Activity)
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.sleepHour')}</CardDescription>
                <CardTitle className="text-4xl">{sleepHours.toFixed(1)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">{t('dashboard.comparison.today')}</div>
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
                  {weightData && weightData.length > 0 ? t('dashboard.comparison.today') : t('dashboard.weight.noTrend')}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>{t('dashboard.weightTrackingTitle')}</CardTitle>
                <CardDescription>{t('dashboard.weightTrackingDescription')}</CardDescription>
              </div>
              <Select value={weightFilter} onValueChange={setWeightFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('dashboard.weightFilter.last7')}</SelectItem>
                  <SelectItem value="30">{t('dashboard.weightFilter.last30')}</SelectItem>
                </SelectContent>
              </Select>
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
            <CardContent className="grid gap-6">
              {suggestionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : suggestionData ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Utensils className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-primary">{t('dashboard.recipeSuggestion')}</p>
                        <p className="text-sm font-semibold mt-1">{firstMeal?.name}</p>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {firstMeal?.recipe?.replace(/<[^>]*>?/gm, '') || ''}
                        </div>
                      </div>
                    </div>
                    {(firstMeal?.imageUrl) && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-sm border bg-muted">
                        <Image 
                          src={firstMeal.imageUrl} 
                          alt={firstMeal.name || 'Meal suggestion'} 
                          fill 
                          className="object-cover" 
                          unoptimized
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-accent">{t('dashboard.exerciseSuggestion')}</p>
                        <p className="text-sm font-semibold mt-1">{firstWorkout?.name}</p>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {firstWorkout?.description?.replace(/<[^>]*>?/gm, '') || ''}
                        </div>
                      </div>
                    </div>
                    {(firstWorkout?.imageUrl) && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-sm border bg-muted">
                        <Image 
                          src={firstWorkout.imageUrl} 
                          alt={firstWorkout.name || 'Exercise suggestion'} 
                          fill 
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('dashboard.aiSuggestionsDescription')}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/ai">{t('bottomNav.ai')}</Link>
                  </Button>
                </div>
              )}
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
                    <div key={activity.id} className="flex items-center text-sm">
                        <div>{activity.name}</div>
                        <div className="ml-auto font-semibold">{activity.caloriesBurned} kcal</div>
                    </div>
                ))
            ) : (
                <p className="text-xs text-muted-foreground">{t('dashboard.noActivities')}</p>
            )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
