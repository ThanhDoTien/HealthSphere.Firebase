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
import {
  collection,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
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
  const [today, setToday] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSuggestions, setGeneratedSuggestions] = useState<HealthSuggestionResponse | null>(null);

  useEffect(() => {
    // This runs only on the client, after hydration, avoiding mismatch
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

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedSuggestions(null); // Clear previous suggestions

    const fakeSuggestions: HealthSuggestionResponse = {
        mealSuggestions: [
          {
            name: 'Breakfast: Oatmeal Delight',
            recipe: 'Cook 1/2 cup of rolled oats with 1 cup of almond milk. Top with fresh berries, a sprinkle of chia seeds, and a drizzle of honey.',
            calories: 350,
          },
          {
            name: 'Lunch: Power Chicken Salad',
            recipe: 'Toss mixed greens with 4oz of grilled chicken breast, cherry tomatoes, cucumbers, bell peppers, and a light lemon-tahini dressing.',
            calories: 450,
          },
          {
            name: 'Dinner: Zesty Baked Salmon',
            recipe: 'Bake a 4oz salmon fillet with lemon slices and dill. Serve with a side of steamed asparagus and a half cup of quinoa.',
            calories: 500,
          },
        ],
        workoutSuggestion: [
          {
            name: 'Morning Brisk Walk',
            description: 'Start your day with a 30-minute brisk walk outdoors. It is a great way to boost your metabolism and enjoy some fresh air.',
          },
          {
            name: 'Full Body Strength',
            description: 'Perform 3 sets of: 12 bodyweight squats, 10 push-ups (on knees if needed), and a 30-second plank. Rest 1 minute between sets.',
          },
        ],
        generalTip: 'Remember to drink at least 8 glasses of water today to stay hydrated and support your body\'s functions!',
    };

    // Simulate a delay for the "generation" process
    setTimeout(() => {
        setGeneratedSuggestions(fakeSuggestions);
        setIsLoading(false);
    }, 1500);
  };

  const dataIsLoading =
    userLoading ||
    mealLoading ||
    activityLoading ||
    sleepLoading;

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
                <CardTitle className="text-lg">Today&apos;s Snapshot</CardTitle>
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
                  <span className="text-muted-foreground">Calories In</span>
                  <span className="font-semibold">
                    {dailySummary.caloriesConsumed.toFixed(0)} kcal
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Calories Out</span>
                  <span className="font-semibold">
                    {dailySummary.caloriesBurned.toFixed(0)} kcal
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Sleep</span>
                  <span className="font-semibold">
                    {dailySummary.sleepHours.toFixed(1)} hours
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

          {generatedSuggestions && (
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
                      {generatedSuggestions.generalTip}
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
                  {generatedSuggestions.mealSuggestions.map((meal) => (
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
                  {generatedSuggestions.workoutSuggestion.map((exercise) => (
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
