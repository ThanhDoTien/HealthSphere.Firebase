// ==========================================
// FILE: src/components/Header.tsx
// MỤC ĐÍCH: Thanh điều hướng phía trên (Horizontal Icons Style)
// TỔNG QUAN: Bố cục dàn hàng ngang với nhãn dưới icon, gộp User Avatar.
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
  Bed, 
  Search, 
  MessageSquare, 
  Scale,
  Menu,
  Bot
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import UserDropdown from './dashboard/UserDropdown';

interface HeaderProps {
  onToggleAi?: () => void;
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleAi, onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useUser();

  const navItems = [
    { href: '/dashboard', icon: Home, labelKey: 'bottomNav.home' },
    { href: '/dashboard/weight', icon: Scale, labelKey: 'bottomNav.weight' },
    { href: '/dashboard/calories', icon: Apple, labelKey: 'bottomNav.calories' },
    { href: '/dashboard/activity', icon: Flame, labelKey: 'bottomNav.activity' },
    { href: '/dashboard/sleep', icon: Bed, labelKey: 'bottomNav.sleep' },
    { href: '/dashboard/forums', icon: MessageSquare, labelKey: 'bottomNav.forums' },
    { href: '/dashboard/discover', icon: Search, labelKey: 'bottomNav.discover' },
    { href: '/dashboard/ai', icon: Bot, labelKey: 'sidebar.ai' },
  ];

  const isAuthPage = pathname?.includes('/signup') || pathname?.includes('/login');

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm px-6">
      <div className="h-20 flex items-center w-full">
        
        {/* TRÁI: 16% slot */}
        <div className="w-[16%] flex items-center justify-start gap-2 sm:gap-4 shrink-0 h-full">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden h-10 w-10 rounded-full hover:bg-accent"
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <Logo className="h-9 w-9 min-w-[36px]" />
            <span className="hidden sm:inline-block text-xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent tracking-tighter">
              HealthSphere
            </span>
          </Link>
        </div>

        {/* GIỮA: 54% slot */}
        {!isAuthPage && user && (
          <nav className="hidden lg:flex items-center w-[54%] px-10 xl:px-16 h-full">
            <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center h-20 w-12 transition-all group relative",
                      isActive 
                        ? "text-primary bg-primary/5" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-all duration-300 group-hover:scale-110",
                      isActive ? "stroke-[2.5px] -translate-y-0.5" : "stroke-[1.5px]"
                    )} />
                    <span className="sr-only">{t(item.labelKey)}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary),0.3)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* PHẢI: 30% slot */}
        <div className="flex-1 lg:w-[30%] flex items-center justify-end gap-4 shrink-0 h-full pr-6">
          {user && !isAuthPage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleAi}
              className="lg:hidden relative h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all group overflow-visible"
              title="HealthSphere AI"
            >
              <Sparkles className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </Button>
          )}
          {!isAuthPage && user && <UserDropdown />}
        </div>
      </div>
    </header>
  );
}
