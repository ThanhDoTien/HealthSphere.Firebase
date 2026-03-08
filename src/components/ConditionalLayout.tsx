'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Thành phần điều khiển bố cục có điều kiện.
 * - Trang chủ (/): Chiếm 100% chiều rộng.
 * - Các trang khác: Chiếm 70% chiều rộng trên màn hình lớn, căn giữa, có đổ bóng.
 */
export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className={cn(
      "min-h-screen",
      !isHomePage && "bg-slate-100 dark:bg-slate-900" 
    )}>
      <div className={cn(
        "mx-auto transition-all duration-300 min-h-screen flex flex-col",
        !isHomePage 
          ? "w-full md:max-w-[70%] bg-background shadow-[0_0_50px_rgba(0,0,0,0.1)]" 
          : "w-full"
      )}>
        {children}
      </div>
    </div>
  );
}
