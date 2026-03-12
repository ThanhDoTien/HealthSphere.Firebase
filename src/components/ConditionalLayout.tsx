'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Điều chỉnh bố cục trang web.
 * - Trang chủ (/): 100% chiều rộng.
 * - Các trang khác: 70% chiều rộng trên màn hình lớn, có shadow và border, hai bên giữ màu nền cũ (muted).
 */
export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className="min-h-screen bg-muted/40">
      <div className={cn(
        "mx-auto transition-all duration-300 min-h-screen flex flex-col",
        !isHomePage
          ? "w-full lg:max-w-[70%] bg-background shadow-[0_0_50px_rgba(0,0,0,0.1)] border-x"
          : "w-full bg-background"
      )}>
        {children}
      </div>
    </div>
  );
}
