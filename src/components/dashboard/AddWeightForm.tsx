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

const FormSchema = z.object({
  weight: z.coerce
    .number({ invalid_type_error: 'Please enter a number.' })
    .min(20, { message: 'Weight must be a realistic number.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date.",
  }),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddWeightFormProps {
  userId: string;
}

export default function AddWeightForm({ userId }: AddWeightFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

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

  const onSubmit = (data: FormValues) => {
    const weightLogRef = collection(firestore, `users/${userId}/weights`);
    const weightLogData = {
      userId: userId,
      weight: data.weight,
      date: data.date,
    };

    addDoc(weightLogRef, weightLogData)
      .then(() => {
        toast({
          title: 'Success',
          description: `Weight for ${data.date} has been logged.`,
        });
        reset();
      })
      .catch((error) => {
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
          title: 'Error',
          description: 'Could not log your weight. Please try again.',
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="date">Date</Label>
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
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          placeholder="e.g. 75.5"
          {...register('weight')}
        />
        {errors.weight && (
          <p className="mt-1 text-sm text-destructive">{errors.weight.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
