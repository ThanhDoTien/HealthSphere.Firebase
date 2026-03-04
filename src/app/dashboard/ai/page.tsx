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
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { uploadBase64WithCache } from '@/firebase/storage/utils';

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

  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
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
  const { data: latestWeightData } = useCollection(weightQuery);
  
  const dailySummary = useMemo(() => {
    const summary = { caloriesConsumed: 0, caloriesBurned: 0, sleepHours: 0 };
    if (mealData) summary.caloriesConsumed = mealData.reduce((sum, meal) => sum + meal.calories, 0);
    
    if (userProfile) {
      const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
      const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
      const tdee = calculateTDEE(bmr, userProfile.activityLevel);
      const activityBurn = activityData ? activityData.reduce((sum, activity) => sum + activity.caloriesBurned, 0) : 0;
      summary.caloriesBurned = tdee + activityBurn;
    }

    if (sleepData) summary.sleepHours = sleepData.reduce((sum, sleep) => sum + sleep.duration, 0);
    return summary;
  }, [mealData, activityData, sleepData, userProfile, latestWeightData]);

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
      });

      // --- LOGIC XỬ LÝ ẢNH (BẠN CÓ THỂ TỰ CODE TẠI ĐÂY) ---
      const mealSuggestionsWithCache = await Promise.all(
        suggestions.mealSuggestions.map(async (meal) => {
          if (meal.imageUrl && meal.imageUrl.startsWith('data:')) {
            // Gọi hàm upload để lưu vào thư mục chung 'images/ai/meals/'
            const cachedUrl = await uploadBase64WithCache(meal.imageUrl, meal.imagePrompt, 'meals');
            return { ...meal, imageUrl: cachedUrl };
          }
          return meal;
        })
      );

      const workoutSuggestionsWithCache = await Promise.all(
        suggestions.workoutSuggestion.map(async (workout) => {
          if (workout.imageUrl && workout.imageUrl.startsWith('data:')) {
            // Lưu vào thư mục chung 'images/ai/exercises/'
            const cachedUrl = await uploadBase64WithCache(workout.imageUrl, workout.imagePrompt, 'exercises');
            return { ...workout, imageUrl: cachedUrl };
          }
          return workout;
        })
      );

      const finalSuggestions = {
        ...suggestions,
        mealSuggestions: mealSuggestionsWithCache,
        workoutSuggestion: workoutSuggestionsWithCache,
      };

      await setDoc(suggestionDocRef, finalSuggestions);
    } catch (err: any) {
      console.error("Lỗi trong quá trình tạo gợi ý:", err);
      setError(err.message || t('ai.errorMessage'));
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, user, today, suggestionDocRef, dailySummary, locale, t, latestWeightData]);

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
              <p className="text-muted-foreground animate-pulse text-center">
                {isGenerating ? t('ai.loadingButton') : t('ai.loadingData')}
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
                  <div>
                    <CardTitle className="text-lg">{t('ai.tipTitle')}</CardTitle>
                    <div className="text-base leading-relaxed whitespace-pre-line mt-2">
                      {suggestionData.generalTip}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><Utensils className="h-6 w-6 text-accent" />{t('ai.mealsTitle')}</h3>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  {suggestionData.mealSuggestions?.map((meal, idx) => (
                    <Card key={idx} className="overflow-hidden flex flex-col h-full shadow-sm">
                      {meal.imageUrl && (
                        <div className="relative aspect-video w-full bg-muted">
                          <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg">{meal.name}</CardTitle>
                        <CardDescription>~{meal.calories} kcal</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {meal.recipe}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><Dumbbell className="h-6 w-6 text-orange-500" />{t('ai.workoutTitle')}</h3>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  {suggestionData.workoutSuggestion?.map((exercise, idx) => (
                    <Card key={idx} className="overflow-hidden flex flex-col h-full shadow-sm">
                      {exercise.imageUrl && (
                        <div className="relative aspect-video w-full bg-muted">
                          <Image src={exercise.imageUrl} alt={exercise.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {exercise.description}
                      </CardContent>
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
