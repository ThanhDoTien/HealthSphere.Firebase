'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
  orderBy,
  limit,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
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

  const recentActivitiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'activities'),
      orderBy('date', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: mealData, isLoading: mealLoading } = useCollection(mealsQuery);
  const { data: activityData, isLoading: activityLoading } =
    useCollection(activitiesQuery);
  const { data: sleepData, isLoading: sleepLoading } =
    useCollection(sleepQuery);
  const { data: recentActivityData, isLoading: recentActivityLoading } = useCollection(recentActivitiesQuery);
  
  const dailySummary = useMemo(() => {
    const summary = {
      caloriesConsumed: 0,
      caloriesBurned: 0,
      sleepHours: 0,
    };

    if (mealData) {
      summary.caloriesConsumed = mealData.reduce(
        (sum, meal) => sum + meal.calories,
        0
      );
    }
    if (activityData) {
      summary.caloriesBurned = activityData.reduce(
        (sum, activity) => sum + activity.caloriesBurned,
        0
      );
    }
    if (sleepData) {
      summary.sleepHours = sleepData.reduce(
        (sum, sleep) => sum + sleep.duration,
        0
      );
    }
    return summary;
  }, [mealData, activityData, sleepData]);

  const dataIsLoading =
    userLoading ||
    mealLoading ||
    activityLoading ||
    sleepLoading ||
    recentActivityLoading;

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<HealthSuggestionResponse>(suggestionDocRef);

  const handleGenerateSuggestions = useCallback(async () => {
    if (!userProfile || !user || !today || !suggestionDocRef) return;
  
    setIsGenerating(true);
    setError(null);
  
    const prompt = `
    You are a health assistant AI. 
    User Profile: Goal: ${userProfile.goal}, Weight: ${userProfile.weight}, Height: ${userProfile.height}, Age: ${userProfile.age}, Gender: ${userProfile.gender}.
    Daily summary: Calories in: ${dailySummary.caloriesConsumed}, Calories out: ${dailySummary.caloriesBurned}, Sleep: ${dailySummary.sleepHours}.
    Recent activities: ${recentActivityData?.map(a => a.name).join(', ') || 'None'}.
    Language: ${locale}.

    Return ONLY valid JSON (no markdown).
    Schema: { "generalTip": string, "mealSuggestions": [{ "name": string, "calories": number, "recipe": string }], "workoutSuggestion": [{ "name": string, "description": string }] }
    `;
  
    try {
      const res = await fetch(
        "https://healthspherebackend--studio-8164753205-5553c.asia-southeast1.hosted.app/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: prompt,
          }),
        }
      );
  
      if (!res.ok) throw new Error("Failed to connect to backend server");

      const data = await res.json();
      
      // Handle different possible backend response formats
      let suggestions;
      if (typeof data === 'string') {
        suggestions = JSON.parse(data.replace(/```json|```/g, "").trim());
      } else if (data.message && typeof data.message === 'string') {
        suggestions = JSON.parse(data.message.replace(/```json|```/g, "").trim());
      } else {
        suggestions = data;
      }
  
      await setDoc(suggestionDocRef, suggestions);
    } catch (err: any) {
      console.error("AI ERROR:", err);
      setError(err.message || t('ai.errorMessage'));
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, user, today, suggestionDocRef, dailySummary, recentActivityData, locale, t]);

  useEffect(() => {
    // Tự động tạo nếu chưa có dữ liệu và không đang tải
    if (!dataIsLoading && userProfile && !suggestionData && !isGenerating && !error) {
      handleGenerateSuggestions();
    }
  }, [dataIsLoading, userProfile, suggestionData, handleGenerateSuggestions, isGenerating, error]);

  const pageIsLoading = dataIsLoading || suggestionLoading;

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('ai.title')}
            </CardTitle>
            <CardDescription>
              {t('ai.description')}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateSuggestions}
            disabled={isGenerating || dataIsLoading}
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {t('ai.generateButton')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {userProfile && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{t('ai.snapshotTitle')}</CardTitle>
                <CardDescription>
                  {t('ai.snapshotDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">{t('ai.height')}</span>
                  <span className="font-semibold">{userProfile.height} cm</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">{t('ai.weight')}</span>
                  <span className="font-semibold">{userProfile.weight} kg</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">{t('ai.goal')}</span>
                  <span className="font-semibold">{userProfile.goal}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">{t('ai.caloriesIn')}</span>
                  <span className="font-semibold">
                    {dailySummary.caloriesConsumed.toFixed(0)} kcal
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">{t('ai.caloriesOut')}</span>
                  <span className="font-semibold">
                    {dailySummary.caloriesBurned.toFixed(0)} kcal
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">{t('ai.sleep')}</span>
                  <span className="font-semibold">
                    {dailySummary.sleepHours.toFixed(1)} {t('sleep.unit.hours')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(pageIsLoading || isGenerating) && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{pageIsLoading && !isGenerating ? t('ai.loadingData') : t('ai.loadingButton')}</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t('ai.errorTitle')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isGenerating && !pageIsLoading && suggestionData && (
            <div className="space-y-8 pt-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('ai.tipTitle')}</CardTitle>
                    <CardDescription className="text-base">
                      {suggestionData.generalTip}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Utensils className="h-6 w-6 text-accent" />
                  {t('ai.mealsTitle')}
                </h3>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  {suggestionData.mealSuggestions.map((meal) => (
                    <Card key={meal.name}>
                      <CardHeader>
                        <CardTitle>{meal.name}</CardTitle>
                        <CardDescription>
                          ~{meal.calories} kcal
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="prose prose-sm text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: meal.recipe }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Dumbbell className="h-6 w-6 text-orange-500" />
                  {t('ai.workoutTitle')}
                </h3>

                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  {suggestionData.workoutSuggestion.map((exercise) => (
                    <Card key={exercise.name} className="h-full">
                      <CardHeader>
                        <CardTitle>{exercise.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="prose prose-sm text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: exercise.description,
                          }}
                        />
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
