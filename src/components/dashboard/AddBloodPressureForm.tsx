
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Label } from '../ui/label';
import { useTranslation } from '@/context/LanguageContext';

const FormSchema = z.object({
  systolic: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số.' })
    .min(60, { message: 'Tâm thu phải ít nhất 60 mmHg.' })
    .max(250, { message: 'Chỉ số không hợp lệ.' }),
  diastolic: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số.' })
    .min(40, { message: 'Tâm trương phải ít nhất 40 mmHg.' })
    .max(150, { message: 'Chỉ số không hợp lệ.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Vui lòng nhập ngày hợp lệ.",
  }),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddBloodPressureFormProps {
  userId: string;
  onSuccess?: () => void;
}

export default function AddBloodPressureForm({ userId, onSuccess }: AddBloodPressureFormProps) {
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
      systolic: undefined,
      diastolic: undefined,
    }
  });

  const onSubmit = async (data: FormValues) => {
    const bpData = {
      userId: userId,
      systolic: data.systolic,
      diastolic: data.diastolic,
      date: data.date,
      timestamp: new Date().toISOString(),
    };

    try {
      const bpDocRef = doc(firestore, `users/${userId}/blood_pressures`, data.date);
      await setDoc(bpDocRef, bpData, { merge: true });

      toast({
        title: t('form.common.success'),
        description: t('form.add_blood_pressure.success', { date: data.date }),
      });
      reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: `users/${userId}/blood_pressures/${data.date}`,
          operation: 'write',
          requestResourceData: bpData,
        })
      );
      toast({
        variant: 'destructive',
        title: t('form.common.error'),
        description: t('form.add_blood_pressure.error'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="grid gap-1.5">
        <Label htmlFor="bp-date">{t('form.common.date')}</Label>
        <Input
          id="bp-date"
          type="date"
          {...register('date')}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="systolic">{t('form.add_blood_pressure.systolic')}</Label>
          <Input
            id="systolic"
            type="number"
            placeholder="120"
            {...register('systolic')}
          />
          {errors.systolic && (
            <p className="mt-1 text-sm text-destructive">{errors.systolic.message}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="diastolic">{t('form.add_blood_pressure.diastolic')}</Label>
          <Input
            id="diastolic"
            type="number"
            placeholder="80"
            {...register('diastolic')}
          />
          {errors.diastolic && (
            <p className="mt-1 text-sm text-destructive">{errors.diastolic.message}</p>
          )}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('form.add_blood_pressure.saving') : t('form.add_blood_pressure.save')}
      </Button>
    </form>
  );
}
