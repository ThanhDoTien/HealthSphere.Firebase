'use client';

import { useMemo } from 'react';
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
import { collection, query, orderBy } from 'firebase/firestore';
import { BarChart } from '@/components/ui/bar-chart';
import { type ChartConfig } from '@/components/ui/chart';
import AddActivityForm from '@/components/dashboard/AddActivityForm';
import { Loader2 } from 'lucide-react';
import { WithId } from '@/firebase/firestore/use-collection';
import { useTranslation } from '@/context/LanguageContext';

type Activity = {
  name: string;
  duration: number;
  caloriesBurned: number;
  date: string;
  userId: string;
};

export default function ActivityPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();

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

  const { data: activityData, isLoading: activityLoading } = useCollection<Activity>(
    activityQuery
  );

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
  }, [activityData]);

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

  const isLoading = userLoading || activityLoading;

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('activity.title')}</CardTitle>
          <CardDescription>
            {t('activity.description')}
          </CardDescription>
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
            {user && <AddActivityForm userId={user.uid} />}
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
                          <p className="font-semibold">
                            {activity.caloriesBurned} kcal
                          </p>
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
    </div>
  );
}
