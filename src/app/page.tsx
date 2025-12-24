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
import { getPersonalizedInsights, PersonalizedInsightsOutput } from "@/ai/flows/personalized-health-insights";
import { recipeRecommendationsBasedOnLoggedFoods, RecipeRecommendationsBasedOnLoggedFoodsOutput } from "@/ai/flows/recipe-recommendations-based-on-logged-foods";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

const mockUserData = {
  calorieIntake: 1800,
  calorieGoal: 2500,
  caloriesBurned: 400,
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

  let insightsResult: PersonalizedInsightsOutput | null = null;
  let recipesResult: RecipeRecommendationsBasedOnLoggedFoodsOutput | null = null;
  let errorState = false;

  if (apiKeySet) {
    try {
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
    } catch (error) {
      console.error("Đã xảy ra lỗi khi tìm nạp dữ liệu AI:", error);
      errorState = true;
    }
  }
  
  const recipeImage = PlaceHolderImages.find(p => p.id === 'recipe-1');

  const AiInfoCard = () => (
     <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Tính năng AI đã bị vô hiệu hóa</AlertTitle>
        <AlertDescription>
          {errorState
            ? "Đã xảy ra lỗi khi tìm nạp dữ liệu AI. Vui lòng kiểm tra khóa API của bạn và thử lại."
            : "Vui lòng đặt GEMINI_API_KEY của bạn trong tệp .env để bật thông tin chi tiết được cá nhân hóa và đề xuất công thức."}
        </AlertDescription>
      </Alert>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Chào mừng trở lại!"
        description="Đây là ảnh chụp nhanh về sức khỏe và thể chất của bạn hôm nay."
      />
      <main className="grid gap-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lượng calo nạp vào
              </CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.calorieIntake.toLocaleString()} / {mockUserData.calorieGoal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">kcal đã tiêu thụ</p>
            </CardContent>
            <CardFooter>
              <Progress value={(mockUserData.calorieIntake / mockUserData.calorieGoal) * 100} className="h-2" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lượng calo tiêu hao
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.caloriesBurned.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">kcal đã đốt cháy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số bước</CardTitle>
              <Footprints className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.steps.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">trong tổng số {mockUserData.stepsGoal.toLocaleString()} mục tiêu</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nước</CardTitle>
              <GlassWater className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.waterIntake} ly</div>
              <p className="text-xs text-muted-foreground">{mockUserData.waterGoal - mockUserData.waterIntake} ly nữa để đạt mục tiêu</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giấc ngủ</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUserData.sleep} giờ</div>
              <p className="text-xs text-muted-foreground">Đêm qua</p>
            </CardContent>
          </Card>
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
              {apiKeySet && insightsResult && !errorState ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insightsResult.insights}
                </p>
              ) : (
                <AiInfoCard />
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
              {apiKeySet && recipesResult && !errorState ? (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {recipesResult.recipeRecommendations}
                </p>
              ) : (
                 <AiInfoCard />
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
