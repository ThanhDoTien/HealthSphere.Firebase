'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { AppLayout } from './app-layout';
import { AuthLayout } from './auth-layout';
import { Icons } from './icons';
import { SidebarProvider } from './ui/sidebar';

const authRoutes = ['/login', '/signup'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  const isAuthRoute = authRoutes.includes(pathname);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Icons.logo className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthRoute) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return <SidebarProvider><AppLayout>{children}</AppLayout></SidebarProvider>;
}
