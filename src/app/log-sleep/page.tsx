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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Moon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function LogSleepPage() {
  const [sleepHours, setSleepHours] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleAddSleep = () => {
    if (sleepHours && date) {
      // In a real app, you would process and save this data.
      console.log(`Sleep: ${sleepHours} hours on ${format(date, "PPP", { locale: vi })}`);
      setSleepHours("");
      alert("Đã ghi lại giấc ngủ!");
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Ghi lại giấc ngủ"
        description="Nhập thời gian ngủ của bạn để theo dõi mô hình nghỉ ngơi."
      />
      <div className="grid gap-8 justify-center">
        <Card className="w-full max-w-lg">
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
      </div>
    </div>
  );
}
