// ==========================================
// FILE: src/app/dashboard/weight/page.tsx
// MỤC ĐÍCH: Trang Theo dõi Cân nặng
// TỔNG QUAN: Cung cấp giao diện biểu đồ và biểu mẫu để quản lý cân nặng.
// ==========================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Scale, Target, TrendingUp, TrendingDown, Minus, Sparkles, Info, CheckCircle2, AlertCircle, Flame } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import AddWeightForm from '@/components/dashboard/AddWeightForm';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import BmiMeter from '@/components/dashboard/BmiMeter';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import { RefreshCw, Utensils, Dumbbell, AlertTriangle, Activity } from 'lucide-react';

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
  const [today, setToday] = useState('');

  useEffect(() => {
    const now = new Date();
    setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  }, []);

  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
      orderBy('date', 'desc'),
      limit(30)
    );
  }, [firestore, user]);

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  const { data: weightData, isLoading: weightLoading } = useCollection<WeightLog>(weightQuery);
  const { data: suggestionData } = useDoc<any>(suggestionDocRef);

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

  const tdee = useMemo(() => {
    if (!userProfile || !currentWeight) return 0;
    const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
    return Math.round(calculateTDEE(bmr, userProfile.activityLevel || 'moderate'));
  }, [userProfile, currentWeight]);

  const trendAnalysis = useMemo(() => {
    if (!weightData || weightData.length < 2) return null;
    const recent7 = weightData.slice(0, 7);
    const diff = recent7[0].weight - recent7[recent7.length - 1].weight;
    const avgChange = diff / (recent7.length - 1);
    
    let trendText = "";
    let statusColor = "text-primary";
    let trendIcon = Minus;

    if (Math.abs(diff) < 0.2) {
      trendText = "Cân nặng đang ở trạng thái ổn định tuyệt vời.";
      trendIcon = CheckCircle2;
      statusColor = "text-green-500";
    } else if (diff > 0) {
      trendText = `Xu hướng tăng nhẹ (${Math.abs(diff).toFixed(1)}kg trong các bản ghi gần nhất).`;
      trendIcon = TrendingUp;
      statusColor = "text-orange-500";
    } else {
      trendText = `Xu hướng giảm tích cực (${Math.abs(diff).toFixed(1)}kg trong 7 ngày gần đây).`;
      trendIcon = TrendingDown;
      statusColor = "text-green-500";
    }

    return { diff, avgChange, trendText, statusColor, trendIcon };
  }, [weightData]);

  const bmi = useMemo(() => {
    if (!currentWeight || !userProfile?.height) return 0;
    const heightM = userProfile.height / 100;
    return currentWeight / (heightM * heightM);
  }, [currentWeight, userProfile?.height]);

  const getBmiInfo = (bmiValue: number) => {
    if (bmiValue === 0) return { label: 'N/A', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Minus, advice: '' };
    if (bmiValue < 18.5) return { label: t('dashboard.bmi.underweight'), color: 'text-blue-600', bg: 'bg-blue-50', icon: AlertCircle, advice: t('dashboard.bmi.advice.underweight') };
    if (bmiValue < 25) return { label: t('dashboard.bmi.normal'), color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, advice: t('dashboard.bmi.advice.normal') };
    if (bmiValue < 30) return { label: t('dashboard.bmi.overweight'), color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle, advice: t('dashboard.bmi.advice.overweight') };
    return { label: t('dashboard.bmi.obese'), color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle, advice: t('dashboard.bmi.advice.obese') };
  };

  const bmiInfo = getBmiInfo(bmi);

  return (
    <div className="flex flex-col space-y-6 px-4 py-8 pb-10 w-full animate-in fade-in duration-500">
      <div className="grid gap-6">
        {/* Hàng 1: Unified BMI & AI Analysis Card */}
        <div className="w-full">
          <Card className="shadow-xl border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden flex flex-col relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="h-32 w-32 text-primary" />
            </div>
            
            <CardHeader className="pb-2 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2 text-primary">
                    <Activity className="h-5 w-5" />
                    Nhận xét chi tiết từ AI
                  </CardTitle>
                  <CardDescription className="text-xs font-medium tracking-wide opacity-70">Personalized Health Intelligence</CardDescription>
                </div>
                <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-bold text-primary animate-pulse">
                  Live Analysis
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="grid grid-cols-1 xl:grid-cols-5 divide-y xl:divide-y-0 xl:divide-x divide-primary/10">
                {/* Dữ liệu BMI bên trái */}
                <div className="xl:col-span-2 flex flex-col justify-center bg-card/50">
                   <BmiMeter height={userProfile?.height || 0} weight={currentWeight || 0} className="border-none shadow-none bg-transparent" />
                </div>

                {/* AI Insights bên phải */}
                <div className="xl:col-span-3 p-6 space-y-6 flex-1">
                  {/* PHẦN 1: GỢI Ý CÁ NHÂN HÓA */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground tracking-tight">
                      <div className="h-1 w-8 bg-primary rounded-full" />
                       Gợi ý cá nhân hóa (AI / system suggestion)
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 group">
                       <div className="p-2 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                          <Flame className="h-4 w-4 text-orange-500" />
                       </div>
                       <div>
                          <p className="text-xs font-medium text-muted-foreground tracking-wide">Lượng calo nên ăn (TDEE)</p>
                          <p className="text-lg font-bold">{tdee} <span className="text-xs font-normal opacity-60">kcal</span></p>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 group">
                       <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                          <Utensils className="h-4 w-4 text-primary" />
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground tracking-wide">🍽️ Gợi ý hôm nay</p>
                          <p className="text-sm font-semibold line-clamp-2" title={suggestionData?.mealSuggestions?.[0]?.name}>{suggestionData?.mealSuggestions?.[0]?.name || "Đang phân tích thực đơn..."}</p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-l md:pl-4 border-primary/10">
                    <div className="flex items-center gap-3 group">
                       <div className="p-2 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                          <TrendingUp className="h-4 w-4 text-accent" />
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground tracking-wide">🏃 Hoạt động đề xuất</p>
                          <p className="text-sm font-semibold line-clamp-2" title={suggestionData?.workoutSuggestion?.[0]?.name}>{suggestionData?.workoutSuggestion?.[0]?.name || "Tăng cường vận động nhẹ"}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 group">
                       <div className="p-2 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground tracking-wide">Cảnh báo / insight</p>
                          <p className="text-sm font-semibold text-red-600/80 leading-tight">{bmi > 25 ? "Hạn chế tinh bột vào buổi tối" : "Duy trì năng lượng ổn định"}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: PHÂN TÍCH BIỂU ĐỒ */}
              <div className="pt-4 border-t border-primary/10 space-y-3">
                 <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground tracking-tight">
                  <div className="h-1 w-8 bg-accent rounded-full" />
                   Phân tích từ dữ liệu biểu đồ bên dưới
                </div>

                <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-4 border border-primary/5 space-y-3">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">⚠️ Cân nặng trong 7 ngày gần đây</span>
                      </div>
                      {trendAnalysis && (
                         <div className={cn("text-sm font-bold flex items-center gap-1", trendAnalysis.statusColor)}>
                            <trendAnalysis.trendIcon className="h-4 w-4" />
                            {Math.abs(trendAnalysis.diff).toFixed(1)} kg
                         </div>
                      )}
                   </div>
                   
                   <p className="text-sm leading-relaxed text-foreground/80">
                      &quot;{trendAnalysis?.trendText || "Vui lòng cập nhật thêm dữ liệu cân nặng để AI có thể phân tích xu hướng chính xác hơn cho bạn."}&quot;
                   </p>
                   
                   <div className="flex items-center gap-4 pt-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-1000", trendAnalysis ? (trendAnalysis.diff > 0 ? "bg-orange-500 w-full" : "bg-green-500 w-full") : "w-0")} 
                        />
                      </div>
                      <span className="text-xs font-medium opacity-60">General Trend</span>
                   </div>
                </div>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Hàng 2: Biểu đồ cột chiếm toàn bộ chiều ngang */}
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/20">
            <div>
              <CardTitle className="text-xl font-bold">{t('dashboard.weightTrackingTitle')}</CardTitle>
              <CardDescription>{t('dashboard.weightTrackingDescription')}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={weightFilter} onValueChange={setWeightFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Chọn phạm vi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('dashboard.weightFilter.last7')}</SelectItem>
                  <SelectItem value="30">{t('dashboard.weightFilter.last30')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 px-2 sm:px-6">
            <BarChart data={chartData} config={weightChartConfig} yAxisWidth={40} className="h-80" showLegend={false} />
            <div className="pt-6 border-t px-2">
              <div className="flex items-center gap-2 mb-4 text-sm font-bold text-primary">
                <Scale className="h-4 w-4" />
                {t('dashboard.currentWeight')}: {currentWeight ? `${currentWeight} kg` : 'N/A'}
              </div>
              {user && <AddWeightForm userId={user.uid} />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
