'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import AddSleepForm from '@/components/dashboard/AddSleepForm';
import { Loader2, BrainCircuit, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { WithId } from '@/firebase/firestore/use-collection';
import { useTranslation } from '@/context/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { analyzeSleepQuality, type AnalyzeSleepOutput } from '@/ai/flows/analyze-sleep-quality-flow';
import { cn } from '@/lib/utils';

type Sleep = {
  duration: number;
  date: string;
  userId: string;
};

export default function SleepPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();

  const [sleepFilter, setSleepFilter] = useState('30');
  const [today, setToday] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeSleepOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const sleepChartConfig = useMemo(() => ({
    duration: {
      label: t('sleep.chart.duration'),
      color: '#8A00FF',
    },
  }), [t]) satisfies ChartConfig;

  const sleepQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'sleep'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: sleepData, isLoading: sleepLoading } = useCollection<Sleep>(
    sleepQuery
  );

  const todaySleep = useMemo(() => {
    if (!sleepData || !today) return 0;
    const todayEntry = sleepData.find(s => s.date === today);
    return todayEntry ? todayEntry.duration : 0;
  }, [sleepData, today]);

  // Sleep AI Analysis Effect
  useEffect(() => {
    if (todaySleep > 0 && userProfile) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const result = await analyzeSleepQuality({
            duration: todaySleep,
            age: userProfile.age || 25,
            goal: userProfile.goal,
            language: locale,
          });
          setAiAnalysis(result);
        } catch (error) {
          console.error("AI Sleep Analysis Error:", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      runAnalysis();
    } else if (!sleepLoading && todaySleep === 0) {
      setAiAnalysis(null);
    }
  }, [todaySleep, userProfile, locale, sleepLoading]);

  const chartData = useMemo(() => {
    if (!sleepData) return [];

    const limitCount = parseInt(sleepFilter);

    return sleepData
      .map((d) => ({
        date: new Date(d.date + 'T00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        duration: d.duration,
        fullDate: d.date,
      }))
      .sort(
        (a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
      )
      .slice(-limitCount);
  }, [sleepData, sleepFilter]);

  const dailySleep = useMemo(() => {
    if (!sleepData) return {};
    const groupedSleep: { [date: string]: WithId<Sleep>[] } = {};

    sleepData.forEach((sleep) => {
      const date = sleep.date;
      if (groupedSleep[date]) {
        groupedSleep[date].push(sleep);
      } else {
        groupedSleep[date] = [sleep];
      }
    });
    return groupedSleep;
  }, [sleepData]);

  const isLoading = userLoading || sleepLoading;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t('sleep.title')}</CardTitle>
              <CardDescription>
                {t('sleep.description')}
              </CardDescription>
            </div>
            <Select value={sleepFilter} onValueChange={setSleepFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('common.filter.last7')}</SelectItem>
                <SelectItem value="30">{t('common.filter.last30')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading && !sleepData ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <BarChart
                data={chartData}
                config={sleepChartConfig}
                yAxisWidth={40}
                className="h-64"
                showLegend={false}
              />
            )}
          </CardContent>
        </Card>

        {/* Sleep AI Analysis */}
        <Card className="border-primary/20 bg-primary/5 flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('sleep.aiAnalysisTitle') || 'Phân tích Giấc ngủ AI'}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-primary animate-pulse py-10">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-xs font-medium">AI đang đánh giá chất lượng nghỉ ngơi...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold w-fit",
                  aiAnalysis.status === 'good' ? "bg-green-100 text-green-700" : 
                  aiAnalysis.status === 'warning' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                )}>
                  {aiAnalysis.status === 'good' ? <CheckCircle2 className="h-3 w-3" /> : 
                   aiAnalysis.status === 'warning' ? <AlertTriangle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {aiAnalysis.status === 'good' ? (t('sleep.status.good') || 'Hồi phục tốt') : 
                   aiAnalysis.status === 'warning' ? (t('sleep.status.warning') || 'Thiếu ngủ nhẹ') : (t('sleep.status.bad') || 'Thiếu ngủ nghiêm trọng')}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line font-medium text-foreground/80">
                  {aiAnalysis.analysis}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 py-10">
                <BrainCircuit className="h-10 w-10 opacity-20" />
                <p className="text-xs italic">{t('sleep.aiNoData') || 'Ghi nhận giấc ngủ hôm nay để nhận phản hồi từ AI.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-medium">{t('sleep.logTitle')}</h3>
            {user && <AddSleepForm userId={user.uid} />}
          </div>

          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">{t('sleep.dailyLogTitle')}</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(dailySleep).length > 0 ? (
              <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
                {Object.entries(dailySleep).sort((a,b) => b[0].localeCompare(a[0])).map(([date, sleeps]) => (
                  <div key={date}>
                    <h4 className="sticky top-0 mb-2 border-b bg-card py-2 font-semibold text-md">
                      {new Date(date + 'T00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h4>
                    <ul className="space-y-2 pt-2">
                      {sleeps.map((sleep) => (
                        <li
                          key={sleep.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div>
                            <p className="font-medium">{t('sleep.logEntryName')}</p>
                          </div>
                          <p className="font-semibold">
                            {sleep.duration} {t('sleep.unit.hours')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {t('sleep.noSleep')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
