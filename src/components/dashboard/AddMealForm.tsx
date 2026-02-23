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

export default function AddMealForm({ userId }: AddMealFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

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

  const onSubmit = (data: FormValues) => {
    const mealLogRef = collection(firestore, `users/${userId}/meals`);
    const mealLogData = {
      userId,
      ...data,
    };

    addDoc(mealLogRef, mealLogData)
      .then(() => {
        toast({
          title: 'Success',
          description: `Meal "${data.name}" has been logged.`,
        });
        reset({
            ...data, // keep the date and mealtype
            name: '',
            calories: undefined
        });
      })
      .catch((error) => {
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
          title: 'Error',
          description: 'Could not log your meal. Please try again.',
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Meal Name</Label>
          <Input id="name" type="text" placeholder="e.g. Apple" {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="calories">Calories</Label>
          <Input id="calories" type="number" placeholder="e.g. 95" {...register('calories')} />
          {errors.calories && <p className="mt-1 text-sm text-destructive">{errors.calories.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="mealType">Meal Type</Label>
          <Controller
            control={control}
            name="mealType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.mealType && <p className="mt-1 text-sm text-destructive">{errors.mealType.message}</p>}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Adding...' : 'Add Meal'}
      </Button>
    </form>
  );
}
