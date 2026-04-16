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
  Sparkles, 
  User, 
  Bed, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Scale, 
  MessageSquare 
} from 'lucide-react';
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
    { href: '/dashboard/ai', labelKey: 'bottomNav.ai', icon: Sparkles },
    { href: '/dashboard/profile', labelKey: 'bottomNav.profile', icon: User },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card/50 backdrop-blur-md transition-all duration-300 ease-in-out z-40 h-[calc(100vh-80px)]",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Nút thu gọn/mở rộng */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background shadow-md hidden md:flex"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="flex flex-col gap-1 p-3 overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
              {!isCollapsed && (
                <span className={cn(
                  "text-sm font-bold truncate transition-opacity duration-300",
                  isActive ? "text-primary" : "text-foreground/80"
                )}>
                  {t(item.labelKey)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Footer Sidebar */}
      {!isCollapsed && (
        <div className="p-4 border-t bg-accent/5">
          <p className="text-[10px] text-muted-foreground text-center font-medium">
            {t('home.footer.copyright')}
          </p>
        </div>
      )}
    </aside>
  );
}
