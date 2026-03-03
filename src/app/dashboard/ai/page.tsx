
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  collection,
  query,
  where,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
  getHealthSuggestions,
  type HealthSuggestionResponse,
} from '@/ai/flows/suggestion-flow';
import { uploadBase64ToStorage } from '@/firebase/storage/utils';
import {
  Loader2,
  Utensils,
  Dumbbell,
  Lightbulb,
  RefreshCcw,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export default function AiPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [today, setToday] = useState('');
  const { t, locale } = useTranslation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const todayDate = new Date();
    setToday(todayDate.toISOString().split('T')[0]);
  }, []);

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

  const { data: mealData, isLoading: mealLoading } = useCollection(mealsQuery);
  const { data: activityData, isLoading: activityLoading } = useCollection(activitiesQuery);
  const { data: sleepData, isLoading: sleepLoading } = useCollection(sleepQuery);
  
  const dailySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, sleepHours: 0 };
    if (mealData) summary.caloriesConsumed = mealData.reduce((sum, meal) => sum + meal.calories, 0);
    if (activityData) summary.caloriesBurned = activityData.reduce((sum, activity) => sum + activity.caloriesBurned, 0);
    if (sleepData) summary.sleepHours = sleepData.reduce((sum, sleep) => sum + sleep.duration, 0);
    return summary;
  }, [mealData, activityData, sleepData]);

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<HealthSuggestionResponse>(suggestionDocRef);

  const handleGenerateSuggestions = useCallback(async () => {
    if (!userProfile || !user || !today || !suggestionDocRef) return;
  
    setIsGenerating(true);
    setError(null);
  
    try {
      // 1. Gọi AI gen gợi ý và ảnh Base64
      const rawSuggestions = await getHealthSuggestions({
        userProfile: {
          goal: userProfile.goal,
          weight: userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
        },
        dailySummary,
        recentActivities: [],
        language: locale,
      });

      // 2. Upload từng ảnh Base64 lên Firebase Storage và lấy URL thật
      const uploadPromises = [
        ...rawSuggestions.mealSuggestions.map(async (meal, i) => {
          if (meal.imageUrl?.startsWith('data:')) {
            const url = await uploadBase64ToStorage(meal.imageUrl, `users/${user.uid}/ai/meals/${today}_${i}.png`);
            return { ...meal, imageUrl: url };
          }
          return meal;
        }),
        ...rawSuggestions.workoutSuggestion.map(async (workout, i) => {
          if (workout.imageUrl?.startsWith('data:')) {
            const url = await uploadBase64ToStorage(workout.imageUrl, `users/${user.uid}/ai/workouts/${today}_${i}.png`);
            return { ...workout, imageUrl: url };
          }
          return workout;
        })
      ];

      const results = await Promise.all(uploadPromises);
      
      const finalSuggestions: HealthSuggestionResponse = {
        generalTip: rawSuggestions.generalTip,
        mealSuggestions: results.filter(r => 'calories' in r) as any,
        workoutSuggestion: results.filter(r => !('calories' in r)) as any,
      };
  
      await setDoc(suggestionDocRef, finalSuggestions);
    } catch (err: any) {
      setError(err.message || t('ai.errorMessage'));
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, user, today, suggestionDocRef, dailySummary, locale, t]);

  const pageIsLoading = userLoading || mealLoading || activityLoading || sleepLoading || suggestionLoading;

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">{t('ai.title')}</CardTitle>
            <CardDescription>{t('ai.description')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerateSuggestions} disabled={isGenerating || pageIsLoading}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {t('ai.generateButton')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {(pageIsLoading || isGenerating) && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">
                {isGenerating ? "Imagen 4 đang vẽ ảnh chất lượng cao cho bạn (mất ~15 giây)..." : t('ai.loadingData')}
              </p>
            </div>
          )}

          {error && <Alert variant="destructive"><AlertTitle>{t('ai.errorTitle')}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

          {!isGenerating && !pageIsLoading && suggestionData && (
            <div className="space-y-8 pt-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div><CardTitle className="text-lg">{t('ai.tipTitle')}</CardTitle><div className="text-base leading-relaxed">{suggestionData.generalTip}</div></div>
                </CardHeader>
              </Card>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><Utensils className="h-6 w-6 text-accent" />{t('ai.mealsTitle')}</h3>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  {suggestionData.mealSuggestions.map((meal) => (
                    <Card key={meal.name} className="overflow-hidden flex flex-col h-full">
                      {meal.imageUrl && (
                        <div className="relative aspect-video w-full bg-muted">
                          <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <CardHeader><CardTitle className="text-lg">{meal.name}</CardTitle><CardDescription>~{meal.calories} kcal</CardDescription></CardHeader>
                      <CardContent className="flex-1 text-sm text-muted-foreground leading-relaxed">{meal.recipe}</CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><Dumbbell className="h-6 w-6 text-orange-500" />{t('ai.workoutTitle')}</h3>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  {suggestionData.workoutSuggestion.map((exercise) => (
                    <Card key={exercise.name} className="overflow-hidden flex flex-col h-full">
                      {exercise.imageUrl && (
                        <div className="relative aspect-video w-full bg-muted">
                          <Image src={exercise.imageUrl} alt={exercise.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <CardHeader><CardTitle className="text-lg">{exercise.name}</CardTitle></CardHeader>
                      <CardContent className="flex-1 text-sm text-muted-foreground leading-relaxed">{exercise.description}</CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
