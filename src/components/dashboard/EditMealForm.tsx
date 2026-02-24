'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';

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
import { WithId } from '@/firebase/firestore/use-collection';
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

interface EditMealFormProps {
  userId: string;
  meal: WithId<{
    name: string;
    calories: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
  }>;
  onSuccess: () => void;
}

export default function EditMealForm({ userId, meal, onSuccess }: EditMealFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: meal.name,
      calories: meal.calories,
      mealType: meal.mealType,
      date: meal.date,
    },
  });

  const onSubmit = (data: FormValues) => {
    const mealDocRef = doc(firestore, `users/${userId}/meals/${meal.id}`);
    
    // We only pass the fields that are editable.
    const mealUpdateData = {
      ...data,
    };

    updateDoc(mealDocRef, mealUpdateData)
      .then(() => {
        toast({
          title: t('form.common.success'),
          description: t('form.edit_meal.success', { name: data.name }),
        });
        onSuccess();
      })
      .catch(() => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: mealDocRef.path,
            operation: 'update',
            requestResourceData: mealUpdateData,
          })
        );
        toast({
          variant: 'destructive',
          title: t('form.common.error'),
          description: t('form.edit_meal.error'),
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
        {isSubmitting ? t('profile.savingButton') : t('profile.saveButton')}
      </Button>
    </form>
  );
}
