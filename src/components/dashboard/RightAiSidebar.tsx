// ==========================================
// FILE: src/components/dashboard/RightAiSidebar.tsx
// MỤC ĐÍCH: Thanh Sidebar AI bên phải
// TỔNG QUAN: Chứa giao diện chat AI nhanh, hỗ trợ thu gọn/mở rộng.
// ==========================================

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AiChatInterface from './AiChatInterface';

interface RightAiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RightAiSidebar({ isOpen, onClose }: RightAiSidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col border-l bg-background/50 backdrop-blur-xl transition-all duration-500 ease-in-out z-40 h-[calc(100vh-80px)] overflow-hidden",
        isOpen ? "w-80 lg:w-96 opacity-100" : "w-0 opacity-0 border-none"
      )}
    >
      {/* Nút Đóng Sidebar (Hamburger style back) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute left-2 top-4 h-8 w-8 rounded-full hover:bg-muted z-50 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Giao diện Chat */}
      <div className={cn(
        "flex flex-col h-full w-80 lg:w-96 transition-opacity duration-300 pt-12",
        isOpen ? "opacity-100" : "opacity-0"
      )}>
        <AiChatInterface isFullHeight className="flex-1" />
      </div>
    </aside>
  );
}
