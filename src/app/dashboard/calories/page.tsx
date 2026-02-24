'use client';

import { useMemo, useState } from 'react';
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
import { type ChartConfig } from '@/components/ui/chart';
import AddMealForm from '@/components/dashboard/AddMealForm';
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

const calorieChartConfig = {
  calories: {
    label: 'Calories',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

type Meal = {
  name: string;
  calories: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  userId: string;
};

export default function CaloriesPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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
      .slice(-30);
  }, [mealData]);

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
          title: 'Success',
          description: 'Meal deleted successfully.',
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
          title: 'Error',
          description: 'Could not delete meal. Please try again.',
        });
      })
      .finally(() => {
        setIsDeleteDialogOpen(false);
        setSelectedMeal(null);
      });
  };

  const isLoading = userLoading || mealLoading;

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Calorie Intake</CardTitle>
          <CardDescription>
            Log your meals and track your daily calorie consumption.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Log a Meal</h3>
            {user && <LogMealWithAiDialog userId={user.uid} />}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or add manually
                </span>
              </div>
            </div>
            {user && <AddMealForm userId={user.uid} />}
          </div>

          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">Daily Meal Log</h3>
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
                    <ul className="space-y-2 pt-2">
                      {meals.map((meal) => (
                        <li
                          key={meal.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div>
                            <p className="font-medium">{meal.name}</p>
                            <p className="text-sm capitalize text-muted-foreground">
                              {meal.mealType}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-semibold">
                              {meal.calories} kcal
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
                                    setSelectedMeal(meal);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedMeal(meal);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
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
                No meals logged yet. Add one above to get started!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              meal log for &quot;{selectedMeal?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeal}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
