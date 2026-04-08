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
import { collection, query, orderBy, doc, deleteDoc, limit, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { PieChart } from '@/components/ui/pie-chart';
import { type ChartConfig } from '@/components/ui/chart';
import { Loader2, MoreHorizontal, Pencil, Trash2, BrainCircuit, CheckCircle2, AlertTriangle, AlertCircle, Target, Flame } from 'lucide-react';
import { WithId } from '@/firebase/firestore/use-collection';
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
import EditMealForm from '@/components/dashboard/EditMealForm';
import { useToast } from '@/components/ui/toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import LogMealWithAiDialog from '@/components/dashboard/LogMealWithAiDialog';
import { useTranslation } from '@/context/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AiMealChatLog from '@/components/dashboard/AiMealChatLog';
import { analyzeNutritionBalance, type AnalyzeNutritionOutput } from '@/ai/flows/analyze-nutrition-balance-flow';
import { cn } from '@/lib/utils';
import { calculateBMR, calculateTDEE } from '@/lib/health-utils';

type Meal = {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  userId: string;
};

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

export default function CaloriesPage() {
  const { user, userProfile, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, locale } = useTranslation();

  const [calorieFilter, setCalorieFilter] = useState('30');
  const [today, setToday] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeNutritionOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const calorieChartConfig = useMemo(() => ({
    calories: {
      label: t('calories.chart.calories'),
      color: '#f59e0b', // Amber
    },
  }), [t]) satisfies ChartConfig;

  const macroChartConfig = useMemo(() => ({
    protein: { label: t('calories.chart.protein'), color: '#3b82f6' },
    carbs: { label: t('calories.chart.carbs'), color: '#f97316' },
    fat: { label: t('calories.chart.fat'), color: '#eab308' },
    fiber: { label: t('calories.chart.fiber'), color: '#22c55e' },
  }), [t]) satisfies ChartConfig;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<WithId<Meal> | null>(null);

  const mealQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'meals'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const activityQuery = useMemoFirebase(() => {
    if (!user || !today) return null;
    return query(
      collection(firestore, 'users', user.uid, 'activities'),
      where('date', '==', today)
    );
  }, [firestore, user, today]);

  const weightQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'weights'),
      orderBy('date', 'desc'),
      limit(1)
    );
  }, [firestore, user]);

  const suggestionDocRef = useMemoFirebase(() => {
    if (!user || !today) return null;
    return doc(firestore, 'users', user.uid, 'todaysuggestions', today);
  }, [firestore, user, today]);

  const { data: mealData, isLoading: mealLoading } = useCollection<Meal>(mealQuery);
  const { data: activityData } = useCollection<Activity>(activityQuery);
  const { data: latestWeightData } = useCollection<WeightLog>(weightQuery);
  const { data: suggestionData, isLoading: suggestionLoading } = useDoc<any>(suggestionDocRef);

  // Rehydrate AI Analysis from Firestore if it exists
  useEffect(() => {
    if (suggestionData?.nutritionAnalysis) {
      setAiAnalysis(suggestionData.nutritionAnalysis);
    }
  }, [suggestionData]);

  const totalActivityBurn = useMemo(() => {
    if (!activityData) return 0;
    return activityData.reduce((sum, act) => sum + act.caloriesBurned, 0);
  }, [activityData]);

  const stats = useMemo(() => {
    if (!userProfile) return { tdee: 0, target: 0, weightGoal: 'maintain', totalActivityBurn: 0 };
    const currentWeight = latestWeightData?.[0]?.weight || userProfile.weight;
    const bmr = calculateBMR(currentWeight, userProfile.height, userProfile.age, userProfile.gender);
    const tdee = Math.round(calculateTDEE(bmr, userProfile.activityLevel));
    const weightGoal = userProfile.weightGoal || 'maintain';

    const baseTarget = tdee + totalActivityBurn;
    let target = baseTarget;
    if (weightGoal === 'lose') target = baseTarget - 500;
    if (weightGoal === 'gain') target = baseTarget + 500;

    return { tdee, target, weightGoal, totalActivityBurn };
  }, [userProfile, latestWeightData, totalActivityBurn]);

  const dailyTarget = stats.target;

  const totals = useMemo(() => {
    if (!mealData || !today) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    return mealData.filter(m => m.date === today).reduce((acc, meal) => {
      acc.calories += meal.calories || 0;
      acc.protein += meal.protein || 0;
      acc.carbs += meal.carbs || 0;
      acc.fat += meal.fat || 0;
      acc.fiber += meal.fiber || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [mealData, today]);

  useEffect(() => {
    if (suggestionLoading) return;
    if (totals.calories > 0 && userProfile) {
      // Don't re-run if we already have up-to-date data in Firestore
      if (suggestionData?.nutritionAnalysis && !suggestionLoading) {
        // Simple staleness check - if totals match approximately, don't re-run
        const snap = suggestionData.nutritionAnalysis.snapshot;
        if (snap && Math.abs(snap.calories - totals.calories) < 20) {
          return;
        }
      }

      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const result = await analyzeNutritionBalance({
            totalCalories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
            fiber: totals.fiber,
            goal: userProfile.goal,
            language: locale,
          });
          
          setAiAnalysis(result);

          // Save to Firestore
          if (suggestionDocRef) {
            await setDoc(suggestionDocRef, {
              nutritionAnalysis: {
                ...result,
                updatedAt: serverTimestamp(),
                snapshot: { calories: totals.calories }
              }
            }, { merge: true });
          }
        } catch (error) {
          console.error("AI Analysis Error:", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      runAnalysis();
    } else if (!mealLoading && totals.calories === 0) {
      setAiAnalysis(null);
    }
  }, [totals, userProfile, locale, mealLoading, suggestionDocRef, suggestionData, suggestionLoading]);

  const chartData = useMemo(() => {
    if (!mealData) return [];
    const dailyCalories: { [date: string]: number } = {};
    mealData.forEach((meal) => {
      const date = meal.date;
      dailyCalories[date] = (dailyCalories[date] || 0) + meal.calories;
    });
    const limitCount = parseInt(calorieFilter);
    return Object.keys(dailyCalories)
      .map((date) => ({
        date: new Date(date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calories: dailyCalories[date],
        fullDate: date,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(-limitCount);
  }, [mealData, calorieFilter]);

  const macroData = useMemo(() => {
    if (totals.calories === 0) return [];
    const rawData = [
      { name: 'protein', value: totals.protein, fill: '#3b82f6' },
      { name: 'carbs', value: totals.carbs, fill: '#f97316' },
      { name: 'fat', value: totals.fat, fill: '#eab308' },
      { name: 'fiber', value: totals.fiber, fill: '#22c55e' },
    ].filter(item => item.value > 0);

    const totalMacros = rawData.reduce((acc, curr) => acc + curr.value, 0);
    return rawData.map(item => ({
      ...item,
      percent: totalMacros > 0 ? item.value / totalMacros : 0
    }));
  }, [totals]);

  const dailyMeals = useMemo(() => {
    if (!mealData) return {};
    const grouped: { [date: string]: WithId<Meal>[] } = {};
    mealData.forEach((meal) => {
      if (!grouped[meal.date]) {
        grouped[meal.date] = [];
      }
      grouped[meal.date].push(meal);
    });
    return grouped;
  }, [mealData]);

  const handleDeleteMeal = () => {
    if (!selectedMeal || !user) return;
    const mealDocRef = doc(firestore, `users/${user.uid}/meals/${selectedMeal.id}`);
    deleteDoc(mealDocRef)
      .then(() => {
        toast({ title: t('form.common.success'), description: t('calories.deleteSuccess') });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: mealDocRef.path, operation: 'delete' }));
        toast({ variant: 'destructive', title: t('form.common.error'), description: t('calories.deleteError') });
      })
      .finally(() => {
        setIsDeleteDialogOpen(false);
        setSelectedMeal(null);
      });
  };

  const formatAiText = (text: string) => {
    if (!text) return '';
    return text.replace(/\\n/g, '\n').replace(/<br\s*\/?>/g, '\n');
  };

  const isLoading = userLoading || mealLoading;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5 flex flex-col">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('calories.recommendation.title')}</CardTitle>
              <CardDescription className="text-sm font-medium mt-1">
                {t('calories.recommendation.dynamic_desc', {
                  tdee: stats.tdee,
                  burn: stats.totalActivityBurn || 0,
                  goal: t(`calories.goal.${stats.weightGoal}`)
                })}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-primary">{dailyTarget}</span>
              <span className="text-lg font-medium text-muted-foreground">kcal / {t('common.day')}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground bg-background/50 p-3 rounded-lg border">
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5" />
                <span>TDEE: {stats.tdee} kcal</span>
              </div>
              <div className="flex items-center gap-1.5 text-accent">
                <Flame className="h-3.5 w-3.5" />
                <span>+{stats.totalActivityBurn} kcal (Vận động)</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <span>Mục tiêu: {stats.weightGoal === 'lose' ? '-500' : stats.weightGoal === 'gain' ? '+500' : '0'} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t('calories.chart.macrosTitle')}</CardTitle>
            <CardDescription>{t('dashboard.summary')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            {isLoading && !mealData ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : macroData.length > 0 ? (
              <PieChart
                data={macroData}
                config={macroChartConfig}
                className="h-full w-full max-h-[250px]"
                showLegend={true}
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                  if (percent < 0.05) return null; // Ẩn label nếu phần trăm quá nhỏ
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                  return (
                    <text x={x} y={y} fill="#111827" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
                      {`${Number((percent * 100).toFixed(1))}%`}
                    </text>
                  );
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground text-sm py-10 italic">
                {t('calories.noMeals')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t('calories.title')}</CardTitle>
            <CardDescription>{t('calories.description')}</CardDescription>
          </div>
          <Select value={calorieFilter} onValueChange={setCalorieFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('common.filter.last7')}</SelectItem>
              <SelectItem value="30">{t('common.filter.last30')}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading && !mealData ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BarChart
              data={chartData}
              config={calorieChartConfig}
              yAxisWidth={40}
              className="h-64"
              showLegend={false}
              referenceLineValue={dailyTarget}
              referenceLineLabel={t('calories.goalLine')}
            />
          )}
        </CardContent>
      </Card>


      {/* AI Analysis Row (Full Width) */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t('calories.aiAnalysisTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center min-h-[120px] gap-2 text-primary animate-pulse py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">HealthSphere AI đang phân tích dinh dưỡng...</p>
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
                {aiAnalysis.status === 'good' ? t('calories.status.good') :
                  aiAnalysis.status === 'warning' ? t('calories.status.warning') : t('calories.status.bad')}
              </div>
              <div className="text-base leading-relaxed whitespace-pre-line font-medium text-foreground/90">
                {formatAiText(aiAnalysis.analysis)}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[120px] text-center text-muted-foreground space-y-2 py-10">
              <BrainCircuit className="h-10 w-10 opacity-20" />
              <p className="text-sm italic">{t('calories.aiNoData')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('calories.logTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LogMealWithAiDialog userId={user?.uid || ''} />
            <div className="bg-muted/30 rounded-xl p-4 border border-dashed flex items-center justify-center text-xs text-muted-foreground text-center">
              <p>Mẹo: Bạn có thể chụp ảnh món ăn để AI phân tích nhanh hơn.</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t('calories.manualSeparator')}</span></div>
          </div>
          {user && <AiMealChatLog userId={user.uid} />}

          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">{t('calories.dailyLogTitle')}</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : Object.keys(dailyMeals).length > 0 ? (
              <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
                {Object.entries(dailyMeals).sort((a, b) => b[0].localeCompare(a[0])).map(([date, meals]) => (
                  <div key={date}>
                    <h4 className="sticky top-0 mb-2 border-b bg-card py-2 font-semibold text-md">
                      {new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    <ul className="space-y-3 pt-2">
                      {meals.map((meal) => (
                        <li key={meal.id} className="flex items-start justify-between rounded-xl bg-muted/50 p-4 border">
                          <div className="space-y-1">
                            <p className="font-bold">{meal.name}</p>
                            <p className="text-xs capitalize text-muted-foreground">{t(`form.add_meal.type${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`)}</p>
                            {(meal.protein || meal.carbs || meal.fat || meal.fiber) && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {meal.protein !== undefined && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">P: {meal.protein}g</span>}
                                {meal.carbs !== undefined && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">C: {meal.carbs}g</span>}
                                {meal.fat !== undefined && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">F: {meal.fat}g</span>}
                                {meal.fiber !== undefined && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Fib: {meal.fiber}g</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-bold text-primary">{meal.calories}</p>
                              <p className="text-[10px] text-muted-foreground">kcal</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSelectedMeal(meal); setIsEditDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" />{t('form.common.edit')}</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedMeal(meal); setIsDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />{t('form.common.delete')}</DropdownMenuItem>
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
              <p className="py-8 text-center text-muted-foreground">{t('calories.noMeals')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('calories.editTitle')}</DialogTitle></DialogHeader>
          {selectedMeal && user && <EditMealForm userId={user.uid} meal={selectedMeal} onSuccess={() => setIsEditDialogOpen(false)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calories.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('calories.deleteDescription', { name: selectedMeal?.name || '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal} className="bg-destructive hover:bg-destructive/90">{t('calories.deleteConfirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
