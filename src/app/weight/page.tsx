"use client";

import { useState } from "react";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const initialWeightData = [
  { week: 1, weight: 70.5 },
  { week: 2, weight: 70.2 },
  { week: 3, weight: 70.1 },
  { week: 4, weight: 69.8 },
  { week: 5, weight: 69.5 },
  { week: 6, weight: 69.6 },
  { week: 7, weight: 69.2 },
  { week: 8, weight: 69.0 },
];

const weightChartConfig = {
    weight: {
        label: "Cân nặng (kg)",
        color: "hsl(var(--chart-5))",
    }
} satisfies ChartConfig;

export default function WeightPage() {
  const [weightData, setWeightData] = useState(initialWeightData);
  const [newWeight, setNewWeight] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleAddWeight = () => {
    if (newWeight && date) {
      // In a real app, you would process and save this data properly.
      // For this mock, we'll just log it.
      console.log(`Weight: ${newWeight} kg on ${format(date, "PPP", { locale: vi })}`);
      setNewWeight("");
      alert("Đã ghi lại cân nặng!");
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Theo dõi cân nặng"
        description="Theo dõi sự thay đổi cân nặng của bạn và ghi lại các mục mới."
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Thay đổi cân nặng - 8 tuần qua</CardTitle>
                <CardDescription>
                Theo dõi xu hướng cân nặng của bạn theo thời gian.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={weightChartConfig} className="h-[300px] w-full">
                <LineChart accessibilityLayer data={weightData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `Tuần ${value}`}
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
            </CardContent>
            </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ghi lại cân nặng hôm nay</CardTitle>
              <CardDescription>
                Nhập cân nặng hiện tại của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddWeight}>Lưu cân nặng</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
