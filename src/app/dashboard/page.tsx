'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Utensils, Dumbbell, Loader2, Bed, Scale, Lightbulb, RefreshCw, Sparkles, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
import { collection, query, orderBy, limit, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from '@/context/LanguageContext';
import BmiMeter from '@/components/dashboard/BmiMeter';
import SuggestImage from '@/components/dashboard/SuggestImage';
import { getHealthSuggestions, type HealthSuggestionResponse } from '@/ai/flows/suggestion-flow';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type WeightLog = {
  weight: number;
  date: string;
};

interface SuggestionWithMetadata extends HealthSuggestionResponse {
  updatedAt?: any;
  snapshotSummary?: {
    caloriesConsumed: number;
    caloriesBurned: number;
  };
}

export default function DashboardPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [today, setToday] = useState('');
  const [yesterday, setYesterday] = useState('');
  const { t, locale } = useTranslation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dailyTipKey, setDailyTipKey] = useState('');

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setToday(`${year}-${month}-${day}`);

    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    setYesterday(`${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`);

    const tips = ['waterReminder', 'activityReminder', 'genericTip'];
    setDailyTipKey(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

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

  const yesterdayMealsQuery = useMemoFirebase(() => {
    if (!user || !yesterday) return null;
    return query(collection(firestore, 'users', user.uid, 'meals'), where('date', '==', yesterday));
  }, [firestore, user, yesterday]);

  const yesterdayActivitiesQuery = useMemoFirebase(() => {
    if (!user || !yesterday) return null;
    return query(collection(firestore, 'users', user.uid, 'activities'), where('date', '==', yesterday));
  }, [firestore, user, yesterday]);

  const yesterdaySleepQuery = useMemoFirebase(() => {
    if (!user || !yesterday) return null;
    return query(collection(firestore, 'users', user.uid, 'sleep'), where('date', '==', yesterday));
  }, [firestore, user, yesterday]);

  const { data: latestWeightData } = useCollection<WeightLog>(latestWeightQuery);
  const { data: mealData, isLoading: mealLoading } = useCollection(mealsQuery);
  const { data: activityData, isLoading: activityLoading } = useCollection(activitiesQuery);
  const { data: sleepData, isLoading: sleepLoading } = useCollection(sleepQuery);
  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<SuggestionWithMetadata>(suggestionDocRef);

  const { data: yesterdayMealData } = useCollection(yesterdayMealsQuery);
  const { data: yesterdayActivityData } = useCollection(yesterdayActivitiesQuery);
  const { data: yesterdaySleepData } = useCollection(yesterdaySleepQuery);

  const dailySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, baseBurned: 0, exerciseBurned: 0, sleepHours: 0 };
    if (mealData) summary.caloriesConsumed = mealData.reduce((sum, meal: any) => sum + meal.calories, 0);

    if (userProfile) {
      const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
      const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = activityData ? activityData.reduce((sum, activity: any) => sum + activity.caloriesBurned, 0) : 0;
      
      summary.baseBurned = Math.round(tdee);
      summary.exerciseBurned = Math.round(activityBurn);
      summary.caloriesBurned = summary.baseBurned + summary.exerciseBurned;
    }

    if (sleepData) summary.sleepHours = sleepData.reduce((sum, sleep: any) => sum + sleep.duration, 0);
    return summary;
  }, [mealData, activityData, sleepData, userProfile, latestWeightData]);

  const yesterdaySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, baseBurned: 0, exerciseBurned: 0, sleepHours: 0 };
    if (yesterdayMealData) summary.caloriesConsumed = yesterdayMealData.reduce((sum, meal: any) => sum + meal.calories, 0);

    if (userProfile) {
      const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
      const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = yesterdayActivityData ? yesterdayActivityData.reduce((sum, activity: any) => sum + activity.caloriesBurned, 0) : 0;
      
      summary.baseBurned = Math.round(tdee);
      summary.exerciseBurned = Math.round(activityBurn);
      summary.caloriesBurned = summary.baseBurned + summary.exerciseBurned;
    }

    if (yesterdaySleepData) summary.sleepHours = yesterdaySleepData.reduce((sum, sleep: any) => sum + sleep.duration, 0);
    return summary;
  }, [yesterdayMealData, yesterdayActivityData, yesterdaySleepData, userProfile, latestWeightData]);

  const isStale = useMemo(() => {
    if (!suggestionData || !suggestionData.snapshotSummary || isGenerating) return false;
    const diffConsumed = Math.abs(dailySummary.caloriesConsumed - (suggestionData.snapshotSummary.caloriesConsumed || 0));
    const diffBurned = Math.abs(dailySummary.caloriesBurned - (suggestionData.snapshotSummary.caloriesBurned || 0));
    return diffConsumed > 50 || diffBurned > 50;
  }, [dailySummary, suggestionData, isGenerating]);

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

      await setDoc(suggestionDocRef, {
        ...suggestions,
        updatedAt: serverTimestamp(),
        snapshotSummary: {
          caloriesConsumed: dailySummary.caloriesConsumed,
          caloriesBurned: dailySummary.caloriesBurned,
        }
      });
    } catch (err: any) {
      console.error("AI Error:", err);
      setAiError(err.message || t('ai.errorMessage'));
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, user, today, suggestionDocRef, dailySummary, locale, t, latestWeightData]);

  useEffect(() => {
    if (!suggestionLoading && !isGenerating && today && userProfile && !aiError) {
      if (!suggestionData || isStale) {
        handleGenerateSuggestions();
      }
    }
  }, [suggestionLoading, suggestionData, isGenerating, today, userProfile, isStale, aiError, handleGenerateSuggestions]);

  const currentWeight = latestWeightData?.[0]?.weight || userProfile?.weight;
  const isAllLoading = userLoading || mealLoading || activityLoading || sleepLoading || (suggestionLoading && !suggestionData);

  const renderDiff = (current: number, yesterday: number, unit: string, invertLogic: boolean = false) => {
    const diff = current - yesterday;
    if (diff === 0) return <span className="text-muted-foreground flex items-center gap-1.5 text-xs mt-2 font-medium"><Minus className="h-3.5 w-3.5" /> Bằng hôm qua</span>;

    const isIncrease = diff > 0;
    const isGood = invertLogic ? !isIncrease : isIncrease;
    const colorClass = isGood ? "text-green-500" : "text-destructive";
    const Icon = isIncrease ? TrendingUp : TrendingDown;

    return (
      <span className={cn("flex items-center gap-1.5 text-xs mt-2 font-medium", colorClass)}>
        <Icon className="h-3.5 w-3.5" />
        {Math.abs(diff).toFixed(unit === 'h' ? 1 : 0)} {unit} so với hôm qua
      </span>
    );
  };

  return (
    <div className="flex flex-col space-y-6 pb-10 w-full">
      <header className="px-4 py-6 text-left border-b bg-background/50">
        <h1 className="text-3xl font-bold tracking-tight px-4">
          {userProfile?.name ? t('dashboard.welcome', { name: userProfile.name }) : t('dashboard.welcomeUser')}
        </h1>
        
        <div className="mt-2 mb-3">
          {userProfile && (!userProfile.height || !userProfile.weight) ? (
            <Link href="/dashboard/profile" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-bold border border-orange-200 hover:bg-orange-200 transition-colors">
              <AlertCircle className="h-4 w-4" />
              {t('dashboard.notification.incompleteProfile')}
            </Link>
          ) : dailyTipKey ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100 italic">
              <Sparkles className="h-4 w-4 text-primary" />
              {t(`dashboard.notification.${dailyTipKey}`)}
            </div>
          ) : null}
        </div>

        <p className="text-muted-foreground text-lg">{t('dashboard.summary')}</p>
      </header>

      <main className="p-2 space-y-8 w-full">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <div className="col-span-1">
            {userProfile && <BmiMeter height={userProfile.height} weight={currentWeight || userProfile.weight} />}
          </div>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 col-span-1">
            <Link href="/dashboard/calories">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-primary/20 shadow-sm h-full flex flex-col">
                <CardHeader className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <CardDescription className="text-xs font-medium">{t('dashboard.caloriesConsumed')}</CardDescription>
                    <Utensils className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-auto">
                    <CardTitle className="text-2xl font-black">{dailySummary.caloriesConsumed} <span className="text-sm font-medium text-muted-foreground">kcal</span></CardTitle>
                    {yesterdayMealData && renderDiff(dailySummary.caloriesConsumed, yesterdaySummary.caloriesConsumed, 'kcal', true)}
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/activity">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-accent/20 shadow-sm h-full flex flex-col">
                <CardHeader className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <CardDescription className="text-xs font-medium">{t('dashboard.caloriesBurned')}</CardDescription>
                    <Dumbbell className="h-4 w-4 text-accent" />
                  </div>
                  <div className="mt-auto">
                    <CardTitle className="text-2xl font-black">{dailySummary.caloriesBurned} <span className="text-sm font-medium text-muted-foreground">kcal</span></CardTitle>
                    <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent font-bold rounded-md border border-accent/20">
                        {t('dashboard.baseBurn')}: {dailySummary.baseBurned}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded-md border border-primary/20">
                        {t('dashboard.exerciseBurn')}: {dailySummary.exerciseBurned}
                      </span>
                    </div>
                    {yesterdayActivityData && renderDiff(dailySummary.caloriesBurned, yesterdaySummary.caloriesBurned, 'kcal')}
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/sleep">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-blue-500/20 shadow-sm h-full flex flex-col">
                <CardHeader className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <CardDescription className="text-xs font-medium">{t('dashboard.sleepHour')}</CardDescription>
                    <Bed className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="mt-auto">
                    <CardTitle className="text-2xl font-black">{dailySummary.sleepHours.toFixed(1)} <span className="text-sm font-medium text-muted-foreground">h</span></CardTitle>
                    {yesterdaySleepData && renderDiff(dailySummary.sleepHours, yesterdaySummary.sleepHours, 'h')}
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/dashboard/weight">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-gray-500/20 shadow-sm h-full flex flex-col">
                <CardHeader className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <CardDescription className="text-xs font-medium">{t('dashboard.currentWeight')}</CardDescription>
                    <Scale className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="mt-auto">
                    <CardTitle className="text-2xl font-black">{currentWeight ? `${currentWeight} kg` : 'N/A'}</CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">Bấm để quản lý cân nặng →</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {isGenerating && (
            <Card className="border-primary/20 bg-primary/5 shadow-sm animate-pulse">
              <div className="p-4 flex items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-base font-medium text-primary">
                  {t('ai.loadingButton') || 'HealthSphere AI đang chuẩn bị lời khuyên...'}
                </p>
              </div>
            </Card>
          )}

          {!isGenerating && suggestionData && (
            <div className="space-y-3">
              <Card className={cn(
                "border-primary/20 bg-primary/5 shadow-sm transition-all duration-300",
                isStale && "ring-2 ring-primary/40 ring-offset-2"
              )}>
                <div className="p-4 flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-primary">{t('ai.tipTitle')}</h4>
                        {suggestionData.updatedAt && (
                          <span className="text-[10px] text-muted-foreground italic">
                            • {t('ai.lastUpdated', { time: new Date(suggestionData.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateSuggestions}
                        disabled={isGenerating}
                        className={cn("h-8 w-8 p-0", isStale && "text-primary animate-bounce")}
                        title={t('ai.refreshNow')}
                      >
                        <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                      </Button>
                    </div>
                    <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line font-medium">
                      {suggestionData.generalTip.replaceAll('\\n', '\n')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {isAllLoading && !suggestionData && !isGenerating && (
            <Card className="border-primary/20 bg-primary/5 shadow-sm animate-pulse">
              <div className="p-4 flex items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-base font-medium text-primary">{t('ai.loadingData')}</p>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary">{t('ai.title')}</h2>
          </div>

          {!isGenerating && suggestionData ? (
            <div className="space-y-12">
              <div className="space-y-6">
                <h4 className="flex items-center gap-2 text-lg font-bold text-muted-foreground border-b pb-2">
                  <Utensils className="h-5 w-5" />
                  {t('ai.mealsTitle')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {suggestionData.mealSuggestions?.map((meal, idx) => (
                    <Card key={idx} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                      <SuggestImage
                        name={meal.name}
                        prompt={meal.name + ', simple appetizing photo'}
                        className="h-64 w-full"
                      />
                      <div className="p-5 flex-1 flex flex-col space-y-3">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-xl leading-tight">{meal.name}</h5>
                          <span className="text-base font-bold text-primary shrink-0 ml-2">~{meal.calories} kcal</span>
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                          {meal.recipe.replaceAll('\\n', '\n')}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="flex items-center gap-2 text-lg font-bold text-muted-foreground border-b pb-2">
                  <Dumbbell className="h-5 w-5" />
                  {t('ai.workoutTitle')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {suggestionData.workoutSuggestion?.map((exercise, idx) => (
                    <Card key={idx} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                      <SuggestImage
                        name={exercise.name}
                        prompt={exercise.name + ', simple fitness photo, gym context'}
                        className="h-64 w-full"
                      />
                      <div className="p-5 flex-1 flex flex-col space-y-3">
                        <h5 className="font-bold text-xl leading-tight">{exercise.name}</h5>
                        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                          {exercise.description.replaceAll('\\n', '\n')}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (isGenerating || (suggestionLoading && !suggestionData)) ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 border rounded-xl bg-muted/10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-base font-medium animate-pulse text-muted-foreground">
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
      </main>
    </div>
  );
}
