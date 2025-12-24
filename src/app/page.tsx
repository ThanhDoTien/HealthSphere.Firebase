import {
  Activity,
  Apple,
  Flame,
  GlassWater,
  Moon,
  Footprints,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getPersonalizedInsights } from "@/ai/flows/personalized-health-insights";
import { recipeRecommendationsBasedOnLoggedFoods } from "@/ai/flows/recipe-recommendations-based-on-logged-foods";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

const mockUserData = {
  calorieIntake: 1800,
  calorieGoal: 2500,
  waterIntake: 6,
  waterGoal: 8,
  sleep: 7.5,
  sleepGoal: 8,
  steps: 8500,
  stepsGoal: 10000,
  activityLevel: "moderate",
  dietaryPreferences: "Balanced diet",
  loggedFoods: "Chicken breast, broccoli, brown rice, apple, almonds",
};

export default async function Dashboard() {
  const apiKeySet = !!process.env.GEMINI_API_KEY;

  let insightsResult: { insights: string } | null = null;
  let recipesResult: { recipeRecommendations: string } | null = null;

  if (apiKeySet) {
    const insightsPromise = getPersonalizedInsights({
      calorieIntake: mockUserData.calorieIntake,
      activityLevel: mockUserData.activityLevel,
      dietaryPreferences: mockUserData.dietaryPreferences,
      loggedFoods: mockUserData.loggedFoods,
    });

    const recipesPromise = recipeRecommendationsBasedOnLoggedFoods({
      dietaryPreferences: mockUserData.dietaryPreferences,
      loggedFoods: mockUserData.loggedFoods,
    });

    [insightsResult, recipesResult] = await Promise.all([
      insightsPromise,
      recipesPromise,
    ]);
  }
  
  const recipeImage = PlaceHolderImages.find(p => p.id === 'recipe-1');

  const AiInfoCard = () => (
     <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>AI Features Disabled</AlertTitle>
        <AlertDescription>
          Please set your GEMINI_API_KEY in the .env file to enable personalized insights and recipe recommendations.
        </AlertDescription>
      </Alert>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Welcome Back!"
        description="Here's a snapshot of your health and wellness today."
      />
      <main className="grid gap-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Calories
              </CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.calorieIntake.toLocaleString()} / {mockUserData.calorieGoal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">kcal consumed</p>
            </CardContent>
            <CardFooter>
              <Progress value={(mockUserData.calorieIntake / mockUserData.calorieGoal) * 100} className="h-2" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Steps</CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.steps.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">out of {mockUserData.stepsGoal.toLocaleString()} goal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Water</CardTitle>
              <GlassWater className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.waterIntake} glasses</div>
              <p className="text-xs text-muted-foreground">{mockUserData.waterGoal - mockUserData.waterIntake} glasses to goal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.sleep} hours</div>
              <p className="text-xs text-muted-foreground">Last night</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personalized Health Insights</CardTitle>
              <CardDescription>
                AI-powered recommendations based on your recent activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeySet && insightsResult ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insightsResult.insights}
                </p>
              ) : (
                <AiInfoCard />
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/progress">View Full Report</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Recipe of the Day</CardTitle>
              <CardDescription>A healthy suggestion from our AI chef.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               {recipeImage && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={recipeImage.imageUrl}
                    alt={recipeImage.description}
                    width={600}
                    height={400}
                    data-ai-hint={recipeImage.imageHint}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {apiKeySet && recipesResult ? (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {recipesResult.recipeRecommendations}
                </p>
              ) : (
                 <AiInfoCard />
              )}
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/recipes">Discover More Recipes</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
