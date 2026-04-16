// ==========================================
// FILE: src/app/dashboard/forums/page.tsx
// MỤC ĐÍCH: Trang Diễn đàn (Coming Soon)
// TỔNG QUAN: Hiển thị giao diện chờ cho tính năng cộng đồng.
// ==========================================

'use client';

import { Sparkles, MessageSquare, Timer } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ForumsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-background p-8 rounded-full border-2 border-primary/20 shadow-xl">
          <MessageSquare className="h-16 w-16 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground p-2 rounded-lg shadow-lg rotate-12 flex items-center gap-1 font-bold text-xs">
          <Sparkles className="h-3 w-3" />
          COMING SOON
        </div>
      </div>

      <h1 className="text-4xl font-black tracking-tight mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        HealthSphere Community
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-8 font-medium">
        Chúng tôi đang xây dựng một không gian tuyệt vời để bạn kết nối, chia sẻ kinh nghiệm và cùng nhau sống khỏe!
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-primary/20 transition-all font-bold" asChild>
          <Link href="/dashboard"> Quay lại Trang chủ </Link>
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground px-4 py-2 bg-muted/50 rounded-full text-sm font-semibold">
          <Timer className="h-4 w-4" />
          Dự kiến ra mắt trong Quý 3/2026
        </div>
      </div>
    </div>
  );
}
