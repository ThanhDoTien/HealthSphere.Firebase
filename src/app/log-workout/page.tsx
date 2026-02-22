"use client";

import { useState, useTransition, useMemo } from "react";
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
import { List, Loader2, Sparkles, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, serverTimestamp, Timestamp, limit } from 'firebase/firestore';
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type WorkoutLog = {
  id: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  timestamp: Timestamp;
};

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

  const [manualWorkout, setManualWorkout] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualCalories, setManualCalories] = useState("");

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const workoutLogsCollectionRef = useMemoFirebase(
    () => (db && user ? collection(db, "users", user.uid, "workout_logs") : null),
    [db, user]
  );
  
  const workoutLogsQuery = useMemoFirebase(
    () => (workoutLogsCollectionRef ? query(workoutLogsCollectionRef, orderBy("timestamp", "desc")) : null),
    [workoutLogsCollectionRef]
  );
  
  const { data: workoutLogs, isLoading: workoutLogsLoading } = useCollection<WorkoutLog>(workoutLogsQuery);

  const caloriesBurnedDataForChart = useMemo(() => {
    if (!workoutLogs) return [];
    // This logic is simplified: it should aggregate calories per day for the last 7 days.
    // For now, we'll just show the last 7 entries.
    const recentLogs = workoutLogs.slice(0, 7);
    return recentLogs.map(log => ({
      date: format(log.timestamp.toDate(), 'eee', { locale: vi }),
      calories: log.caloriesBurned,
    })).reverse();
  }, [workoutLogs]);

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
    if (manualWorkout && manualDuration && manualCalories && user && workoutLogsCollectionRef) {
      addDoc(workoutLogsCollectionRef, {
        userId: user.uid,
        name: manualWorkout,
        durationMinutes: Number(manualDuration),
        caloriesBurned: Number(manualCalories),
        timestamp: serverTimestamp(),
      }).then(() => {
        toast({ title: "Thành công!", description: "Đã ghi lại bài tập." });
        setManualWorkout("");
        setManualDuration("");
        setManualCalories("");
      }).catch(err => {
        console.error(err);
        toast({ variant: "destructive", title: "Lỗi!", description: "Không thể ghi lại bài tập." });
      });
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysLogs = workoutLogs?.filter(log => log.timestamp && log.timestamp.toDate() > today);
  const totalCaloriesBurned = todaysLogs?.reduce((sum, workout) => sum + workout.caloriesBurned, 0) || 0;
  
  const isLoading = isUserLoading || workoutLogsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Ghi lại bài tập"
          description="Thêm các buổi tập của bạn để theo dõi hoạt động và lượng calo đã đốt cháy."
        />
        <Alert>
          <AlertTitle>Vui lòng đăng nhập</AlertTitle>
          <AlertDescription>
            Bạn cần đăng nhập để ghi lại bài tập và xem lịch sử của mình.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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
              {caloriesBurnedDataForChart.length > 0 ? (
                <ChartContainer config={caloriesBurnedChartConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={caloriesBurnedDataForChart}>
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
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted/50">
                    <p className="text-muted-foreground">Không có dữ liệu bài tập để hiển thị.</p>
                </div>
              )}
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
              {todaysLogs && todaysLogs.length > 0 ? (
                <ul className="space-y-3">
                  {todaysLogs.map((workout) => (
                    <li
                      key={workout.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{workout.name} ({workout.durationMinutes} phút)</span>
                      <span className="font-medium">{workout.caloriesBurned} kcal</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có bài tập nào được ghi lại hôm nay.</p>
              )}
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
