"use client";

import { useState, useTransition } from "react";
import { getWorkoutSuggestion, WorkoutSuggestionOutput } from "@/ai/flows/workout-suggestions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Dumbbell, List, Loader2, Sparkles, Plus, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Workout = {
  name: string;
  duration: number;
  calories: number;
};

const caloriesBurnedData = [
  { date: "T2", calories: 300 },
  { date: "T3", calories: 450 },
  { date: "T4", calories: 250 },
  { date: "T5", calories: 500 },
  { date: "T6", calories: 600 },
  { date: "T7", calories: 400 },
  { date: "CN", calories: 350 },
];

const caloriesBurnedChartConfig = {
  calories: {
    label: "Lượng calo tiêu hao",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export default function LogWorkoutPage() {
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<WorkoutSuggestionOutput | null>(
    null
  );
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [loggedWorkouts, setLoggedWorkouts] = useState<Workout[]>([
    { name: "Chạy bộ", duration: 30, calories: 300 },
    { name: "Nâng tạ", duration: 45, calories: 250 },
  ]);

  const [manualWorkout, setManualWorkout] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualCalories, setManualCalories] = useState("");

  const handleGetSuggestion = () => {
    startTransition(async () => {
      setSuggestion(null);
      setSuggestionError(null);
      try {
        const result = await getWorkoutSuggestion({
          fitnessLevel: "intermediate",
          availableEquipment: "Dumbbells, resistance bands",
          workoutDuration: 45,
        });
        setSuggestion(result);
      } catch (error) {
        setSuggestionError("Không thể nhận đề xuất. Vui lòng thử lại.");
        console.error(error);
      }
    });
  };

  const handleManualAdd = () => {
    if (manualWorkout && manualDuration && manualCalories) {
      setLoggedWorkouts([
        ...loggedWorkouts,
        {
          name: manualWorkout,
          duration: Number(manualDuration),
          calories: Number(manualCalories),
        },
      ]);
      setManualWorkout("");
      setManualDuration("");
      setManualCalories("");
    }
  };

  const totalCaloriesBurned = loggedWorkouts.reduce(
    (sum, workout) => sum + workout.calories,
    0
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Ghi lại bài tập"
        description="Thêm các buổi tập của bạn để theo dõi hoạt động và lượng calo đã đốt cháy."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lượng calo tiêu hao - 7 ngày qua</CardTitle>
              <CardDescription>
                Biểu đồ này cho thấy lượng calo bạn đã đốt cháy hàng ngày.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={caloriesBurnedChartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={caloriesBurnedData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      label={{ value: "kcal", position: "insideTopLeft", dy: -10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="calories" fill="var(--color-calories)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles /> Đề xuất từ AI
              </CardTitle>
              <CardDescription>
                Nhận một kế hoạch tập luyện được cá nhân hóa từ huấn luyện viên AI của chúng tôi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/50">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : suggestion ? (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Đề xuất bài tập của bạn</AlertTitle>
                  <AlertDescription>
                    <p className="whitespace-pre-wrap">{suggestion.suggestion}</p>
                  </AlertDescription>
                </Alert>
              ) : null}
               {suggestionError && <p className="text-sm text-destructive mt-2">{suggestionError}</p>}
            </CardContent>
            <CardFooter>
              <Button onClick={handleGetSuggestion} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Tạo bài tập
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus /> Thêm bài tập thủ công
              </CardTitle>
              <CardDescription>
                Ghi lại một hoạt động bạn đã hoàn thành.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="workout-name">Tên bài tập</Label>
                  <Input
                    id="workout-name"
                    placeholder="ví dụ: Chạy bộ"
                    value={manualWorkout}
                    onChange={(e) => setManualWorkout(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Thời gian (phút)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="ví dụ: 30"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories-burned">Lượng calo đã đốt cháy (kcal)</Label>
                <Input
                  id="calories-burned"
                  type="number"
                  placeholder="ví dụ: 300"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleManualAdd}>Thêm bài tập</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List /> Nhật ký bài tập hôm nay
              </CardTitle>
              <CardDescription>
                Tổng quan về các hoạt động đã ghi lại của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {loggedWorkouts.map((workout, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span>{workout.name} ({workout.duration} phút)</span>
                    <span className="font-medium">{workout.calories} kcal</span>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Tổng cộng đã đốt cháy</span>
                <span>{totalCaloriesBurned} kcal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
