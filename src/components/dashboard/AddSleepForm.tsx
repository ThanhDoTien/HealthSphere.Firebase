
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  addDoc,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '../ui/label';
import { useTranslation } from '@/context/LanguageContext';

const FormSchema = z.object({
  duration: z.coerce
    .number({ invalid_type_error: 'Please enter a number.' })
    .min(0, { message: 'Thời lượng ngủ không thể là số âm.' })
    .max(24, { message: 'Thời lượng ngủ không thể vượt quá 24 giờ.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date.",
  }),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddSleepFormProps {
  userId: string;
}

export default function AddSleepForm({ userId }: AddSleepFormProps) {
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
      duration: undefined,
    }
  });

  const onSubmit = (data: FormValues) => {
    const sleepLogRef = collection(firestore, `users/${userId}/sleep`);
    const sleepLogData = {
      userId: userId,
      duration: data.duration,
      date: data.date,
    };

    addDoc(sleepLogRef, sleepLogData)
      .then(() => {
        toast({
          title: t('form.common.success'),
          description: t('form.add_sleep.success', { date: data.date }),
        });
        reset();
      })
      .catch((error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: sleepLogRef.path,
            operation: 'create',
            requestResourceData: sleepLogData,
          })
        );
        toast({
          variant: 'destructive',
          title: t('form.common.error'),
          description: t('form.add_sleep.error'),
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="date">{t('form.common.date')}</Label>
        <Input
          id="date"
          type="date"
          {...register('date')}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="duration">{t('form.add_sleep.title')}</Label>
        <Input
          id="duration"
          type="number"
          step="0.1"
          min="0"
          max="24"
          placeholder={t('form.add_sleep.placeholder')}
          {...register('duration')}
        />
        {errors.duration && (
          <p className="mt-1 text-sm text-destructive">{errors.duration.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? t('form.add_sleep.saving') : t('form.add_sleep.save')}
      </Button>
    </form>
  );
}
