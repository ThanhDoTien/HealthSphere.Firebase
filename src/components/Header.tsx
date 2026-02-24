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

export default function Header() {
  const pathname = usePathname();
  const { t, setLocale, locale } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-primary">
              HealthSphere
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname?.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Home className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              {navItems.map((item) => (
                 <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{t(item.labelKey)}</Link>
                 </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
                <span className="sr-only">{t('header.toggleLanguage')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('vi')}>Tiếng Việt</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
