'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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

interface AddActivityFormProps {
  userId: string;
}

export default function AddActivityForm({ userId }: AddActivityFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      name: '',
      duration: undefined,
      caloriesBurned: undefined,
    },
  });

  const onSubmit = (data: FormValues) => {
    const activityLogRef = collection(firestore, `users/${userId}/activities`);
    const activityLogData = {
      userId,
      ...data,
    };

    addDoc(activityLogRef, activityLogData)
      .then(() => {
        toast({
          title: t('form.common.success'),
          description: t('form.add_activity.success', { name: data.name }),
        });
        reset({
            ...data, // keep the date
            name: '',
            duration: undefined,
            caloriesBurned: undefined
        });
      })
      .catch((error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: activityLogRef.path,
            operation: 'create',
            requestResourceData: activityLogData,
          })
        );
        toast({
          variant: 'destructive',
          title: t('form.common.error'),
          description: t('form.add_activity.error'),
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
        {isSubmitting ? t('form.add_activity.loadingButton') : t('form.add_activity.button')}
      </Button>
    </form>
  );
}
