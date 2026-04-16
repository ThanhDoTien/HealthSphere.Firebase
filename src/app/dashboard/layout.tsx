'use client';

import { useState } from 'react';
import Header from "@/components/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import RightAiSidebar from "@/components/dashboard/RightAiSidebar";
import { useUser } from "@/firebase/auth/use-user";
import { useTranslation } from "@/context/LanguageContext";
import useMustBeLoggedIn from "@/lib/hooks/use-must-be-logged-in";
import { Loader2, Bot, Sparkles } from "lucide-react";
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useMustBeLoggedIn();
  const { user, loading } = useUser();
  const { t } = useTranslation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex flex-1 pt-20">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        
        <main className={cn(
          "flex-1 relative overflow-y-auto h-[calc(100vh-80px)] bg-[#f0f2f5] dark:bg-[#18191a] transition-all flex flex-col"
        )}>
          {/* Nút Kích hoạt AI Sidebar - Cố định ở góc phải khi cuộn */}
          {!isAiOpen && (
            <div className="sticky top-6 z-30 h-0 flex justify-end pr-6 overflow-visible pointer-events-none">
              <button
                onClick={() => setIsAiOpen(true)}
                className="pointer-events-auto flex flex-col items-center justify-center gap-1.5 w-24 h-24 bg-gradient-to-br from-primary via-primary to-green-600 text-white rounded-3xl shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 transition-all animate-in zoom-in duration-500 group border-2 border-white/30"
              >
                <div className="relative bg-white/20 p-2 rounded-2xl block group-hover:bg-white/30 transition-colors">
                  <Bot className="h-6 w-6 animate-pulse group-hover:scale-110 transition-transform" />
                  <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-300 animate-spin-slow" />
                </div>
                <div className="flex flex-col items-center leading-none text-center">
                   <span className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">AI Assistant</span>
                   <span className="text-[11px] font-black tracking-tight italic">
                    {t('ai.chatbot.title') || 'Smart AI'}
                   </span>
                </div>
              </button>
            </div>
          )}

          <div className="w-full py-2 flex-1">
            {children}
          </div>
        </main>

        {/* Right Sidebar AI - Hamburger style (push content) */}
        <RightAiSidebar 
          isOpen={isAiOpen} 
          onClose={() => setIsAiOpen(false)} 
        />
      </div>
    </div>
  );
}
