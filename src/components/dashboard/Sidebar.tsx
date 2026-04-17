// ==========================================
// FILE: src/components/dashboard/Sidebar.tsx
// MỤC ĐÍCH: Thanh điều hướng bên trái (Sidebar)
// TỔNG QUAN: Hiển thị danh sách các chức năng chính, hỗ trợ thu gọn/mở rộng.
// ==========================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Apple, 
  Flame, 
  Bot, 
  User, 
  Bed, 
  Search, 
  Scale, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

export default function Sidebar({ isCollapsed, toggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: '/dashboard', labelKey: 'bottomNav.home', icon: Home },
    { href: '/dashboard/weight', labelKey: 'bottomNav.weight', icon: Scale },
    { href: '/dashboard/calories', labelKey: 'bottomNav.calories', icon: Apple },
    { href: '/dashboard/activity', labelKey: 'bottomNav.activity', icon: Flame },
    { href: '/dashboard/sleep', labelKey: 'bottomNav.sleep', icon: Bed },
    { href: '/dashboard/forums', labelKey: 'bottomNav.forums', icon: MessageSquare },
    { href: '/dashboard/discover', labelKey: 'bottomNav.discover', icon: Search },
    { href: '/dashboard/ai', labelKey: 'bottomNav.ai', icon: Bot },
    { href: '/dashboard/profile', labelKey: 'bottomNav.profile', icon: User },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col bg-card/50 backdrop-blur-md transition-all duration-300 ease-in-out z-40 h-[calc(100vh-80px)] overflow-hidden shrink-0",
        "lg:w-[16%] lg:opacity-100 lg:border-r lg:relative lg:pointer-events-auto", // Desktop: Always 16%, visible
        isCollapsed 
          ? "w-0 opacity-0 border-none pointer-events-none" 
          : "absolute left-0 w-64 opacity-100 border-r bg-background/95 shadow-2xl pointer-events-auto"
      )}
    >
      <div className="flex flex-col gap-1 p-3 overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (!isCollapsed) {
                  toggleCollapsed();
                }
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3 transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-6 w-6 shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-primary stroke-[2.5px]" : "text-muted-foreground stroke-[1.5px]"
              )} />
              <span className={cn(
                "text-sm font-bold truncate transition-opacity duration-300",
                isCollapsed ? "hidden lg:block" : "block",
                isActive ? "text-primary" : "text-foreground/80"
              )}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Footer Sidebar & Help */}
      <div className="mt-auto border-t bg-accent/5">
        <Dialog>
          <DialogTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 w-full p-4 text-muted-foreground hover:bg-accent/50 hover:text-primary transition-all group",
              isCollapsed ? "justify-center" : "px-4"
            )}>
              <HelpCircle className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110" />
              <span className={cn(
                "text-sm font-bold uppercase tracking-wider",
                isCollapsed ? "hidden lg:block" : "block"
              )}>{t('sidebar.help')}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {t('help.title')}
              </DialogTitle>
              <DialogDescription>
                {t('help.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg"><Scale className="h-5 w-5 text-primary" /></div>
                <div><h4 className="text-sm font-bold capitalize">{t('bottomNav.weight')}</h4><p className="text-xs text-muted-foreground">{t('help.weight')}</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg"><Apple className="h-5 w-5 text-orange-600" /></div>
                <div><h4 className="text-sm font-bold capitalize">{t('bottomNav.calories')}</h4><p className="text-xs text-muted-foreground">{t('help.calories')}</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg"><Bot className="h-5 w-5 text-purple-600" /></div>
                <div><h4 className="text-sm font-bold capitalize">{t('bottomNav.ai')}</h4><p className="text-xs text-muted-foreground">{t('help.ai')}</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg"><Home className="h-5 w-5 text-blue-600" /></div>
                <div><h4 className="text-sm font-bold capitalize">BMI Gauge</h4><p className="text-xs text-muted-foreground">{t('help.bmi')}</p></div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="p-4 pt-2">
          <p className="text-[10px] text-muted-foreground text-center font-medium opacity-60">
            {t('home.footer.copyright')}
          </p>
        </div>
      </div>
    </aside>
  );
}
