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
  Scale 
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/firebase/auth/use-user';
import { Logo } from './Logo';
import UserDropdown from './dashboard/UserDropdown';

export default function Header() {
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
    { href: '/dashboard/ai', icon: Sparkles, labelKey: 'bottomNav.ai' },
  ];

  const isAuthPage = pathname?.includes('/signup') || pathname?.includes('/login');

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-20 items-center justify-between px-2">
        
        {/* TRÁI: Logo */}
        <div className="flex items-center gap-4">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2 shrink-0">
            <Logo className="h-10 w-10 min-w-[40px]" />
            <span className="hidden sm:inline-block text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              HealthSphere
            </span>
          </Link>
        </div>

        {/* GIỮA: Navigation */}
        {!isAuthPage && user && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center h-full w-20 xl:w-24 gap-1 transition-all rounded-xl group relative overflow-hidden",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-6 w-6 transition-transform group-hover:scale-110 mb-0.5",
                    isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                  )} />
                  <span className={cn(
                    "text-[9px] xl:text-[10px] font-black uppercase tracking-widest",
                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                  )}>
                    {t(item.labelKey)}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary),0.3)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* PHẢI: User Profile */}
        <div className="flex items-center gap-4">
          {!isAuthPage && user && <UserDropdown />}
        </div>
      </div>
    </header>
  );
}
