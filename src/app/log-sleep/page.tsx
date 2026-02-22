
"use client";

import { useState, useTransition, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Moon, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getSleepAnalysis, SleepAnalysisOutput } from "@/ai/flows/sleep-analysis";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';

type SleepLog = {
  id: string;
  durationHours: number;
  timestamp: Timestamp;
};

const sleepChartConfig = {
  hours: {
    label: "Giờ ngủ",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function LogSleepPage() {
  const [sleepHours, setSleepHours] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<SleepAnalysisOutput | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const sleepLogsCollectionRef = useMemoFirebase(
    () => (db && user ? collection(db, "users", user.uid, "sleep_logs") : null),
    [db, user]
  );
  
  const sleepLogsQuery = useMemoFirebase(
    () => (sleepLogsCollectionRef ? query(sleepLogsCollectionRef, orderBy("timestamp", "desc"), limit(7)) : null),
    [sleepLogsCollectionRef]
  );
  
  const { data: sleepLogs, isLoading: sleepLogsLoading } = useCollection<SleepLog>(sleepLogsQuery);

  const sleepDataForChart = useMemo(() => {
    if (!sleepLogs) return [];
    return sleepLogs.map(log => ({
      date: format(log.timestamp.toDate(), 'eee', { locale: vi }),
      hours: log.durationHours,
    })).reverse(); // reverse to show oldest first
  }, [sleepLogs]);


  const handleAddSleep = () => {
    if (sleepHours && date && user && sleepLogsCollectionRef) {
       addDoc(sleepLogsCollectionRef, {
        userId: user.uid,
        durationHours: Number(sleepHours),
        timestamp: date,
      }).then(() => {
        toast({ title: "Thành công!", description: "Đã ghi lại giấc ngủ." });
        setSleepHours("");
      }).catch(err => {
        console.error(err);
        toast({ variant: "destructive", title: "Lỗi!", description: "Không thể ghi lại giấc ngủ." });
      });
    }
  };

  const handleGetAnalysis = () => {
    startTransition(async () => {
        setAnalysis(null);
        setAnalysisError(null);
        if (!sleepDataForChart || sleepDataForChart.length === 0) {
            setAnalysisError("Không có dữ liệu giấc ngủ để phân tích.");
            return;
        }
        try {
            const sleepDataString = sleepDataForChart.map(d => `${d.date}: ${d.hours} giờ`).join(', ');
            const result = await getSleepAnalysis({ sleepData: sleepDataString });
            setAnalysis(result);
        } catch (error) {
            setAnalysisError("Không thể phân tích giấc ngủ. Vui lòng thử lại.");
            console.error(error);
        }
    });
  }

  const isLoading = isUserLoading || sleepLogsLoading;

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
            title="Ghi lại giấc ngủ"
            description="Nhập thời gian ngủ của bạn để theo dõi mô hình nghỉ ngơi."
          />
        <Alert>
          <AlertTitle>Vui lòng đăng nhập</AlertTitle>
          <AlertDescription>
            Bạn cần đăng nhập để ghi lại giấc ngủ và xem lịch sử của mình.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Ghi lại giấc ngủ"
        description="Nhập thời gian ngủ của bạn để theo dõi mô hình nghỉ ngơi."
      />
      <div className="flex flex-col items-center gap-8">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Lịch sử giấc ngủ - 7 ngày qua</CardTitle>
                <CardDescription>
                Biểu đồ này cho thấy số giờ ngủ hàng đêm của bạn.
                </CardDescription>
            </CardHeader>
            <CardContent>
              {sleepDataForChart.length > 0 ? (
                <ChartContainer config={sleepChartConfig} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={sleepDataForChart}>
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
                            label={{ value: "giờ", position: "insideTopLeft", dy: -10, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="hours" fill="var(--color-hours)" radius={8} />
                    </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted/50">
                    <p className="text-muted-foreground">Không có dữ liệu giấc ngủ để hiển thị.</p>
                </div>
              )}
            </CardContent>
        </Card>

        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon /> Ghi lại giấc ngủ
            </CardTitle>
            <CardDescription>
              Nhập số giờ bạn đã ngủ vào một ngày cụ thể.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="sleep-input">Thời gian ngủ (giờ)</Label>
                <Input
                    id="sleep-input"
                    type="number"
                    placeholder="ví dụ: 8"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                />
                </div>
                <div className="space-y-2">
                <Label>Ngày</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: vi }) : <span>Chọn ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={vi}
                    />
                    </PopoverContent>
                </Popover>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddSleep}>Lưu giấc ngủ</Button>
          </CardFooter>
        </Card>

        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles /> Phân tích giấc ngủ bằng AI
                </CardTitle>
                <CardDescription>
                    Nhận thông tin chi tiết và đề xuất được cá nhân hóa dựa trên mô hình giấc ngủ của bạn.
                </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/50">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : analysis ? (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Phân tích giấc ngủ của bạn</AlertTitle>
                  <AlertDescription>
                    <p className="whitespace-pre-wrap">{analysis.analysis}</p>
                  </AlertDescription>
                </Alert>
              ) : null}
               {analysisError && <p className="text-sm text-destructive mt-2">{analysisError}</p>}
            </CardContent>
            <CardFooter>
              <Button onClick={handleGetAnalysis} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Phân tích giấc ngủ của tôi
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}
