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
import AddSleepForm from '@/components/dashboard/AddSleepForm';
import { Loader2 } from 'lucide-react';
import { WithId } from '@/firebase/firestore/use-collection';

const sleepChartConfig = {
  duration: {
    label: 'Sleep (hours)',
    color: '#8A00FF',
  },
} satisfies ChartConfig;

type Sleep = {
  duration: number;
  date: string;
  userId: string;
};

export default function SleepPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

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

  const chartData = useMemo(() => {
    if (!sleepData) return [];

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
      .slice(-30);
  }, [sleepData]);

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
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sleep Tracking</CardTitle>
          <CardDescription>
            Log your sleep and track your daily hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <div>
            <h3 className="mb-4 text-lg font-medium">Log Sleep</h3>
            {user && <AddSleepForm userId={user.uid} />}
          </div>

          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">Daily Sleep Log</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : Object.keys(dailySleep).length > 0 ? (
              <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
                {Object.entries(dailySleep).map(([date, sleeps]) => (
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
                            <p className="font-medium">Sleep</p>
                          </div>
                          <p className="font-semibold">
                            {sleep.duration} hours
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                No sleep logged yet. Add one above to get started!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
