'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Điều chỉnh bố cục trang web.
 * - Trang chủ (/): 100% chiều rộng.
 * - Các trang khác: 70% chiều rộng trên màn hình lớn, căn giữa nhưng nền trắng hoàn toàn.
 */
export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      <div className={cn(
        "mx-auto transition-all duration-300 min-h-screen flex flex-col",
        !isHomePage
          ? "w-full lg:max-w-[70%] bg-background"
          : "w-full"
      )}>
        {children}
      </div>
    </div>
  );
}
