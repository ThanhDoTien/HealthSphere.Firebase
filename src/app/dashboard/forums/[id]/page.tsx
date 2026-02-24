'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  collection,
  doc,
  query,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Send } from 'lucide-react';

import { useDoc, WithId } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type ForumPost = {
  title: string;
  content: string;
  authorName: string;
  authorAvatarUrl: string;
  createdAt: string;
  userId: string;
};

type ForumReply = {
  postId: string;
  content: string;
  authorName: string;
  authorAvatarUrl: string;
  createdAt: string;
  userId: string;
};

const ReplyFormSchema = z.object({
  content: z.string().min(1, 'Reply cannot be empty.'),
});
type ReplyFormValues = z.infer<typeof ReplyFormSchema>;

export default function ForumPostPage() {
  const params = useParams();
  const postId = params.id as string;

  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const postRef = useMemoFirebase(
    () => (postId ? doc(firestore, 'forums', postId) : null),
    [firestore, postId]
  );
  const repliesQuery = useMemoFirebase(
    () => (postId ? query(
      collection(firestore, 'forums', postId, 'replies'),
      orderBy('createdAt', 'asc')
    ) : null),
    [firestore, postId]
  );

  const { data: post, isLoading: isPostLoading } = useDoc<ForumPost>(postRef);
  const { data: replies, isLoading: areRepliesLoading } =
    useCollection<ForumReply>(repliesQuery);
    
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyFormValues>({
    resolver: zodResolver(ReplyFormSchema),
  });

  const onReplySubmit = (data: ReplyFormValues) => {
    if (!user || !userProfile || !postId) return;

    const repliesRef = collection(firestore, `forums/${postId}/replies`);
    const newReplyData = {
      ...data,
      postId: postId,
      userId: user.uid,
      authorName: userProfile.name,
      authorAvatarUrl: user.photoURL || `https://avatar.vercel.sh/${user.uid}.svg`,
      createdAt: new Date().toISOString(),
    };
    
    addDoc(repliesRef, newReplyData)
      .then(() => {
        toast({ title: 'Success', description: 'Your reply has been posted.' });
        reset();
      })
      .catch((error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: repliesRef.path,
            operation: 'create',
            requestResourceData: newReplyData,
          })
        );
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not post your reply.',
        });
      });
  };

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };
  
  if (isPostLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Post not found</h2>
        <Button variant="outline" asChild>
          <Link href="/dashboard/forums">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forums
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/forums">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forums
        </Link>
      </Button>
      
      {/* Post */}
      <Card className="mb-6">
        <CardHeader>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{post.title}</h1>
           <div className="flex items-center gap-3 pt-2 text-sm text-muted-foreground">
            <Image
              src={post.authorAvatarUrl}
              alt={post.authorName}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span>
              By {post.authorName} on {formatTimestamp(post.createdAt)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
            {post.content}
          </div>
        </CardContent>
      </Card>
      
      {/* Replies */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Replies ({replies?.length || 0})</h2>
        
        {areRepliesLoading ? (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : (
            replies && replies.length > 0 ? (
                 <ul className="space-y-4">
                    {replies.map(reply => (
                        <li key={reply.id} className="flex items-start gap-4">
                             <Image
                                src={reply.authorAvatarUrl}
                                alt={reply.authorName}
                                width={40}
                                height={40}
                                className="rounded-full mt-1"
                            />
                            <div className="flex-1 rounded-lg border bg-card p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold">{reply.authorName}</p>
                                    <p className="text-xs text-muted-foreground">{formatTimestamp(reply.createdAt)}</p>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Be the first to reply!</p>
            )
        )}
        
        {/* Reply Form */}
        {user && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Post a Reply</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onReplySubmit)} className="flex items-start gap-4">
                <Image
                    src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.svg`}
                    alt={userProfile?.name || 'You'}
                    width={40}
                    height={40}
                    className="rounded-full mt-1"
                />
                <div className="flex-1 space-y-2">
                     <Textarea 
                        placeholder="Write your reply here..." 
                        {...register('content')} 
                        className="w-full"
                    />
                    {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                    </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
