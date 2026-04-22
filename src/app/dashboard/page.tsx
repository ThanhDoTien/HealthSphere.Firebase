'use client';

import { useMemo, useState, useEffect } from 'react';
import { Utensils, Dumbbell, Bed, Scale, TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, Lightbulb } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { useTranslation } from '@/context/LanguageContext';
import BmiMeter from '@/components/dashboard/BmiMeter';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { cn } from '@/lib/utils';

type WeightLog = {
  weight: number;
  date: string;
};

export default function DashboardPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [today, setToday] = useState('');
  const [yesterday, setYesterday] = useState('');
  const { t } = useTranslation();
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
    return query(collection(firestore, 'users', user.uid, 'weights'), orderBy('date', 'desc'), limit(2));
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
  const { data: mealData } = useCollection(mealsQuery);
  const { data: activityData } = useCollection(activitiesQuery);
  const { data: sleepData } = useCollection(sleepQuery);

  const { data: yesterdayMealData } = useCollection(yesterdayMealsQuery);
  const { data: yesterdayActivityData } = useCollection(yesterdayActivitiesQuery);
  const { data: yesterdaySleepData } = useCollection(yesterdaySleepQuery);

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  const { data: suggestionData } = useDoc<any>(suggestionDocRef);

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

  const currentWeight = latestWeightData?.[0]?.weight || userProfile?.weight;

  const renderDiff = (current: number, yesterdayVal: number, unit: string, invertLogic: boolean = false) => {
    const diff = current - yesterdayVal;
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

      <main className="p-2 w-full">
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
                    {latestWeightData && latestWeightData.length >= 2 && (
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold mt-1.5",
                        latestWeightData[0].weight > latestWeightData[1].weight ? "text-orange-500" : "text-green-500"
                      )}>
                        {latestWeightData[0].weight > latestWeightData[1].weight ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(latestWeightData[0].weight - latestWeightData[1].weight).toFixed(1)} kg {t('dashboard.weightComparison')}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">Bấm để quản lý cân nặng →</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {suggestionData && suggestionData.generalTip && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x border-primary/10">
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary/80">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      {t('ai.tipTitle')}
                    </h4>
                    <p className="text-base font-medium leading-relaxed italic text-foreground/90">
                      &quot;{suggestionData.generalTip.replaceAll('\\n', '\n')}&quot;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
