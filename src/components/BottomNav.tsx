'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Apple, Flame, Sparkles, User, Bed, Globe } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/dashboard', labelKey: 'bottomNav.home', icon: Home },
  { href: '/dashboard/calories', labelKey: 'bottomNav.calories', icon: Apple },
  { href: '/dashboard/activity', labelKey: 'bottomNav.activity', icon: Flame },
  { href: '/dashboard/sleep', labelKey: 'bottomNav.sleep', icon: Bed },
  { href: '/dashboard/ai', labelKey: 'bottomNav.ai', icon: Sparkles },
  { href: '/dashboard/profile', labelKey: 'bottomNav.profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t, setLocale, locale } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-20 max-w-lg grid-cols-7 items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:text-primary',
              { 'text-primary': pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard') }
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{t(item.labelKey)}</span>
          </Link>
        ))}
        {/* Language Switcher */}
        <div className="flex flex-col items-center justify-center">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-auto flex-col items-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-transparent hover:text-primary">
                 <Globe className="h-6 w-6" />
                 <span className="text-xs font-medium">{locale.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="mb-2">
              <DropdownMenuItem onClick={() => setLocale('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('vi')}>Tiếng Việt</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
