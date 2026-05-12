// ==========================================
// FILE: src/app/dashboard/discover/page.tsx
// MỤC ĐÍCH: Trang Khám phá Kiến thức Sức khỏe (Health Knowledge Discovery)
// TỔNG QUAN: AI tìm kiếm và đề xuất bài viết khoa học uy tín dựa trên mục tiêu
// sức khỏe của người dùng. Bao gồm video YouTube Shorts về sức khỏe.
// ==========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
import HealthShorts from '@/components/dashboard/HealthShorts';

// SimpleBadge component
function SimpleBadge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary border border-primary/20 ${className}`}>
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
    <div className="p-4 sm:p-6 space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <Search className="h-6 w-6 text-primary" />
            {t('discover.title') || 'Khám phá Kiến thức'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('discover.description') || 'Bài viết và tin tức sức khỏe chọn lọc cho mục tiêu của bạn.'}
          </p>
        </div>
        <Button onClick={fetchArticles} disabled={isLoading} variant="outline" className="shrink-0 rounded-full shadow-sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('discover.refresh') || 'Làm mới tin tức'}
        </Button>
      </header>

      {/* Suggested YouTube Shorts */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <HealthShorts />
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">
            HealthSphere AI đang tìm kiếm những kiến thức tốt nhất cho bạn...
          </p>
        </div>
      ) : error ? (
        <Card className="border-destructive/20 bg-destructive/5 rounded-2xl overflow-hidden">
          <CardContent className="py-12 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
               <Globe className="h-6 w-6" />
            </div>
            <p className="text-destructive font-bold">{error}</p>
            <Button onClick={fetchArticles} variant="secondary" className="rounded-full">Thử lại</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {articles.map((article, idx) => (
            <Card key={idx} className="group flex flex-col h-full hover:shadow-xl transition-all duration-300 border-primary/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
              <div className="relative h-56 w-full overflow-hidden">
                <Image 
                  src={article.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(article.title + ', cover image, professional photography')}?width=800&height=600&nologo=true&model=flux`} 
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 left-3">
                  <SimpleBadge className="bg-white/90 text-primary shadow-sm backdrop-blur-sm">
                    {article.category}
                  </SimpleBadge>
                </div>
              </div>
              
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[10px] text-primary flex items-center gap-1 uppercase font-black tracking-widest">
                     <Globe className="h-3 w-3" /> {article.source}
                   </span>
                </div>
                <CardTitle className="text-xl leading-tight font-bold group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
              </CardContent>
              
              <CardFooter className="pt-2 pb-5 px-5">
                <Button variant="default" className="w-full text-xs font-bold rounded-xl shadow-md group-hover:shadow-primary/20" asChild>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    {t('discover.readMore') || 'Đọc chi tiết'} <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {articles.length === 0 && (
            <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground italic font-medium">
                Chưa có nội dung nào được cập nhật. Hãy nhấn &quot;Làm mới&quot; để AI tìm kiếm cho bạn.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
