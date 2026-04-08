
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '../ui/label';
import { useTranslation } from '@/context/LanguageContext';

const FormSchema = z.object({
  bpm: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số.' })
    .min(30, { message: 'Nhịp tim phải ít nhất 30 bpm.' })
    .max(250, { message: 'Nhịp tim không hợp lệ.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Vui lòng nhập ngày hợp lệ.",
  }),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddHeartRateFormProps {
  userId: string;
  onSuccess?: () => void;
}

export default function AddHeartRateForm({ userId, onSuccess }: AddHeartRateFormProps) {
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
      bpm: undefined,
    }
  });

  const onSubmit = async (data: FormValues) => {
    const hrData = {
      userId: userId,
      bpm: data.bpm,
      date: data.date,
      timestamp: new Date().toISOString(),
    };

    try {
      // One entry per day using date as ID
      const hrDocRef = doc(firestore, `users/${userId}/heart_rates`, data.date);
      await setDoc(hrDocRef, hrData, { merge: true });

      toast({
        title: t('form.common.success'),
        description: t('form.add_heart_rate.success', { date: data.date }),
      });
      reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: `users/${userId}/heart_rates/${data.date}`,
          operation: 'write',
          requestResourceData: hrData,
        })
      );
      toast({
        variant: 'destructive',
        title: t('form.common.error'),
        description: t('form.add_heart_rate.error'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="grid gap-1.5">
        <Label htmlFor="hr-date">{t('form.common.date')}</Label>
        <Input
          id="hr-date"
          type="date"
          {...register('date')}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bpm">{t('form.add_heart_rate.title')}</Label>
        <Input
          id="bpm"
          type="number"
          placeholder={t('form.add_heart_rate.placeholder')}
          {...register('bpm')}
        />
        {errors.bpm && (
          <p className="mt-1 text-sm text-destructive">{errors.bpm.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('form.add_heart_rate.saving') : t('form.add_heart_rate.save')}
      </Button>
    </form>
  );
}
