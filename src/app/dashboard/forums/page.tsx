'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { Plus } from 'lucide-react';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

type ForumPost = {
  title: string;
  authorName: string;
  authorAvatarUrl: string;
  createdAt: string;
  userId: string;
};

export default function ForumsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const postsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'forums'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<ForumPost>(postsQuery);

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{t('forums.title')}</CardTitle>
            <CardDescription>
              {t('forums.description')}
            </CardDescription>
          </div>
          {user && (
            <Button asChild>
              <Link href="/dashboard/forums/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('forums.newPost')}
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">{t('forums.noPosts')}</p>
              <p className="text-sm text-muted-foreground">
                {t('forums.beFirst')}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/dashboard/forums/${post.id}`}
                    className="block rounded-lg border bg-card p-4 transition-all hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-4">
                       <Image
                        src={post.authorAvatarUrl}
                        alt={post.authorName}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{post.title}</h3>
                        <div className="text-sm text-muted-foreground">
                          <p>
                            {t('forums.authorBy', { author: post.authorName, date: formatTimestamp(post.createdAt) })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
