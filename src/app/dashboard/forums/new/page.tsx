'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useFirestore, useUser } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const FormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
});

type FormValues = z.infer<typeof FormSchema>;

export default function NewForumPostPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, userProfile } = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: FormValues) => {
    if (!user || !userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to post.' });
      return;
    }

    const postsRef = collection(firestore, 'forums');
    const newPostData = {
      ...data,
      userId: user.uid,
      authorName: userProfile.name,
      authorAvatarUrl: user.photoURL || `https://avatar.vercel.sh/${user.uid}.svg`,
      createdAt: new Date().toISOString(),
    };

    addDoc(postsRef, newPostData)
      .then((docRef) => {
        toast({
          title: 'Success',
          description: 'Your post has been published.',
        });
        router.push('/dashboard/forums');
      })
      .catch((error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: postsRef.path,
            operation: 'create',
            requestResourceData: newPostData,
          })
        );
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not create post. Please try again.',
        });
      });
  };

  return (
    <div className="p-4 sm:p-6">
       <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/forums">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forums
        </Link>
      </Button>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Create a New Post</CardTitle>
            <CardDescription>Share your thoughts with the community.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" type="text" placeholder="A catchy title for your post" {...register('title')} />
              {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" placeholder="Write your post here..." {...register('content')} rows={10} />
              {errors.content && <p className="mt-1 text-sm text-destructive">{errors.content.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
