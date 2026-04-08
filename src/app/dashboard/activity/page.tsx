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
import { useFirestore, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy, limit, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import { Loader2, Zap, MoreHorizontal, Pencil, Trash2, BrainCircuit, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Heart, Activity, Plus } from 'lucide-react';
import { WithId } from '@/firebase/firestore/use-collection';
import { useTranslation } from '@/context/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EditActivityForm from '@/components/dashboard/EditActivityForm';
import { useToast } from '@/components/ui/toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import AiActivityChatLog from '@/components/dashboard/AiActivityChatLog';
import { analyzeActivityBalance, type AnalyzeActivityBalanceOutput } from '@/ai/flows/analyze-activity-balance-flow';
import { cn } from '@/lib/utils';
import AddHeartRateForm from '@/components/dashboard/AddHeartRateForm';
import AddBloodPressureForm from '@/components/dashboard/AddBloodPressureForm';

type Activity = {
  name: string;
  duration: number;
  caloriesBurned: number;
  date: string;
  userId: string;
};

type WeightLog = {
  weight: number;
  date: string;
};

export default function ActivityPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useTranslation();
  const { toast } = useToast();

  const [activityFilter, setActivityFilter] = useState('30');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<WithId<Activity> | null>(null);
  const [today, setToday] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeActivityBalanceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHRDialogOpen, setIsHRDialogOpen] = useState(false);
  const [isBPDialogOpen, setIsBPDialogOpen] = useState(false);

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const activityChartConfig = useMemo(() => ({
    calories: {
      label: t('activity.chart.calories'),
      color: '#f59e0b', // Amber-500
    },
  }), [t]) satisfies ChartConfig;

  const activityQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'activities'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
      orderBy('date', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const hrQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'heart_rates'),
      orderBy('date', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const bpQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'blood_pressures'),
      orderBy('date', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  const { data: activityData, isLoading: activityLoading } = useCollection<Activity>(
    activityQuery
  );

  const { data: latestWeightData } = useCollection<WeightLog>(weightQuery);
  const { data: hrData } = useCollection<any>(hrQuery);
  const { data: bpData } = useCollection<any>(bpQuery);
  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<any>(suggestionDocRef);

  // Rehydrate AI Analysis from Firestore if it exists
  useEffect(() => {
    if (suggestionData?.activityAnalysis) {
      setAiAnalysis(suggestionData.activityAnalysis);
    }
  }, [suggestionData]);

  const baseBurn = useMemo(() => {
    if (!userProfile) return { bmr: 0, tdee: 0 };
    
    const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
    
    const bmr = calculateBMR(
      currentWeight,
      userProfile.height,
      userProfile.age,
      userProfile.gender
    );
    const tdee = calculateTDEE(bmr, userProfile.activityLevel);
    
    return { bmr, tdee };
  }, [userProfile, latestWeightData]);

  const todayActivities = useMemo(() => {
    if (!activityData || !today) return [];
    return activityData.filter(a => a.date === today);
  }, [activityData, today]);

  const totalBurnedToday = useMemo(() => {
    return todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  }, [todayActivities]);

  const movementGoal = useMemo(() => {
    if (!userProfile) return 300;
    const goal = userProfile.weightGoal || 'maintain';
    if (goal === 'lose') return 500;
    if (goal === 'gain') return 250;
    return 350;
  }, [userProfile]);

  const remainingToBurn = Math.max(0, movementGoal - totalBurnedToday);

  useEffect(() => {
    if (suggestionLoading) return;
    if (todayActivities.length > 0 && userProfile && baseBurn.tdee > 0) {
      // Don't re-run if we already have up-to-date data in Firestore
      if (suggestionData?.activityAnalysis && !suggestionLoading) {
        // Simple staleness check - if total burned matches approximately, don't re-run
        const snap = suggestionData.activityAnalysis.snapshot;
        if (snap && Math.abs(snap.totalBurned - totalBurnedToday) < 10) {
          return;
        }
      }

      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const result = await analyzeActivityBalance({
            totalBurned: totalBurnedToday,
            tdee: baseBurn.tdee,
            activities: todayActivities.map(a => a.name),
            goal: userProfile.goal,
            language: locale,
          });
          
          setAiAnalysis(result);

          // Save to Firestore
          if (suggestionDocRef) {
            await setDoc(suggestionDocRef, {
              activityAnalysis: {
                ...result,
                updatedAt: serverTimestamp(),
                snapshot: { totalBurned: totalBurnedToday }
              }
            }, { merge: true });
          }
        } catch (error) {
          console.error("AI Activity Analysis Error:", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      runAnalysis();
    } else if (!activityLoading && todayActivities.length === 0) {
      setAiAnalysis(null);
    }
  }, [totalBurnedToday, todayActivities, userProfile, baseBurn.tdee, locale, activityLoading, suggestionDocRef, suggestionData, suggestionLoading]);

  const chartData = useMemo(() => {
    if (!activityData) return [];

    const dailyCalories: { [date: string]: number } = {};

    activityData.forEach((activity) => {
      const date = activity.date;
      if (dailyCalories[date]) {
        dailyCalories[date] += activity.caloriesBurned;
      } else {
        dailyCalories[date] = activity.caloriesBurned;
      }
    });

    const limitCount = parseInt(activityFilter);

    return Object.keys(dailyCalories)
      .map((date) => ({
        date: new Date(date + 'T00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        calories: dailyCalories[date],
        fullDate: date,
      }))
      .sort(
        (a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
      )
      .slice(-limitCount);
  }, [activityData, activityFilter]);

  const dailyActivities = useMemo(() => {
    if (!activityData) return {};
    const groupedActivities: { [date: string]: WithId<Activity>[] } = {};

    activityData.forEach((activity) => {
      const date = activity.date;
      if (groupedActivities[date]) {
        groupedActivities[date].push(activity);
      } else {
        groupedActivities[date] = [activity];
      }
    });
    return groupedActivities;
  }, [activityData]);

  const handleDeleteActivity = () => {
    if (!selectedActivity || !user) return;
    const activityDocRef = doc(
      firestore,
      `users/${user.uid}/activities/${selectedActivity.id}`
    );

    deleteDoc(activityDocRef)
      .then(() => {
        toast({
          title: t('form.common.success'),
          description: t('activity.deleteSuccess'),
        });
      })
      .catch((error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: activityDocRef.path,
            operation: 'delete',
          })
        );
        toast({
          variant: 'destructive',
          title: t('form.common.error'),
          description: t('activity.deleteError'),
        });
      })
      .finally(() => {
        setIsDeleteDialogOpen(false);
        setSelectedActivity(null);
      });
  };

  // Helper to format text with line breaks and strip HTML tags
  const formatAiText = (text: string) => {
    if (!text) return '';
    return text.replace(/\\n/g, '\n').replace(/<br\s*\/?>/g, '\n');
  };

  const isLoading = userLoading || activityLoading;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-accent/20 bg-accent/5 h-full">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('activity.baseBurn.title')}</CardTitle>
              <CardDescription className="text-[10px]">{t('activity.baseBurn.description')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium text-muted-foreground">{t('activity.baseBurn.bmr')}</span>
                <span className="font-bold">{Math.round(baseBurn.bmr)} kcal</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-accent">{t('activity.baseBurn.tdee')}</span>
                <span className="text-xl font-black text-accent">{Math.round(baseBurn.tdee)} <span className="text-xs font-normal text-foreground">kcal</span></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 h-full">
           <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('activity.target.title')}</CardTitle>
              <CardDescription className="text-[10px]">{t('activity.target.description')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
             <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">{t('activity.target.goal')}</span>
                <span className="font-bold">{movementGoal} kcal</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">{t('activity.target.burned')}</span>
                <span className="font-bold">{totalBurnedToday} kcal</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                 <span className="text-sm font-bold text-primary">{remainingToBurn > 0 ? t('activity.target.remaining') : t('activity.target.completed')}</span>
                 <span className="text-xl font-black text-primary">{remainingToBurn} <span className="text-xs font-normal text-foreground">kcal</span></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5 h-full">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('activity.heartRate.title')}</CardTitle>
                <CardDescription className="text-[10px]">{t('activity.heartRate.description')}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600"
              onClick={() => setIsHRDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
             <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-red-500 uppercase">
                  {hrData && hrData.length > 0 ? t('form.common.success') : "N/A"}
                </span>
                <span className="text-xl font-black text-red-500">
                  {hrData && hrData.length > 0 ? hrData[0].bpm : "--"}{' '}
                  <span className="text-xs font-normal text-foreground">{t('activity.unit.bpm')}</span>
                </span>
             </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-500/20 bg-indigo-500/5 h-full">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('activity.bloodPressure.title')}</CardTitle>
                <CardDescription className="text-[10px]">{t('activity.bloodPressure.description')}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-600"
              onClick={() => setIsBPDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
             <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-indigo-500 uppercase">
                  {bpData && bpData.length > 0 ? t('form.common.success') : "N/A"}
                </span>
                <span className="text-xl font-black text-indigo-500">
                  {bpData && bpData.length > 0 ? `${bpData[0].systolic}/${bpData[0].diastolic}` : "--/--"}{' '}
                  <span className="text-xs font-normal text-foreground">{t('activity.unit.mmHg')}</span>
                </span>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t('activity.title')}</CardTitle>
            <CardDescription>
              {t('activity.description')}
            </CardDescription>
          </div>
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('common.filter.last7')}</SelectItem>
              <SelectItem value="30">{t('common.filter.last30')}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && !activityData ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BarChart
              data={chartData}
              config={activityChartConfig}
              yAxisWidth={40}
              className="h-64"
              showLegend={false}
              referenceLineValue={movementGoal}
              referenceLineLabel={t('activity.target.goal')}
            />
          )}

          {/* AI Analysis Row - Moved between Tracking Section and Log section */}
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('activity.aiAnalysisTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center min-h-[120px] gap-2 text-primary animate-pulse py-10">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm font-medium">HealthSphere AI đang đánh giá hiệu quả vận động...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold w-fit",
                    aiAnalysis.status === 'good' ? "bg-green-100 text-green-700" : 
                    aiAnalysis.status === 'warning' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  )}>
                    {aiAnalysis.status === 'good' ? <CheckCircle2 className="h-3 w-3" /> : 
                    aiAnalysis.status === 'warning' ? <AlertTriangle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {aiAnalysis.status === 'good' ? t('activity.status.good') : 
                    aiAnalysis.status === 'warning' ? t('activity.status.warning') : t('activity.status.bad')}
                  </div>
                  <div className="text-base leading-relaxed whitespace-pre-line font-medium text-foreground/90">
                    {formatAiText(aiAnalysis.analysis)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[120px] text-center text-muted-foreground space-y-2 py-10">
                  <BrainCircuit className="h-10 w-10 opacity-20" />
                  <p className="text-sm italic">{t('activity.aiNoData')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('activity.logTitle')}</h3>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t('activity.manualSeparator')}</span></div>
            </div>
            {user && <AiActivityChatLog userId={user.uid} />}
          </div>

          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">{t('activity.dailyLogTitle')}</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(dailyActivities).length > 0 ? (
              <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
                {Object.entries(dailyActivities).sort((a,b) => b[0].localeCompare(a[0])).map(([date, activities]) => (
                  <div key={date}>
                    <h4 className="sticky top-0 mb-2 border-b bg-card py-2 font-semibold text-md">
                      {new Date(date + 'T00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h4>
                    <ul className="space-y-2 pt-2">
                      {activities.map((activity) => (
                        <li
                          key={activity.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div>
                            <p className="font-medium">{activity.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.duration} {t('activity.unit.minutes')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-semibold">
                              {activity.caloriesBurned} kcal
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedActivity(activity);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('form.common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedActivity(activity);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('form.common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {t('activity.noActivity')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('activity.editTitle')}</DialogTitle>
          </DialogHeader>
          {selectedActivity && user && (
            <EditActivityForm
              userId={user.uid}
              activity={selectedActivity}
              onSuccess={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('activity.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('activity.deleteDescription', { name: selectedActivity?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('activity.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Heart Rate Dialog */}
      <Dialog open={isHRDialogOpen} onOpenChange={setIsHRDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('form.add_heart_rate.title')}</DialogTitle>
          </DialogHeader>
          {user && (
            <AddHeartRateForm
              userId={user.uid}
              onSuccess={() => setIsHRDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Blood Pressure Dialog */}
      <Dialog open={isBPDialogOpen} onOpenChange={setIsBPDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('form.add_blood_pressure.title')}</DialogTitle>
          </DialogHeader>
          {user && (
            <AddBloodPressureForm
              userId={user.uid}
              onSuccess={() => setIsBPDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
