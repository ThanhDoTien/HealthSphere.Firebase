'use client';

import { useMemo, useState, useEffect } from 'react';
import { Utensils, Dumbbell, Loader2, ChevronsRight, Sparkles, Bed, Scale } from 'lucide-react';
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
    label: 'Cân nặng (kg)',
    color: '#F2994A',
  },
} satisfies ChartConfig;

type WeightLog = {
  weight: number;
  date: string;
};

const DASHBOARD_MEAL_PLACEHOLDERS = [
  "https://firebasestorage.googleapis.com/v0/b/studio-8164753205-5553c.firebasestorage.app/o/ImagePlacehoder%2Fmeals%2Fdefault-meal-2.png?alt=media&token=a6b306ef-5ee5-4c0e-83f0-47cc0e2035b5",
  "https://firebasestorage.googleapis.com/v0/b/studio-8164753205-5553c.firebasestorage.app/o/ImagePlacehoder%2Fmeals%2Fdefault-meal-1.png?alt=media&token=24c5abe9-feac-4951-aa76-def57063735a",
  "https://picsum.photos/seed/meal/800/600"
];

const DASHBOARD_WORKOUT_PLACEHOLDERS = [
  "https://firebasestorage.googleapis.com/v0/b/studio-8164753205-5553c.firebasestorage.app/o/ImagePlacehoder%2Fworkouts%2Fdefault-workout-1.png?alt=media&token=bddae351-3649-4372-89a3-0691bee5ee8b",
  "https://picsum.photos/seed/workout/800/600"
];

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
    return mealData.reduce((sum, meal: any) => sum + meal.calories, 0);
  }, [mealData]);

  const baseTDEE = useMemo(() => {
    if (!userProfile) return 0;
    const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
    const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
    return calculateTDEE(bmr, userProfile.activityLevel);
  }, [userProfile, latestWeightData]);

  const caloriesBurned = useMemo(() => {
    const activityBurn = activityData ? activityData.reduce((sum, activity: any) => sum + activity.caloriesBurned, 0) : 0;
    return baseTDEE + activityBurn;
  }, [baseTDEE, activityData]);

  const sleepHours = useMemo(() => {
    if (!sleepData || sleepData.length === 0) return 0;
    return sleepData.reduce((sum, sleep: any) => sum + sleep.duration, 0);
  }, [sleepData]);

  const currentWeight = latestWeightData?.[0]?.weight || weightData?.[0]?.weight;

  const firstMeal = suggestionData?.mealSuggestions?.[0];
  const firstWorkout = suggestionData?.workoutSuggestion?.[0];

  return (
    <div className="flex flex-col space-y-6 pb-10">
      <header className="p-4 sm:p-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {userProfile?.name ? t('dashboard.welcome', { name: userProfile.name }) : t('dashboard.welcomeUser')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('dashboard.summary')}
        </p>
      </header>

      <main className="px-4 sm:px-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-2">
            {userProfile && <BmiMeter height={userProfile.height} weight={currentWeight || userProfile.weight} />}
          </div>
          <div className="grid gap-4 md:col-span-2 lg:col-span-2 grid-cols-2">
            <Link href="/dashboard/calories">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full border-orange-500/20 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">{t('dashboard.caloriesConsumed')}</CardDescription>
                    <Utensils className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{caloriesConsumed.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal</span></CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/activity">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full border-green-500/20 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">{t('dashboard.caloriesBurned')}</CardDescription>
                    <Dumbbell className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{Math.round(caloriesBurned).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal</span></CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/sleep">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full border-blue-500/20 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">{t('dashboard.sleepHour')}</CardDescription>
                    <Bed className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{sleepHours.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">h</span></CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/profile">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full border-accent/20 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">{t('dashboard.currentWeight')}</CardDescription>
                    <Scale className="h-4 w-4 text-accent" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {currentWeight ? `${currentWeight} kg` : 'N/A'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">{t('dashboard.weightTrackingTitle')}</CardTitle>
              <CardDescription>{t('dashboard.weightTrackingDescription')}</CardDescription>
            </div>
            <Select value={weightFilter} onValueChange={setWeightFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Chọn phạm vi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('dashboard.weightFilter.last7')}</SelectItem>
                <SelectItem value="30">{t('dashboard.weightFilter.last30')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-6">
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('dashboard.todaysActivitiesTitle')}</CardTitle>
              <CardDescription>
                {t('dashboard.todaysActivitiesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
               {activityData && activityData.length > 0 ? (
                activityData.map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                        <span className="font-medium text-sm">{activity.name}</span>
                        <span className="font-bold text-sm">{activity.caloriesBurned} kcal</span>
                    </div>
                ))
            ) : (
                <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                  {t('dashboard.noActivities')}
                </div>
            )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                <Sparkles className="h-5 w-5" />
                {t('dashboard.aiSuggestionsTitle')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.aiSuggestionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {suggestionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : suggestionData ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="relative aspect-square w-20 overflow-hidden rounded-lg border bg-muted shadow-sm shrink-0">
                      <Image
                        src={firstMeal?.imageUrl || DASHBOARD_MEAL_PLACEHOLDERS[0]}
                        alt={firstMeal?.name || 'Meal'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[10px] text-primary uppercase tracking-wider">{t('dashboard.recipeSuggestion')}</p>
                      <p className="font-semibold text-sm line-clamp-1">{firstMeal?.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {firstMeal?.recipe?.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="relative aspect-square w-20 overflow-hidden rounded-lg border bg-muted shadow-sm shrink-0">
                      <Image
                        src={firstWorkout?.imageUrl || DASHBOARD_WORKOUT_PLACEHOLDERS[0]}
                        alt={firstWorkout?.name || 'Workout'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[10px] text-accent uppercase tracking-wider">{t('dashboard.exerciseSuggestion')}</p>
                      <p className="font-semibold text-sm line-clamp-1">{firstWorkout?.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {firstWorkout?.description?.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" asChild className="w-full h-9 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10">
                      <Link href="/dashboard/ai" className="flex items-center justify-center gap-2">
                        {t('bottomNav.ai')} <ChevronsRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('dashboard.aiSuggestionsDescription')}
                  </p>
                  <Button variant="default" size="sm" asChild className="px-8 shadow-sm">
                    <Link href="/dashboard/ai">{t('bottomNav.ai')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}