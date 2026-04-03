
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { WithId } from '@/firebase/firestore/use-collection';
import { useTranslation } from '@/context/LanguageContext';

const FormSchema = z.object({
  name: z.string().min(1, 'Activity name is required.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  caloriesBurned: z.coerce.number().min(0, 'Calories must be a positive number.'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
});

type FormValues = z.infer<typeof FormSchema>;

interface EditActivityFormProps {
  userId: string;
  activity: WithId<{
    name: string;
    duration: number;
    caloriesBurned: number;
    date: string;
  }>;
  onSuccess: () => void;
}

export default function EditActivityForm({ userId, activity, onSuccess }: EditActivityFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: activity.name,
      duration: activity.duration,
      caloriesBurned: activity.caloriesBurned,
      date: activity.date,
    },
  });

  const onSubmit = (data: FormValues) => {
    const activityDocRef = doc(firestore, `users/${userId}/activities/${activity.id}`);

    const activityUpdateData = {
      ...data,
    };

    updateDoc(activityDocRef, activityUpdateData)
      .then(() => {
        toast({
          title: t('form.common.success'),
          description: t('form.edit_activity.success', { name: data.name }),
        });
        onSuccess();
      })
      .catch(() => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: activityDocRef.path,
            operation: 'update',
            requestResourceData: activityUpdateData,
          })
        );
        toast({
          variant: 'destructive',
          title: t('form.common.error'),
          description: t('form.edit_activity.error'),
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="date">{t('form.common.date')}</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="name">{t('form.add_activity.nameLabel')}</Label>
          <Input id="name" type="text" placeholder={t('form.add_activity.namePlaceholder')} {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="duration">{t('form.add_activity.durationLabel')}</Label>
          <Input id="duration" type="number" placeholder={t('form.add_activity.durationPlaceholder')} {...register('duration')} />
          {errors.duration && <p className="mt-1 text-sm text-destructive">{errors.duration.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="caloriesBurned">{t('form.add_activity.caloriesLabel')}</Label>
          <Input id="caloriesBurned" type="number" placeholder={t('form.add_activity.caloriesPlaceholder')} {...register('caloriesBurned')} />
          {errors.caloriesBurned && <p className="mt-1 text-sm text-destructive">{errors.caloriesBurned.message}</p>}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('profile.savingButton') : t('profile.saveButton')}
      </Button>
    </form>
  );
}
