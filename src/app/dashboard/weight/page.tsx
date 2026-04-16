// ==========================================
// FILE: src/app/dashboard/weight/page.tsx
// MỤC ĐÍCH: Trang Theo dõi Cân nặng
// TỔNG QUAN: Cung cấp giao diện biểu đồ và biểu mẫu để quản lý cân nặng.
// ==========================================

'use client';

import { useState } from 'react';
import { Scale, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import AddWeightForm from '@/components/dashboard/AddWeightForm';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const weightChartConfig = {
  weight: {
    label: 'Cân nặng (kg)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

type WeightLog = {
  weight: number;
  date: string;
};

export default function WeightPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();
  const [weightFilter, setWeightFilter] = useState('30');

  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
      orderBy('date', 'desc'),
      limit(30)
    );
  }, [firestore, user]);

  const { data: weightData, isLoading: weightLoading } = useCollection<WeightLog>(weightQuery);

  const chartData = useMemo(() => {
    if (!weightData) return [];
    const limitCount = parseInt(weightFilter);
    return weightData.slice(0, limitCount).map((d) => ({
      date: new Date(d.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: d.weight,
    })).reverse();
  }, [weightData, weightFilter]);

  const currentWeight = weightData?.[0]?.weight || userProfile?.weight;
  const targetWeight = userProfile ? Math.round(22 * Math.pow(userProfile.height / 100, 2) * 10) / 10 : 0;
  const weightDiff = currentWeight && targetWeight ? currentWeight - targetWeight : 0;

  return (
    <div className="flex flex-col space-y-6 px-4 py-8 pb-10 w-full">
      <header className="px-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.weightPageTitle')}</h1>
        <p className="text-muted-foreground">{t('dashboard.weightPageDescription')}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tóm tắt chỉ số */}
        <Card className="md:col-span-1 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {t('dashboard.currentWeight')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{currentWeight ? `${currentWeight} kg` : 'N/A'}</div>
            {currentWeight && Math.abs(weightDiff) >= 0.1 && (
              <div className={cn("flex items-center gap-2 text-sm mt-4 font-semibold px-3 py-2 rounded-lg", weightDiff > 0 ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600")}>
                <Target className="h-4 w-4" />
                Cách mức lý tưởng {Math.abs(weightDiff).toFixed(1)} kg
              </div>
            )}
            {currentWeight && Math.abs(weightDiff) < 0.1 && (
              <div className="flex items-center gap-2 text-sm mt-4 font-semibold px-3 py-2 rounded-lg bg-green-50 text-green-600">
                <Target className="h-4 w-4" />
                Đạt chuẩn BMI lý tưởng!
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4 italic">
              * Dựa trên công thức BMI y tế cho chiều cao {userProfile?.height}cm
            </p>
          </CardContent>
        </Card>

        {/* Biểu đồ chính */}
        <Card className="md:col-span-2 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl font-bold">{t('dashboard.weightTrackingTitle')}</CardTitle>
              <CardDescription>{t('dashboard.weightTrackingDescription')}</CardDescription>
            </div>
            <Select value={weightFilter} onValueChange={setWeightFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Chọn phạm vi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('dashboard.weightFilter.last7')}</SelectItem>
                <SelectItem value="30">{t('dashboard.weightFilter.last30')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <BarChart data={chartData} config={weightChartConfig} yAxisWidth={40} className="h-72" showLegend={false} />
            <div className="pt-4 border-t">
              {user && <AddWeightForm userId={user.uid} />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
