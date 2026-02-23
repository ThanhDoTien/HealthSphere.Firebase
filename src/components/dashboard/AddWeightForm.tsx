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
  });

  const onSubmit = async (data: FormValues) => {
    const weightLogRef = collection(firestore, `users/${userId}/weights`);
    const weightLogData = {
      userId: userId,
      weight: data.weight,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    addDoc(weightLogRef, weightLogData)
      .then(() => {
        toast({
          title: 'Success',
          description: 'Your weight has been logged.',
        });
        reset({ weight: undefined });
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="grid flex-1 gap-1.5">
        <Label htmlFor="weight">Log Today&apos;s Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          placeholder="e.g. 75.5"
          {...register('weight')}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
      {errors.weight && (
        <p className="mt-1 text-sm text-destructive">{errors.weight.message}</p>
      )}
    </form>
  );
}
