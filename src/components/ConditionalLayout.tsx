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

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
