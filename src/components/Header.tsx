'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Apple, Flame, Sparkles, User, Bed, Globe, Menu } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from './Logo';

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
  const { t, setLocale } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="mr-4 flex items-center space-x-2 sm:mr-6">
            <Logo className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              HealthSphere
            </span>
          </Link>
          <nav className="hidden items-center space-x-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-2 py-2 transition-colors text-xs font-medium',
                  pathname?.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
                    ? 'bg-muted font-semibold text-foreground'
                    : 'text-foreground/70 hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                    "mr-1.5 h-3.5 w-3.5",
                    pathname?.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard') ? "text-primary" : "text-foreground/70"
                )} />
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="flex items-center md:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start" className="w-48">
                {navItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className='flex w-full items-center py-2'>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{t(item.labelKey)}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>


        <div className="flex items-center justify-end space-x-2">
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