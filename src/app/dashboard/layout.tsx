'use client';
 
import { useState } from 'react';
import Header from "@/components/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import RightAiSidebar from "@/components/dashboard/RightAiSidebar";
import AiChatBubble from "@/components/dashboard/AiChatBubble";
import { useUser } from "@/firebase/auth/use-user";
import { useTranslation } from "@/context/LanguageContext";
import useMustBeLoggedIn from "@/lib/hooks/use-must-be-logged-in";
import { Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';
 
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useMustBeLoggedIn();
  const { user, loading } = useUser();
  const { t } = useTranslation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
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
      <Header 
        onToggleAi={() => setIsAiOpen(!isAiOpen)} 
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex flex-1 pt-20 overflow-hidden">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        
        <main className={cn(
          "relative overflow-y-auto h-[calc(100vh-80px)] bg-background transition-all flex flex-col no-scrollbar",
          "w-full lg:w-[54%]" // Middle section 54%
        )}>
          <div className="w-full py-6 px-10 xl:px-16 flex-1">
            {children}
          </div>
        </main>
 
        <RightAiSidebar 
          isOpen={isAiOpen} 
          onClose={() => setIsAiOpen(false)} 
        />
      </div>
 
      {/* Bong bóng Chat AI */}
      <AiChatBubble />
    </div>
  );
}
