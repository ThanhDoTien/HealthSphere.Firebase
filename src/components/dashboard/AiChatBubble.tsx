// ==========================================
// FILE: src/components/dashboard/AiChatBubble.tsx
// MỤC ĐÍCH: Bong bóng Chat AI nổi (Floating Chat Bubble)
// TỔNG QUAN: Cho phép chat với AI từ bất kỳ vị trí nào trong ứng dụng.
// ==========================================

'use client';

import { useState } from 'react';
import { Bot, X, MessageCircle, Minus, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import AiChatInterface from './AiChatInterface';
import { useToast } from '@/components/ui/toast';

export default function AiChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 lg:right-[calc(30%+1.5rem)] z-[100] flex flex-col items-end gap-4 pointer-events-none transition-all duration-300">
      {/* Cửa sổ Chat */}
      {isOpen && !isMinimized && (
        <div className={cn(
          "w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-background border shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 animate-in fade-in zoom-in slide-in-from-bottom-10",
        )}>
          {/* Header Cửa sổ Chat */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold">HealthSphere AI</h3>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium">Đang trực tuyến</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setIsMinimized(true)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Nội dung Chat */}
          <div className="flex-1 overflow-hidden">
            <AiChatInterface isFullHeight className="h-full" />
          </div>
        </div>
      )}

      {/* Bong bóng nổi (Trigger) */}
      <button
        onClick={() => {
          if (isOpen && isMinimized) {
            setIsMinimized(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "pointer-events-auto flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 group relative overflow-hidden",
          isOpen && !isMinimized
            ? "bg-muted text-muted-foreground rotate-90"
            : "bg-primary text-primary-foreground hover:shadow-primary/30"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen && !isMinimized ? (
          <X className="h-7 w-7" />
        ) : (
          <div className="relative">
            <Bot className="h-7 w-7" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-primary" />
          </div>
        )}
      </button>

      {/* Thông báo nhỏ khi thu nhỏ */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-background border shadow-lg rounded-full animate-in fade-in slide-in-from-right-10 hover:bg-muted transition-colors transition-all duration-300"
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold">Quay lại cuộc trò chuyện</span>
        </button>
      )}
    </div>
  );
}
