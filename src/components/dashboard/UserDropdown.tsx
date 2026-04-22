// ==========================================
// FILE: src/components/dashboard/UserDropdown.tsx
// MỤC ĐÍCH: Menu thả xuống của người dùng ở Header
// TỔNG QUAN: Gộp Hồ sơ, Ngôn ngữ, và Đăng xuất vào một menu duy nhất có ảnh đại diện.
// ==========================================

'use client';

import { useUser } from '@/firebase/auth/use-user';
import { logout } from '@/firebase/auth/utils';
import { useTranslation } from '@/context/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, Globe, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

export default function UserDropdown() {
  const { user, userProfile } = useUser();
  const { t, locale, setLocale } = useTranslation();

  if (!user) return null;

  // Lấy chữ cái đầu của tên làm Avatar placeholder
  const initials = userProfile?.name 
    ? userProfile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.[0].toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors">
          <Avatar className="h-full w-full">
            <AvatarImage src={user.photoURL || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-bold leading-none">{userProfile?.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/dashboard/profile">
          <DropdownMenuItem className="cursor-pointer py-3">
            <User className="mr-3 h-4 w-4" />
            <span className="font-medium">{t('bottomNav.profile')}</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-bold px-3 py-2 text-muted-foreground uppercase tracking-wider">
          {t('header.toggleLanguage')}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setLocale('vi')} className="cursor-pointer flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-3">🇻🇳</span>
            <span>Tiếng Việt</span>
          </div>
          {locale === 'vi' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('en')} className="cursor-pointer flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-3">🇺🇸</span>
            <span>English</span>
          </div>
          {locale === 'en' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => logout()} 
          className="cursor-pointer py-3 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-bold">{t('profile.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
