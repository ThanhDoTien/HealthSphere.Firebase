'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import {
  getHealthSuggestions,
  type HealthSuggestionRequest,
  type HealthSuggestionResponse,
} from '@/ai/flows/suggestion-flow';
import {
  Loader2,
  Wand2,
  Utensils,
  Dumbbell,
  Lightbulb,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AiPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [sevenDaysAgo, setSevenDaysAgo] = useState('');

  const [suggestions, setSuggestions] =
    useState<HealthSuggestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const todayDate = new Date();
    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(todayDate.getDate() - 6); // 7 days in total
    setSevenDaysAgo(sevenDaysAgoDate.toISOString().split('T')[0]);
  }, []);

  const last7DaysQuery = (collectionName: string) =>
    useMemoFirebase(() => {
      if (!user || !sevenDaysAgo) return null;
      return query(
        collection(firestore, 'users', user.uid, collectionName),
        where('date', '>=', sevenDaysAgo)
      );
    }, [firestore, user, sevenDaysAgo]);

  const mealsQuery = last7DaysQuery('meals');
  const activitiesQuery = last7DaysQuery('activities');
  const sleepQuery = last7DaysQuery('sleep');

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
  const { data: recentActivityData, isLoading: recentActivityLoading } =
    useCollection(recentActivitiesQuery);

  const weeklySummary = useMemo(() => {
    const summary = {
      avgCaloriesConsumed: 0,
      avgCaloriesBurned: 0,
      avgSleepHours: 0,
    };
    const NUM_DAYS = 7;

    if (mealData) {
      const totalCaloriesConsumed = mealData.reduce(
        (sum, meal) => sum + meal.calories,
        0
      );
      summary.avgCaloriesConsumed = totalCaloriesConsumed / NUM_DAYS;
    }
    if (activityData) {
      const totalCaloriesBurned = activityData.reduce(
        (sum, activity) => sum + activity.caloriesBurned,
        0
      );
      summary.avgCaloriesBurned = totalCaloriesBurned / NUM_DAYS;
    }
    if (sleepData) {
      const totalSleepHours = sleepData.reduce(
        (sum, sleep) => sum + sleep.duration,
        0
      );
      summary.avgSleepHours = totalSleepHours / NUM_DAYS;
    }

    return summary;
  }, [mealData, activityData, sleepData]);

  const recentActivities = useMemo(() => {
    if (!recentActivityData) return [];
    return recentActivityData.map((a) => a.name);
  }, [recentActivityData]);

  const handleGenerateSuggestions = async () => {
    if (!userProfile) {
      setError('User profile is not loaded.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const requestData: HealthSuggestionRequest = {
        userProfile: {
          goal: userProfile.goal,
          weight: userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          gender: userProfile.gender,
        },
        averageSummary: {
          caloriesConsumed: weeklySummary.avgCaloriesConsumed,
          caloriesBurned: weeklySummary.avgCaloriesBurned,
          sleepHours: weeklySummary.avgSleepHours,
        },
        recentActivities: recentActivities,
      };

      const result = await getHealthSuggestions(requestData);
      setSuggestions(result);
    } catch (e: any) {
      setError(e.message || 'An error occurred while generating suggestions.');
    } finally {
      setIsLoading(false);
    }
  };

  const dataIsLoading =
    userLoading ||
    mealLoading ||
    activityLoading ||
    sleepLoading ||
    recentActivityLoading;

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Health Assistant
          </CardTitle>
          <CardDescription>
            Get personalized meal and exercise suggestions based on your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {userProfile && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Your 7-Day Snapshot</CardTitle>
                <CardDescription>
                  This data will be used to generate your personalized plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-semibold">{userProfile.height} cm</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-semibold">{userProfile.weight} kg</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-semibold">{userProfile.goal}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    Avg. Calories In
                  </span>
                  <span className="font-semibold">
                    {weeklySummary.avgCaloriesConsumed.toFixed(0)} kcal/day
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    Avg. Calories Out
                  </span>
                  <span className="font-semibold">
                    {weeklySummary.avgCaloriesBurned.toFixed(0)} kcal/day
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Avg. Sleep</span>
                  <span className="font-semibold">
                    {weeklySummary.avgSleepHours.toFixed(1)} hours/night
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleGenerateSuggestions}
            disabled={isLoading || dataIsLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate My Plan for Today
              </>
            )}
          </Button>

          {dataIsLoading && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Loading your latest health data...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {suggestions && (
            <div className="space-y-8 pt-4">
              {/* General Tip */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Your Daily Tip</CardTitle>
                    <CardDescription className="text-base">
                      {suggestions.generalTip}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              {/* Meal Suggestions */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Utensils className="h-6 w-6 text-accent" />
                  Meal Suggestions
                </h3>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  {suggestions.mealSuggestions.map((meal) => (
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

              {/* Workout Suggestion */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Dumbbell className="h-6 w-6 text-orange-500" />
                  Workout Suggestion
                </h3>
                <div className="space-y-4">
                  {suggestions.workoutSuggestion.map((exercise) => (
                    <Card key={exercise.name}>
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
