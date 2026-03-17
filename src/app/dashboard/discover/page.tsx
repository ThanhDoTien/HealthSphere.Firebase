'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useTranslation } from '@/context/LanguageContext';
import { discoverArticles, type DiscoverArticlesOutput } from '@/ai/flows/discover-articles-flow';
import { Loader2, Search, ExternalLink, RefreshCw, BookOpen, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Badge component is used but might not be defined in ShadCN yet, let's create a local one
function SimpleBadge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 ${className}`}>
      {children}
    </span>
  );
}

export default function DiscoverPage() {
  const { userProfile, loading: userLoading } = useUser();
  const { t, locale } = useTranslation();
  const [articles, setArticles] = useState<DiscoverArticlesOutput['articles']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    if (!userProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await discoverArticles({
        goal: userProfile.goal,
        language: locale,
      });
      setArticles(result.articles);
    } catch (err: any) {
      setError(err.message || 'Error fetching articles');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, locale]);

  useEffect(() => {
    if (userProfile && articles.length === 0 && !isLoading) {
      fetchArticles();
    }
  }, [userProfile, fetchArticles, articles.length, isLoading]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            {t('discover.title') || 'Khám phá Kiến thức'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('discover.description') || 'Bài viết và tin tức sức khỏe chọn lọc cho mục tiêu của bạn.'}
          </p>
        </div>
        <Button onClick={fetchArticles} disabled={isLoading} variant="outline" className="shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('discover.refresh') || 'Làm mới tin tức'}
        </Button>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">
            HealthSphere AI đang tìm kiếm những bài viết tốt nhất cho bạn...
          </p>
        </div>
      ) : error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={fetchArticles} variant="secondary">Thử lại</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {articles.map((article, idx) => (
            <Card key={idx} className="flex flex-col h-full hover:shadow-md transition-shadow border-primary/10">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2 mb-2">
                   <SimpleBadge>{article.category}</SimpleBadge>
                   <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold">
                     <Globe className="h-3 w-3" /> {article.source}
                   </span>
                </div>
                <CardTitle className="text-lg leading-snug">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                  {article.description}
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full text-primary hover:text-primary/80 hover:bg-primary/5 text-xs font-bold" asChild>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    {t('discover.readMore') || 'Đọc chi tiết'} <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
          {articles.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground italic">Chưa tìm thấy bài viết nào. Hãy thử làm mới.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
