// ==========================================
// FILE: src/app/dashboard/ai/page.tsx
// MỤC ĐÍCH: Trang Trò chuyện AI Sức khỏe chuyên sâu
// TỔNG QUAN: Sử dụng AiChatInterface để hiển thị nội dung chat.
// ==========================================

'use client';

import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import AiChatInterface from '@/components/dashboard/AiChatInterface';

export default function AiChatPage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col p-4 sm:p-6 overflow-hidden">
      <Card className="flex flex-1 flex-col overflow-hidden shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4 p-6 border-b bg-primary/5">
           <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
              <Sparkles className="h-7 w-7" />
           </div>
           <div>
              <h1 className="text-2xl font-black tracking-tight">{t('ai.title')}</h1>
              <p className="text-sm text-muted-foreground font-medium">{t('ai.description')}</p>
           </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
           <AiChatInterface isFullHeight className="h-full" />
        </div>
      </Card>
    </div>
  );
}
