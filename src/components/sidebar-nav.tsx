"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  BookHeart,
  CircleUserRound,
  LayoutDashboard,
  Settings,
  UsersRound,
  UtensilsCrossed,
  Dumbbell,
  Scale,
} from "lucide-react";
import { Icons } from "@/components/icons";

const links = [
  { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
  { href: "/log-meal", label: "Ghi lại bữa ăn", icon: UtensilsCrossed },
  { href: "/log-workout", label: "Ghi lại bài tập", icon: Dumbbell },
  { href: "/weight", label: "Cân nặng", icon: Scale },
  { href: "/progress", label: "Tiến độ", icon: BarChart3 },
  { href: "/recipes", label: "Công thức", icon: BookHeart },
  { href: "/community", label: "Cộng đồng", icon: UsersRound },
  { href: "/profile", label: "Hồ sơ", icon: CircleUserRound },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold font-headline">HealthSphere</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Cài đặt">
              <Link href="#">
                <Settings />
                <span>Cài đặt</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
