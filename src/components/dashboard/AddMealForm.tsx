
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useTranslation } from '@/context/LanguageContext';

const FormSchema = z.object({
  name: z.string().min(1, 'Meal name is required.'),
  calories: z.coerce.number().min(0, 'Calories must be a positive number.'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddMealFormProps {
  userId: string;
}

const BACKEND_URL = "https://healthsphere-8kji.onrender.com";

export default function AddMealForm({ userId }: AddMealFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      mealType: 'breakfast',
      name: '',
      calories: undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    const mealLogRef = collection(firestore, `users/${userId}/meals`);
    const mealLogData = {
      userId,
      ...data,
    };

    try {
      await addDoc(mealLogRef, mealLogData);
      
      // Đồng bộ sang Middleware Backend với định dạng JSON chuẩn
      const syncPayload = {
        id: 0,
        userId: userId, 
        mealName: data.name,
        calories: data.calories,
        protein: 0,
        carbs: 0,
        fat: 0,
        imageUrl: "",
        type: data.mealType,
        createdAt: new Date().toISOString()
      };

      fetch(`${BACKEND_URL}/api/MealLogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload),
      }).catch(err => console.error("Sync error:", err));

      toast({
        title: t('form.common.success'),
        description: t('form.add_meal.success', { name: data.name }),
      });
      reset({
        ...data,
        name: '',
        calories: undefined
      });
    } catch (error: any) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: mealLogRef.path,
          operation: 'create',
          requestResourceData: mealLogData,
        })
      );
      toast({
        variant: 'destructive',
        title: t('form.common.error'),
        description: t('form.add_meal.error'),
      });
    }
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
          <Label htmlFor="name">{t('form.add_meal.nameLabel')}</Label>
          <Input id="name" type="text" placeholder={t('form.add_meal.namePlaceholder')} {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="calories">{t('form.add_meal.caloriesLabel')}</Label>
          <Input id="calories" type="number" placeholder={t('form.add_meal.caloriesPlaceholder')} {...register('calories')} />
          {errors.calories && <p className="mt-1 text-sm text-destructive">{errors.calories.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="mealType">{t('form.add_meal.typeLabel')}</Label>
          <Controller
            control={control}
            name="mealType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.add_meal.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{t('form.add_meal.typeBreakfast')}</SelectItem>
                  <SelectItem value="lunch">{t('form.add_meal.typeLunch')}</SelectItem>
                  <SelectItem value="dinner">{t('form.add_meal.typeDinner')}</SelectItem>
                  <SelectItem value="snack">{t('form.add_meal.typeSnack')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.mealType && <p className="mt-1 text-sm text-destructive">{errors.mealType.message}</p>}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('form.add_meal.loadingButton') : t('form.add_meal.button')}
      </Button>
    </form>
  );
}
