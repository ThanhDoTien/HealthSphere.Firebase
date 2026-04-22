// ==========================================
// FILE: src/components/dashboard/Sidebar.tsx
// MỤC ĐÍCH: Thanh điều hướng bên trái (Sidebar)
// TỔNG QUAN: Hiển thị danh sách các chức năng chính, hỗ trợ thu gọn/mở rộng.
// ==========================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Apple, 
  Flame, 
  Bot, 
  User, 
  Bed, 
  Search, 
  Scale, 
  MessageSquare,
  HelpCircle,
  Activity,
  Calendar,
  Settings
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from '@/firebase/auth/use-user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

export default function Sidebar({ isCollapsed, toggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const { user, userProfile } = useUser();

  const navItems = [
    { href: '/dashboard/profile', labelKey: 'bottomNav.profile', icon: User },
    { href: '/dashboard', labelKey: 'bottomNav.home', icon: Home },
    { href: '/dashboard/weight', labelKey: 'bottomNav.weight', icon: Scale },
    { href: '/dashboard/calories', labelKey: 'bottomNav.calories', icon: Apple },
    { href: '/dashboard/activity', labelKey: 'bottomNav.activity', icon: Flame },
    { href: '/dashboard/sleep', labelKey: 'bottomNav.sleep', icon: Bed },
    { href: '/dashboard/forums', labelKey: 'bottomNav.forums', icon: MessageSquare },
    { href: '/dashboard/discover', labelKey: 'bottomNav.discover', icon: Search },
    { href: '/dashboard/ai', labelKey: 'bottomNav.ai', icon: Bot },
  ];

  const getHelpContent = () => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: 'Trợ giúp Tổng quan',
          description: 'Trang tổng quan cung cấp cái nhìn toàn cảnh về các chỉ số sức khỏe cốt lõi của bạn trong ngày.',
          items: [
            { icon: Scale, label: 'Đồng hồ BMI', desc: 'Thước đo Chỉ số khối cơ thể hiện tại.' },
            { icon: Apple, label: 'Nạp & Đốt Calo', desc: 'Tổng hợp lượng calo bạn đã nạp và tiêu hao.' },
            { icon: Bot, label: 'Mẹo từ AI', desc: 'Gợi ý cá nhân hóa để cải thiện sức khỏe mỗi ngày.' },
          ]
        };
      case '/dashboard/profile':
        return {
          title: 'Trợ giúp Hồ sơ',
          description: 'Quản lý thông tin cá nhân và mục tiêu thể trạng.',
          items: [
            { icon: User, label: 'Thông tin cơ bản', desc: 'Cập nhật chiều cao, cân nặng, độ tuổi để AI tính toán chính xác.' },
            { icon: Settings, label: 'Mức độ vận động', desc: 'Giúp tính lượng TDEE tiêu hao mỗi ngày.' },
          ]
        };
      case '/dashboard/calories':
        return {
          title: 'Trợ giúp Dinh dưỡng',
          description: 'Quản lý bữa ăn và kiểm soát năng lượng nạp vào.',
          items: [
            { icon: Apple, label: 'Nhật ký bữa ăn', desc: 'Ghi lại món ăn bằng ảnh hoặc mô tả.' },
            { icon: Bot, label: 'AI Phân tích', desc: 'Tự động tính Calo và Macro (Protein, Carbs, Fat).' },
          ]
        };
      case '/dashboard/activity':
        return {
          title: 'Trợ giúp Vận động',
          description: 'Theo dõi chỉ số tập luyện và tiêu hao năng lượng.',
          items: [
            { icon: Flame, label: 'Đốt cháy Calo', desc: 'Ghi nhận bài tập và hoạt động hàng ngày.' },
            { icon: Activity, label: 'Nhịp tim & Huyết áp', desc: 'Theo dõi các chỉ số sinh tồn của bạn.' },
          ]
        };
      case '/dashboard/sleep':
        return {
          title: 'Trợ giúp Giấc ngủ',
          description: 'Kiểm soát thời lượng và chất lượng giấc ngủ.',
          items: [
            { icon: Bed, label: 'Nhật ký ngủ', desc: 'Ghi nhận số giờ ngủ mỗi đêm.' },
            { icon: Bot, label: 'AI Đánh giá', desc: 'Phân tích tình trạng phục hồi cơ thể.' },
          ]
        };
      case '/dashboard/weight':
        return {
          title: 'Trợ giúp Cân nặng',
          description: 'Theo dõi tiến trình thay đổi trọng lượng cơ thể.',
          items: [
            { icon: Scale, label: 'Cập nhật cân nặng', desc: 'Lưu lại số đo để thấy sự thay đổi.' },
            { icon: TrendingUp, label: 'Biểu đồ', desc: 'Xem xu hướng tăng/giảm cân qua các ngày.' },
          ]
        };
      case '/dashboard/ai':
        return {
          title: 'Trợ giúp HealthSphere AI',
          description: 'Trợ lý AI chuyên nghiệp về sức khỏe của bạn.',
          items: [
            { icon: Bot, label: 'Trò chuyện', desc: 'Hỏi bất cứ thứ gì về dinh dưỡng, bài tập, sức khỏe.' },
            { icon: Search, label: 'Phân tích sâu', desc: 'AI sẽ dựa trên dữ liệu thật của bạn để tư vấn.' },
          ]
        };
      default:
        return {
          title: t('help.title') || 'Trợ giúp chung',
          description: t('help.description') || 'Hướng dẫn sử dụng HealthSphere.',
          items: [
            { icon: Apple, label: t('bottomNav.calories'), desc: t('help.calories') },
            { icon: Bot, label: t('bottomNav.ai'), desc: t('help.ai') },
          ]
        };
    }
  };

  const help = getHelpContent();

  return (
    <aside
      className={cn(
        "flex flex-col bg-card/50 backdrop-blur-md transition-all duration-300 ease-in-out z-40 h-[calc(100vh-80px)] overflow-hidden shrink-0",
        "lg:w-[16%] lg:opacity-100 lg:border-r lg:relative lg:pointer-events-auto", // Desktop: Always 16%, visible
        isCollapsed 
          ? "w-0 opacity-0 border-none pointer-events-none" 
          : "absolute left-0 w-64 opacity-100 border-r bg-background/95 shadow-2xl pointer-events-auto"
      )}
    >
      <div className="flex flex-col gap-1 p-3 overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (!isCollapsed) {
                  toggleCollapsed();
                }
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3 transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {item.href === '/dashboard/profile' ? (
                <Avatar className={cn(
                  "h-6 w-6 shrink-0 transition-all duration-300 group-hover:scale-110",
                  isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-80"
                )}>
                  <AvatarImage src={user?.photoURL || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-[10px] text-primary font-bold">
                    {userProfile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <item.icon className={cn(
                  "h-6 w-6 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-primary stroke-[2.5px]" : "text-muted-foreground stroke-[1.5px]"
                )} />
              )}
              <span className={cn(
                "text-sm font-bold truncate transition-opacity duration-300",
                isCollapsed ? "hidden lg:block" : "block",
                isActive ? "text-primary" : "text-foreground/80"
              )}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Footer Sidebar & Help */}
      <div className="mt-auto border-t bg-accent/5">
        <Dialog>
          <DialogTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 w-full p-4 text-muted-foreground hover:bg-accent/50 hover:text-primary transition-all group",
              isCollapsed ? "justify-center" : "px-4"
            )}>
              <HelpCircle className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110" />
              <span className={cn(
                "text-sm font-bold uppercase tracking-wider",
                isCollapsed ? "hidden lg:block" : "block"
              )}>{t('sidebar.help')}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {help.title}
              </DialogTitle>
              <DialogDescription>
                {help.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {help.items.map((hi, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg"><hi.icon className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h4 className="text-sm font-bold capitalize">{hi.label}</h4>
                    <p className="text-xs text-muted-foreground">{hi.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="p-4 pt-2">
          <p className="text-[10px] text-muted-foreground text-center font-medium opacity-60">
            {t('home.footer.copyright')}
          </p>
        </div>
      </div>
    </aside>
  );
}
