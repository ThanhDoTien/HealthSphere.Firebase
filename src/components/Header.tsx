// ==========================================
// FILE: src/components/Header.tsx
// MỤC ĐÍCH: Thanh điều hướng phía trên (Navbar / Header)
// TỔNG QUAN CHỨC NĂNG: Đây là Header chính của ứng dụng. Bao gồm thanh điều hướng 
// điều hướng đi tới mọi nơi trong ứng dụng (dashboard, nutrition, profile...). 
// Nó xử lý hiển thị có điều kiện (responsive) cho destop và mobile.
// Đồng thời cho phép chuyển đổi ngôn ngữ, và đăng xuất.
// ==========================================

'use client'; // Client Component để xử lý logic state và event

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Tiện ích nối chuỗi Tailwind CSS
import { Home, Apple, Flame, Sparkles, User, Bed, Globe, Menu, Search, LogOut } from 'lucide-react';

// Hooks hệ thống
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/firebase/auth/use-user';
import { logout } from '@/firebase/auth/utils';

// UI components từ thư viện @Radix
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from './Logo';

// Cấu hình các nút điều hướng (Dùng chung cho cả bản mobile và desktop)
// labelKey dùng để ánh xạ với file JSON đa ngôn ngữ (en.json / vi.json)
const navItems = [
  { href: '/dashboard', labelKey: 'bottomNav.home', icon: Home },
  { href: '/dashboard/calories', labelKey: 'bottomNav.calories', icon: Apple },
  { href: '/dashboard/activity', labelKey: 'bottomNav.activity', icon: Flame },
  { href: '/dashboard/sleep', labelKey: 'bottomNav.sleep', icon: Bed },
  { href: '/dashboard/discover', labelKey: 'bottomNav.discover', icon: Search },
  { href: '/dashboard/ai', labelKey: 'bottomNav.ai', icon: Sparkles },
  { href: '/dashboard/profile', labelKey: 'bottomNav.profile', icon: User },
];

export default function Header() {
  // Hook lấy URL hiện tại (ví dụ: '/dashboard/calories') để active nút trên navbar
  const pathname = usePathname();
  const { t, setLocale } = useTranslation(); // Các hàm cho đa ngôn ngữ
  const { user } = useUser(); // Lấy thông tin user hiện tại từ Firebase

  return (
    // Lớp chứa ngoài cùng: Cố định ở top màn hình (sticky), có background mờ ảo (backdrop-blur)
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 relative">
        
        {/* KHU VỰC 1: Nút Menu di động (Mobile Menu). Dành riêng cho màn hình nhỏ (md:hidden) */}
        <div className="flex items-center md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            {/* Danh sách thả xuống bên trong di động */}
            <DropdownMenuContent side="bottom" align="start" className="w-48">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className='flex w-full items-center py-2 text-xs'>
                    {/* Render Icon của item đó ra */}
                    <item.icon className="mr-2 h-3.5 w-3.5" />
                    {/* Tên item đa ngôn ngữ */}
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* KHU VỰC 2: Logo và Tên thương hiệu */}
        <div className="flex items-center">
          {/* Logo có logic chuyển hướng: User đã đăng nhập thì bấm vào logo về dashboard, chưa thì về trang chủ (/) */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="flex items-center space-x-2 absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0"
          >
            <Logo className="h-10 w-10" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              <span style={{ color: '#64B5F6' }}>Health</span>
              <span style={{ color: '#4CAF50' }}>Sphere</span>
            </span>
          </Link>
        </div>

        {/* KHU VỰC 3: Thay điều hướng trung tâm kiểu Pill - Dành riêng cho màn PC/Desktop */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav className="flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                // Điều khiển giao diện của cục Pill: Nếu là trang hiện tại thì làm màu xanh, nếu không thì hờ
                className={cn(
                  'group flex flex-col items-center justify-center rounded-xl transition-all duration-300 h-14 min-w-[76px] px-2',
                  pathname?.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
                    ? 'text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                )}
              >
                {/* 1. Hiển thị Icon */}
                <item.icon className={cn(
                  "h-[22px] w-[22px] transition-transform duration-300 group-hover:scale-110",
                  pathname?.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard') ? "text-primary" : "text-foreground/70"
                )} />
                {/* 2. Hiển thị Chữ (Chỉ hiện khi hover hoặc active) */}
                <span className={cn(
                  "text-[9px] uppercase font-bold tracking-widest transition-all duration-300 overflow-hidden whitespace-nowrap",
                  "max-h-0 opacity-0 group-hover:max-h-6 group-hover:opacity-100 group-hover:mt-1",
                  pathname?.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard') ? "max-h-6 opacity-100 mt-1" : ""
                )}>
                  {t(item.labelKey)}
                </span>
              </Link>
            ))}
          </nav>
        </div>


        {/* KHU VỰC 4: Các nút chức năng phụ (Ngôn ngữ, Đăng xuất) */}
        <div className="flex items-center justify-end space-x-2">
          {/* Nút thả ngôn ngữ (Globe Icon) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Globe className="h-6 w-6 text-foreground/70" />
                <span className="sr-only">{t('header.toggleLanguage')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('vi')}>Tiếng Việt</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Chỉ hiển thị nút đăng xuất nếu user (phiên Firebase) đang tồn tại */}
          {user && (
            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => logout()}>
              <LogOut className="h-6 w-6" />
              <span className="sr-only">{t('profile.logout')}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
