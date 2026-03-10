
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Utensils, Dumbbell, Loader2, Sparkles, Bed, Scale, Lightbulb, RefreshCcw } from 'lucide-react';
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
import { collection, query, orderBy, limit, where, doc, setDoc } from 'firebase/firestore';
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
import { getHealthSuggestions, type HealthSuggestionResponse } from '@/ai/flows/suggestion-flow';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { uploadBase64WithCache } from '@/firebase/storage/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const PLACEHOLDER_MEALS = [
  "https://firebasestorage.googleapis.com/v0/b/studio-8164753205-5553c.firebasestorage.app/o/ImagePlacehoder%2Fmeals%2Fdefault-meal-1.png?alt=media&token=24c5abe9-feac-4951-aa76-def57063735a",
  "https://firebasestorage.googleapis.com/v0/b/studio-8164753205-5553c.firebasestorage.app/o/ImagePlacehoder%2Fmeals%2Fdefault-meal-2.png?alt=media&token=a6b306ef-5ee5-4c0e-83f0-47cc0e2035b5",
  "https://picsum.photos/seed/meal/800/600"
];

const PLACEHOLDER_WORKOUTS = [
  "https://firebasestorage.googleapis.com/v0/b/studio-8164753205-5553c.firebasestorage.app/o/ImagePlacehoder%2Fworkouts%2Fdefault-workout-1.png?alt=media&token=bddae351-3649-4372-89a3-0691bee5ee8b",
  "https://picsum.photos/seed/workout/800/600"
];

export default function DashboardPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [today, setToday] = useState('');
  const { t, locale } = useTranslation();

  const [weightFilter, setWeightFilter] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const todayDate = new Date();
    setToday(todayDate.toISOString().split('T')[0]);
  }, []);

  // Firestore Queries
  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'weights'), orderBy('date', 'desc'), limit(30));
  }, [firestore, user]);

  const latestWeightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'weights'), orderBy('date', 'desc'), limit(1));
  }, [firestore, user]);

  const mealsQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(collection(firestore, 'users', user.uid, 'meals'), where('date', '==', today));
  }, [firestore, user, today]);

  const activitiesQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(collection(firestore, 'users', user.uid, 'activities'), where('date', '==', today));
  }, [firestore, user, today]);

  const sleepQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(collection(firestore, 'users', user.uid, 'sleep'), where('date', '==', today));
  }, [firestore, user, today]);

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  // Data fetching
  const { data: weightData } = useCollection<WeightLog>(weightQuery);
  const { data: latestWeightData } = useCollection<WeightLog>(latestWeightQuery);
  const { data: mealData, isLoading: mealLoading } = useCollection(mealsQuery);
  const { data: activityData, isLoading: activityLoading } = useCollection(activitiesQuery);
  const { data: sleepData, isLoading: sleepLoading } = useCollection(sleepQuery);
  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<HealthSuggestionResponse>(suggestionDocRef);

  // Summaries
  const dailySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, sleepHours: 0 };
    if (mealData) summary.caloriesConsumed = mealData.reduce((sum, meal: any) => sum + meal.calories, 0);

    if (userProfile) {
      const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
      const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = activityData ? activityData.reduce((sum, activity: any) => sum + activity.caloriesBurned, 0) : 0;
      summary.caloriesBurned = tdee + activityBurn;
    }

    if (sleepData) summary.sleepHours = sleepData.reduce((sum, sleep: any) => sum + sleep.duration, 0);
    return summary;
  }, [mealData, activityData, sleepData, userProfile, latestWeightData]);

  const chartData = useMemo(() => {
    if (!weightData) return [];
    const limitCount = parseInt(weightFilter);
    return weightData.slice(0, limitCount).map((d) => ({
      date: new Date(d.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: d.weight,
    })).reverse();
  }, [weightData, weightFilter]);

  // AI Suggestions Handler
  const handleGenerateSuggestions = useCallback(async () => {
    if (!userProfile || !user || !today || !suggestionDocRef) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      const token = await user.getIdToken();
      const suggestions = await getHealthSuggestions({
        userProfile: {
          goal: userProfile.goal,
          weight: latestWeightData?.[0]?.weight || userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
        },
        dailySummary,
        recentActivities: [],
        language: locale,
        token,
      });

      const mealSuggestionsWithCache = await Promise.all(
        suggestions.mealSuggestions.map(async (meal) => {
          if (meal.imageUrl?.startsWith('data:')) {
            const cachedUrl = await uploadBase64WithCache(meal.imageUrl, meal.imagePrompt, 'meals');
            return { ...meal, imageUrl: cachedUrl || meal.imageUrl };
          }
          return meal;
        })
      );

      const workoutSuggestionsWithCache = await Promise.all(
        suggestions.workoutSuggestion.map(async (workout) => {
          if (workout.imageUrl?.startsWith('data:')) {
            const cachedUrl = await uploadBase64WithCache(workout.imageUrl, workout.imagePrompt, 'exercises');
            return { ...workout, imageUrl: cachedUrl || workout.imageUrl };
          }
          return workout;
        })
      );

      await setDoc(suggestionDocRef, {
        ...suggestions,
        mealSuggestions: mealSuggestionsWithCache,
        workoutSuggestion: workoutSuggestionsWithCache,
      });
    } catch (err: any) {
      console.error("Lỗi tạo gợi ý:", err);
      setAiError(err.message || t('ai.errorMessage'));
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, user, today, suggestionDocRef, dailySummary, locale, t, latestWeightData]);

  // Auto-run AI on mount if missing
  useEffect(() => {
    if (!suggestionLoading && !suggestionData && !isGenerating && today && userProfile) {
      handleGenerateSuggestions();
    }
  }, [suggestionLoading, suggestionData, isGenerating, today, userProfile, handleGenerateSuggestions]);

  const currentWeight = latestWeightData?.[0]?.weight || weightData?.[0]?.weight;
  const isAllLoading = userLoading || mealLoading || activityLoading || sleepLoading || suggestionLoading;

  return (
    <div className="flex flex-col space-y-6 pb-10">
      <header className="p-4 sm:p-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {userProfile?.name ? t('dashboard.welcome', { name: userProfile.name }) : t('dashboard.welcomeUser')}
        </h1>
        <p className="text-muted-foreground text-lg">{t('dashboard.summary')}</p>
      </header>

      <main className="px-4 sm:px-6 space-y-6">
        {/* Row 1: BMI & Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2">
            {userProfile && <BmiMeter height={userProfile.height} weight={currentWeight || userProfile.weight} />}
          </div>
          <div className="grid gap-4 md:col-span-2 grid-cols-2">
            <Link href="/dashboard/calories">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-orange-500/20 shadow-sm h-full">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardDescription className="text-xs">{t('dashboard.caloriesConsumed')}</CardDescription>
                    <Utensils className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-xl font-bold">{dailySummary.caloriesConsumed.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal</span></CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/activity">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-green-500/20 shadow-sm h-full">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardDescription className="text-xs">{t('dashboard.caloriesBurned')}</CardDescription>
                    <Dumbbell className="h-4 w-4 text-green-500" />
                  </div>
                  <CardTitle className="text-xl font-bold">{Math.round(dailySummary.caloriesBurned).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal</span></CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/sleep">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-blue-500/20 shadow-sm h-full">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardDescription className="text-xs">{t('dashboard.sleepHour')}</CardDescription>
                    <Bed className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-xl font-bold">{dailySummary.sleepHours.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">h</span></CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/profile">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-accent/20 shadow-sm h-full">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardDescription className="text-xs">{t('dashboard.currentWeight')}</CardDescription>
                    <Scale className="h-4 w-4 text-accent" />
                  </div>
                  <CardTitle className="text-xl font-bold">{currentWeight ? `${currentWeight} kg` : 'N/A'}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* AI Comment CALLOUT */}
        {!isGenerating && !isAllLoading && suggestionData && (
          <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
            <div className="p-4 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-primary">{t('ai.tipTitle')}</h4>
                <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line prose-sm max-w-none">
                  {suggestionData.generalTip}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleGenerateSuggestions} disabled={isGenerating || isAllLoading} className="ml-auto shrink-0">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Row 2: Weight Chart */}
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
            <BarChart data={chartData} config={weightChartConfig} yAxisWidth={40} className="h-64" showLegend={false} />
            {user && <AddWeightForm userId={user.uid} />}
          </CardContent>
        </Card>

        {/* Row 3: Activity Log & Suggestions Stack */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT: Today's Activities */}
          <Card className="shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('dashboard.todaysActivitiesTitle')}</CardTitle>
              <CardDescription>{t('dashboard.todaysActivitiesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
               {activityData && activityData.length > 0 ? (
                activityData.map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                        <span className="font-medium text-sm">{activity.name}</span>
                        <span className="font-bold text-sm">{activity.caloriesBurned} kcal</span>
                    </div>
                ))
            ) : (
                <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20 text-sm">
                  {t('dashboard.noActivities')}
                </div>
            )}
            </CardContent>
          </Card>

          {/* RIGHT: AI Suggestions */}
          <div className="space-y-6">
            {!isGenerating && !isAllLoading && suggestionData ? (
              <>
                {/* MEALS LIST */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                    <Utensils className="h-5 w-5 text-accent" />
                    {t('ai.mealsTitle')}
                  </h3>
                  <div className="grid gap-4">
                    {suggestionData.mealSuggestions?.map((meal, idx) => (
                      <Card key={idx} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative aspect-video sm:w-32 shrink-0 bg-muted">
                            <Image src={meal.imageUrl || PLACEHOLDER_MEALS[idx % 3]} alt={meal.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="p-3 flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-sm">{meal.name}</h4>
                              <span className="text-xs font-semibold text-accent">~{meal.calories} kcal</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {meal.recipe}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* WORKOUTS LIST */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                    <Dumbbell className="h-5 w-5 text-orange-500" />
                    {t('ai.workoutTitle')}
                  </h3>
                  <div className="grid gap-4">
                    {suggestionData.workoutSuggestion?.map((exercise, idx) => (
                      <Card key={idx} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative aspect-video sm:w-32 shrink-0 bg-muted">
                            <Image src={exercise.imageUrl || PLACEHOLDER_WORKOUTS[idx % 2]} alt={exercise.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="p-3 flex-1">
                            <h4 className="font-bold text-sm mb-1">{exercise.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {exercise.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            ) : (isGenerating || isAllLoading) ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4 h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium animate-pulse text-muted-foreground">
                  {isGenerating ? t('ai.loadingButton') : t('ai.loadingData')}
                </p>
              </div>
            ) : null}

            {aiError && (
              <Alert variant="destructive">
                <AlertTitle>{t('ai.errorTitle')}</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
