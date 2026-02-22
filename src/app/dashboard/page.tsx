'use client';

import {
  Activity,
  Flame,
  Moon,
  Footprints,
  Scale,
  Sparkles,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
import { getPersonalizedInsights, PersonalizedInsightsOutput } from "@/ai/flows/personalized-health-insights";
import { recipeRecommendationsBasedOnLoggedFoods, RecipeRecommendationsBasedOnLoggedFoodsOutput } from "@/ai/flows/recipe-recommendations-based-on-logged-foods";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BmiChart } from "@/components/bmi-chart";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { useState, useEffect, useMemo } from "react";

// Firestore document types
type MealLog = { description: string; calorieCount: number; timestamp: Timestamp; };
type WorkoutLog = { name: string; caloriesBurned: number; timestamp: Timestamp; };
type SleepLog = { durationHours: number; timestamp: Timestamp; };
type WeightLog = { weightKg: number; timestamp: Timestamp; };
type UserProfile = {
  id: string;
  username: string;
  email: string;
  heightCm?: number;
  weightKg?: number;
  calorieGoal?: number;
  stepsGoal?: number;
  sleepGoal?: number;
  activityLevel?: string;
  dietaryPreferences?: string;
};


function calculateBmi(weight: number, height: number) {
    if (weight > 0 && height > 0) {
        const heightInMeters = height / 100;
        const bmiValue = weight / (heightInMeters * heightInMeters);
        return parseFloat(bmiValue.toFixed(1));
    }
    return 0;
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [insightsResult, setInsightsResult] = useState<PersonalizedInsightsOutput | null>(null);
  const [recipesResult, setRecipesResult] = useState<RecipeRecommendationsBasedOnLoggedFoodsOutput | null>(null);
  const [aiError, setAiError] = useState(false);

  // --- Data Fetching ---
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTimestamp = Timestamp.fromDate(todayStart);

  // User Profile
  const userProfileRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user]
  );
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  // Meal Logs for today
  const mealLogsQuery = useMemoFirebase(
    () => (db && user ? query(
      collection(db, "users", user.uid, "meal_logs"),
      where("timestamp", ">=", todayStartTimestamp)
    ) : null),
    [db, user]
  );
  const { data: mealLogs, isLoading: mealLogsLoading } = useCollection<MealLog>(mealLogsQuery);

  // Workout Logs for today
  const workoutLogsQuery = useMemoFirebase(
    () => (db && user ? query(
      collection(db, "users", user.uid, "workout_logs"),
      where("timestamp", ">=", todayStartTimestamp)
    ) : null),
    [db, user]
  );
  const { data: workoutLogs, isLoading: workoutLogsLoading } = useCollection<WorkoutLog>(workoutLogsQuery);

  // Latest Sleep Log
  const sleepLogQuery = useMemoFirebase(
    () => (db && user ? query(
      collection(db, "users", user.uid, "sleep_logs"),
      orderBy("timestamp", "desc"),
      limit(1)
    ) : null),
    [db, user]
  );
  const { data: sleepLogs, isLoading: sleepLogsLoading } = useCollection<SleepLog>(sleepLogQuery);

  // Latest Weight Log
  const weightLogQuery = useMemoFirebase(
    () => (db && user ? query(
      collection(db, "users", user.uid, "weight_logs"),
      orderBy("timestamp", "desc"),
      limit(1)
    ) : null),
    [db, user]
  );
  const { data: weightLogs, isLoading: weightLogsLoading } = useCollection<WeightLog>(weightLogQuery);
  
  // --- Auto-create User Profile ---
  useEffect(() => {
    if (db && user && !userProfile && !profileLoading) {
      const defaultProfile: UserProfile = {
        id: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'New User',
        email: user.email || "",
        heightCm: 170,
        weightKg: 70,
        calorieGoal: 2000,
        stepsGoal: 10000,
        sleepGoal: 8,
        activityLevel: 'sedentary',
        dietaryPreferences: 'None'
      };
      if (userProfileRef) {
        setDocumentNonBlocking(userProfileRef, defaultProfile, { merge: true });
      }
    }
  }, [db, user, userProfile, profileLoading, userProfileRef]);

  // --- AI Insights Generation ---
  useEffect(() => {
    if (userProfile && mealLogs) {
      setAiError(false);
      const loggedFoods = mealLogs.map(log => log.description).join(', ');

      const insightsPromise = getPersonalizedInsights({
        calorieIntake: mealLogs.reduce((sum, log) => sum + log.calorieCount, 0),
        activityLevel: userProfile.activityLevel || 'sedentary',
        dietaryPreferences: userProfile.dietaryPreferences || 'None',
        loggedFoods: loggedFoods,
      });

      const recipesPromise = recipeRecommendationsBasedOnLoggedFoods({
        dietaryPreferences: userProfile.dietaryPreferences || 'None',
        loggedFoods: loggedFoods,
      });

      Promise.all([insightsPromise, recipesPromise])
        .then(([insights, recipes]) => {
          setInsightsResult(insights);
          setRecipesResult(recipes);
        })
        .catch((error) => {
          console.error("Đã xảy ra lỗi khi tìm nạp dữ liệu AI:", error);
          setAiError(true);
        });
    }
  }, [userProfile, mealLogs]);


  // --- Data Processing & Display ---
  const isLoading = isUserLoading || profileLoading || mealLogsLoading || workoutLogsLoading || sleepLogsLoading || weightLogsLoading;

  const calorieIntake = useMemo(() => mealLogs?.reduce((sum, log) => sum + log.calorieCount, 0) || 0, [mealLogs]);
  const caloriesBurned = useMemo(() => workoutLogs?.reduce((sum, log) => sum + log.caloriesBurned, 0) || 0, [workoutLogs]);
  const latestSleep = useMemo(() => sleepLogs?.[0]?.durationHours || 0, [sleepLogs]);
  const latestWeight = useMemo(() => weightLogs?.[0]?.weightKg || userProfile?.weightKg || 0, [weightLogs, userProfile]);
  const height = useMemo(() => userProfile?.heightCm || 0, [userProfile]);
  
  const calorieGoal = userProfile?.calorieGoal || 2000;
  // Steps are not tracked yet, using mock
  const steps = 8500;
  const stepsGoal = userProfile?.stepsGoal || 10000;

  const bmi = useMemo(() => calculateBmi(latestWeight, height), [latestWeight, height]);
  
  const recipeImage = PlaceHolderImages.find(p => p.id === 'recipe-1');
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Fallback for when user is not logged in but tries to access dashboard
  if (!user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader title="Chào mừng!" description="Vui lòng đăng nhập để xem bảng điều khiển của bạn." />
        <Button asChild><Link href="/login">Đi đến trang đăng nhập</Link></Button>
      </div>
    );
  }

  const AiInfoCard = () => (
     <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Tính năng AI đang gặp sự cố</AlertTitle>
        <AlertDescription>
          {aiError
            ? "Đã xảy ra lỗi khi tìm nạp dữ liệu AI. Vui lòng kiểm tra khóa API của bạn và thử lại."
            : "Không thể tải các đề xuất do AI tạo. Vui lòng thử lại sau."}
        </AlertDescription>
      </Alert>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`Chào mừng trở lại, ${userProfile?.username || user.email}!`}
        description="Đây là ảnh chụp nhanh về sức khỏe và thể chất của bạn hôm nay."
      />
      <main className="grid gap-8">
        <Card className="flex flex-col md:flex-row items-center justify-center p-6 gap-6">
          <BmiChart bmi={bmi} />
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           <Link href="/progress">
            <Card className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lượng calo nạp vào
                </CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold">{calorieIntake.toLocaleString()} / {calorieGoal.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">kcal đã tiêu thụ</p>
              </CardContent>
              <CardFooter>
                <Progress value={(calorieIntake / calorieGoal) * 100} className="h-2" />
              </CardFooter>
            </Card>
          </Link>
          <Link href="/progress">
            <Card className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lượng calo tiêu hao
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold">{caloriesBurned.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">kcal đã đốt cháy</p>
              </CardContent>
            </Card>
          </Link>
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số bước</CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-2xl font-bold">{steps.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">trong tổng số {stepsGoal.toLocaleString()} mục tiêu</p>
            </CardContent>
          </Card>
           <Link href="/weight">
            <Card className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cân nặng</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold">{latestWeight} kg</div>
                <p className="text-xs text-muted-foreground">Cập nhật lần cuối hôm nay</p>
              </CardContent>
            </Card>
          </Link>
           <Link href="/log-sleep">
            <Card className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giấc ngủ</CardTitle>
                <Moon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-2xl font-bold">{latestSleep} giờ</div>
                <p className="text-xs text-muted-foreground">Đêm qua</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Thông tin chi tiết về sức khỏe được cá nhân hóa</CardTitle>
              <CardDescription>
                Các đề xuất do AI cung cấp dựa trên hoạt động gần đây của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiError ? (
                <AiInfoCard />
              ) : insightsResult ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insightsResult.insights}
                </p>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/50">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="ml-2 text-muted-foreground">Đang tạo thông tin chi tiết...</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/progress">Xem báo cáo đầy đủ</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Công thức của ngày</CardTitle>
              <CardDescription>Một gợi ý lành mạnh từ đầu bếp AI của chúng tôi.</CardDescription>
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
              {aiError ? (
                 <AiInfoCard />
              ) : recipesResult ? (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {recipesResult.recipeRecommendations}
                </p>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/50">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                   <p className="ml-2 text-muted-foreground">Đang tìm công thức...</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/recipes">Khám phá thêm công thức</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
