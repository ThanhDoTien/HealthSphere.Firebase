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
import { collection, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import { Loader2, Zap, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activityFilter, setActivityFilter] = useState('30');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<WithId<Activity> | null>(null);

  const activityChartConfig = useMemo(() => ({
    calories: {
      label: t('activity.chart.calories'),
      color: 'hsl(var(--accent))',
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

  const { data: activityData, isLoading: activityLoading } = useCollection<Activity>(
    activityQuery
  );

  const { data: latestWeightData } = useCollection<WeightLog>(weightQuery);

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

  const isLoading = userLoading || activityLoading;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">{t('activity.baseBurn.title')}</CardTitle>
            <CardDescription>{t('activity.baseBurn.description')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">{t('activity.baseBurn.bmr')}</p>
              <p className="mt-1 text-2xl font-bold">{Math.round(baseBurn.bmr)} <span className="text-sm font-normal">kcal/day</span></p>
            </div>
            <div className="rounded-lg border border-accent bg-card p-4 shadow-sm">
              <p className="text-sm font-medium text-accent">{t('activity.baseBurn.tdee')}</p>
              <p className="mt-1 text-3xl font-bold text-accent">{Math.round(baseBurn.tdee)} <span className="text-sm font-normal text-foreground">kcal/day</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            />
          )}
          <div>
            <h3 className="mb-4 text-lg font-medium">{t('activity.logTitle')}</h3>
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
                {Object.entries(dailyActivities).map(([date, activities]) => (
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
    </div>
  );
}
