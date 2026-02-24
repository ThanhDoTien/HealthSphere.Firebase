'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Apple, Flame, Sparkles, User, Bed, MessageSquare } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/calories', label: 'Calories', icon: Apple },
  { href: '/dashboard/activity', label: 'Activity', icon: Flame },
  { href: '/dashboard/sleep', label: 'Sleep', icon: Bed },
  { href: '/dashboard/forums', label: 'Forums', icon: MessageSquare },
  { href: '/dashboard/ai', label: 'AI', icon: Sparkles },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

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
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
