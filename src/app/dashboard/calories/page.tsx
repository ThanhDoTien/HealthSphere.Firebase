
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
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { PieChart } from '@/components/ui/pie-chart';
import { type ChartConfig } from '@/components/ui/chart';
import { Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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

export default function CaloriesPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [calorieFilter, setCalorieFilter] = useState('30');
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const calorieChartConfig = useMemo(() => ({
    calories: {
      label: t('calories.chart.calories'),
      color: 'hsl(var(--accent))',
    },
  }), [t]) satisfies ChartConfig;

  const macroChartConfig = useMemo(() => ({
    protein: { label: t('calories.chart.protein'), color: '#3b82f6' }, // Blue
    carbs: { label: t('calories.chart.carbs'), color: '#f97316' },  // Orange
    fat: { label: t('calories.chart.fat'), color: '#eab308' },    // Yellow
    fiber: { label: t('calories.chart.fiber'), color: '#22c55e' },  // Green
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

  const { data: mealData, isLoading: mealLoading } = useCollection<Meal>(
    mealQuery
  );

  const chartData = useMemo(() => {
    if (!mealData) return [];

    const dailyCalories: { [date: string]: number } = {};

    mealData.forEach((meal) => {
      const date = meal.date;
      if (dailyCalories[date]) {
        dailyCalories[date] += meal.calories;
      } else {
        dailyCalories[date] = meal.calories;
      }
    });

    const limitCount = parseInt(calorieFilter);

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
  }, [mealData, calorieFilter]);

  const macroData = useMemo(() => {
    if (!mealData || !today) return [];
    
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;

    mealData.filter(m => m.date === today).forEach(meal => {
      protein += meal.protein || 0;
      carbs += meal.carbs || 0;
      fat += meal.fat || 0;
      fiber += meal.fiber || 0;
    });

    const total = protein + carbs + fat + fiber;
    if (total === 0) return [];

    return [
      { name: 'protein', value: protein, fill: '#3b82f6' },
      { name: 'carbs', value: carbs, fill: '#f97316' },
      { name: 'fat', value: fat, fill: '#eab308' },
      { name: 'fiber', value: fiber, fill: '#22c55e' },
    ];
  }, [mealData, today]);

  const dailyMeals = useMemo(() => {
    if (!mealData) return {};
    const groupedMeals: { [date: string]: WithId<Meal>[] } = {};

    mealData.forEach((meal) => {
      const date = meal.date;
      if (groupedMeals[date]) {
        groupedMeals[date].push(meal);
      } else {
        groupedMeals[date] = [meal];
      }
    });
    return groupedMeals;
  }, [mealData]);

  const handleDeleteMeal = () => {
    if (!selectedMeal || !user) return;
    const mealDocRef = doc(
      firestore,
      `users/${user.uid}/meals/${selectedMeal.id}`
    );

    deleteDoc(mealDocRef)
      .then(() => {
        toast({
          title: t('form.common.success'),
          description: t('calories.deleteSuccess'),
        });
      })
      .catch((error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: mealDocRef.path,
            operation: 'delete',
          })
        );
        toast({
          variant: 'destructive',
          title: t('form.common.error'),
          description: t('calories.deleteError'),
        });
      })
      .finally(() => {
        setIsDeleteDialogOpen(false);
        setSelectedMeal(null);
      });
  };

  const isLoading = userLoading || mealLoading;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t('calories.title')}</CardTitle>
              <CardDescription>
                {t('calories.description')}
              </CardDescription>
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
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('calories.chart.macrosTitle')}</CardTitle>
            <CardDescription>{t('dashboard.summary')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-64">
            {isLoading && !mealData ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : macroData.length > 0 ? (
              <PieChart
                data={macroData}
                config={macroChartConfig}
                className="h-full w-full"
                showLegend={true}
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
        <CardHeader>
           <CardTitle>{t('calories.logTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <LogMealWithAiDialog userId={user?.uid || ''} />
               <div className="bg-muted/30 rounded-xl p-4 border border-dashed flex items-center justify-center text-xs text-muted-foreground text-center">
                  <p>Mẹo: Bạn có thể chụp ảnh món ăn để AI phân tích nhanh hơn.</p>
               </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('calories.manualSeparator')}
                </span>
              </div>
            </div>

            {user && <AiMealChatLog userId={user.uid} />}
          </div>

          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">{t('calories.dailyLogTitle')}</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(dailyMeals).length > 0 ? (
              <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
                {Object.entries(dailyMeals).map(([date, meals]) => (
                  <div key={date}>
                    <h4 className="sticky top-0 mb-2 border-b bg-card py-2 font-semibold text-md">
                      {new Date(date + 'T00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h4>
                    <ul className="space-y-3 pt-2">
                      {meals.map((meal) => (
                        <li
                          key={meal.id}
                          className="flex items-start justify-between rounded-xl bg-muted/50 p-4 border"
                        >
                          <div className="space-y-1">
                            <p className="font-bold">{meal.name}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {t(`form.add_meal.type${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`)}
                            </p>
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
                              <p className="font-bold text-primary">
                                {meal.calories}
                              </p>
                              <p className="text-[10px] text-muted-foreground">kcal</p>
                            </div>
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
                                    setSelectedMeal(meal);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('form.common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedMeal(meal);
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
                {t('calories.noMeals')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('calories.editTitle')}</DialogTitle>
          </DialogHeader>
          {selectedMeal && user && (
            <EditMealForm
              userId={user.uid}
              meal={selectedMeal}
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
            <AlertDialogTitle>{t('calories.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('calories.deleteDescription', { name: selectedMeal?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeal}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('calories.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
