"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, Timestamp, limit } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type WeightLog = {
  id: string;
  weightKg: number;
  timestamp: Timestamp;
};

const weightChartConfig = {
    weight: {
        label: "Cân nặng (kg)",
        color: "hsl(var(--chart-5))",
    }
} satisfies ChartConfig;

export default function WeightPage() {
  const [newWeight, setNewWeight] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const weightLogsCollectionRef = useMemoFirebase(
    () => (db && user ? collection(db, "users", user.uid, "weight_logs") : null),
    [db, user]
  );
  
  const weightLogsQuery = useMemoFirebase(
    () => (weightLogsCollectionRef ? query(weightLogsCollectionRef, orderBy("timestamp", "desc"), limit(30)) : null),
    [weightLogsCollectionRef]
  );
  
  const { data: weightLogs, isLoading: weightLogsLoading } = useCollection<WeightLog>(weightLogsQuery);

  const weightDataForChart = useMemo(() => {
    if (!weightLogs) return [];
    return weightLogs.map(log => ({
      date: format(log.timestamp.toDate(), 'dd/MM'),
      weight: log.weightKg,
    })).reverse(); // reverse to show oldest first
  }, [weightLogs]);


  const handleAddWeight = () => {
    if (newWeight && date && user && weightLogsCollectionRef) {
      addDoc(weightLogsCollectionRef, {
        userId: user.uid,
        weightKg: Number(newWeight),
        timestamp: date,
      }).then(() => {
        toast({ title: "Thành công!", description: "Đã ghi lại cân nặng." });
        setNewWeight("");
      }).catch(err => {
        console.error(err);
        toast({ variant: "destructive", title: "Lỗi!", description: "Không thể ghi lại cân nặng." });
      });
    }
  };

  const isLoading = isUserLoading || weightLogsLoading;

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
            title="Theo dõi cân nặng"
            description="Theo dõi sự thay đổi cân nặng của bạn và ghi lại các mục mới."
          />
        <Alert>
          <AlertTitle>Vui lòng đăng nhập</AlertTitle>
          <AlertDescription>
            Bạn cần đăng nhập để ghi lại cân nặng và xem lịch sử của mình.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Theo dõi cân nặng"
        description="Theo dõi sự thay đổi cân nặng của bạn và ghi lại các mục mới."
      />
      <div className="grid gap-8">
        <Card>
          <CardHeader>
              <CardTitle>Thay đổi cân nặng - 30 lần ghi gần nhất</CardTitle>
              <CardDescription>
              Theo dõi xu hướng cân nặng của bạn theo thời gian.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {weightDataForChart.length > 0 ? (
                <ChartContainer config={weightChartConfig} className="h-[300px] w-full">
                <LineChart accessibilityLayer data={weightDataForChart}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        domain={['dataMin - 1', 'dataMax + 1']}
                        label={{ value: "kg", position: "insideTopLeft", dy: -10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      dataKey="weight"
                      type="monotone"
                      stroke="var(--color-weight)"
                      strokeWidth={2}
                      dot={{
                          fill: "var(--color-weight)",
                      }}
                      activeDot={{
                          r: 6,
                      }}
                    />
                </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted/50">
                    <p className="text-muted-foreground">Không có dữ liệu cân nặng để hiển thị.</p>
                </div>
              )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ghi lại cân nặng hôm nay</CardTitle>
            <CardDescription>
              Nhập cân nặng hiện tại của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="weight-input">Cân nặng (kg)</Label>
                <Input 
                    id="weight-input" 
                    type="number" 
                    placeholder="ví dụ: 70.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
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
            <Button onClick={handleAddWeight}>Lưu cân nặng</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
