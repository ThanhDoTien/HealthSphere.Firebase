
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
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  BookHeart,
  CircleUserRound,
  LayoutDashboard,
  Settings,
  UtensilsCrossed,
  Dumbbell,
  Scale,
  PlusCircle,
  Moon
} from "lucide-react";
import { Icons } from "@/components/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
];

// Assuming the logged-in user has this ID. In a real app, this would be dynamic.
const loggedInUserId = "alex-doe";

const secondaryLinks = [
  { href: "/progress", label: "Tiến độ", icon: BarChart3 },
  { href: "/recipes", label: "Công thức", icon: BookHeart },
  { href: `/profile/${loggedInUserId}`, label: "Hồ sơ", icon: CircleUserRound },
]

const loggingLinks = [
    { href: "/log-meal", label: "Ghi lại bữa ăn", icon: UtensilsCrossed },
    { href: "/log-workout", label: "Ghi lại bài tập", icon: Dumbbell },
    { href: "/weight", label: "Cân nặng", icon: Scale },
    { href: "/log-sleep", label: "Ghi lại giấc ngủ", icon: Moon },
]

export function SidebarNav() {
  const pathname = usePathname();
  const [isLoggingOpen, setIsLoggingOpen] = useState(
    loggingLinks.some(l => l.href === pathname)
  );

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
          {mainLinks.map((link) => (
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
            <Collapsible open={isLoggingOpen} onOpenChange={setIsLoggingOpen} className="w-full">
                <CollapsibleTrigger asChild>
                     <SidebarMenuButton variant="ghost" className="w-full justify-start" isActive={isLoggingOpen}>
                        <PlusCircle />
                        <span>Ghi lại dữ liệu</span>
                     </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                    {loggingLinks.map((link) => (
                        <SidebarMenuItem key={link.href}>
                            <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                                <Link href={link.href}>
                                    <link.icon />
                                    <span>{link.label}</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuItem>
                    ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
           {secondaryLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(link.href)}
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
