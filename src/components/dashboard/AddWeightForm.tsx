
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
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
  weight: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số.' })
    .min(20, { message: 'Cân nặng phải là một con số hợp lý.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Vui lòng nhập ngày hợp lệ.",
  }),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddWeightFormProps {
  userId: string;
}

export default function AddWeightForm({ userId }: AddWeightFormProps) {
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
      weight: undefined,
    }
  });

  const onSubmit = async (data: FormValues) => {
    const weightLogRef = collection(firestore, `users/${userId}/weights`);
    const weightLogData = {
      userId: userId,
      weight: data.weight,
      date: data.date,
    };

    try {
      // 1. Lưu vào nhật ký cân nặng
      await addDoc(weightLogRef, weightLogData);

      // 2. Đồng bộ cập nhật cân nặng vào Hồ sơ người dùng
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, { weight: data.weight });

      toast({
        title: t('form.common.success'),
        description: t('form.add_weight.success', { date: data.date }),
      });
      reset();
    } catch (error: any) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: weightLogRef.path,
          operation: 'create',
          requestResourceData: weightLogData,
        })
      );
      toast({
        variant: 'destructive',
        title: t('form.common.error'),
        description: t('form.add_weight.error'),
      });
    }
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
        <Label htmlFor="weight">{t('form.add_weight.title')}</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          placeholder={t('form.add_weight.placeholder')}
          {...register('weight')}
        />
        {errors.weight && (
          <p className="mt-1 text-sm text-destructive">{errors.weight.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? t('form.add_weight.saving') : t('form.add_weight.save')}
      </Button>
    </form>
  );
}
