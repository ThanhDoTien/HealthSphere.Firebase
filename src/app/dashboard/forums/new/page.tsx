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
import { useTranslation } from '@/context/LanguageContext';

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
  const { t } = useTranslation();

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
      toast({ variant: 'destructive', title: t('form.common.error'), description: t('forum_new.loginError') });
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
          title: t('form.common.success'),
          description: t('forum_new.publishSuccess'),
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
          title: t('form.common.error'),
          description: t('forum_new.publishError'),
        });
      });
  };

  return (
    <div className="p-4 sm:p-6">
       <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/forums">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('forum_post.back')}
        </Link>
      </Button>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('forum_new.title')}</CardTitle>
            <CardDescription>{t('forum_new.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">{t('forum_new.postTitleLabel')}</Label>
              <Input id="title" type="text" placeholder={t('forum_new.postTitlePlaceholder')} {...register('title')} />
              {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="content">{t('forum_new.contentLabel')}</Label>
              <Textarea id="content" placeholder={t('forum_new.contentPlaceholder')} {...register('content')} rows={10} />
              {errors.content && <p className="mt-1 text-sm text-destructive">{errors.content.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t('forum_new.publishingButton') : t('forum_new.publishButton')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
