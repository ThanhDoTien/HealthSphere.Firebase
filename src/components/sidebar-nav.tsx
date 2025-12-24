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
} from "lucide-react";
import { Icons } from "@/components/icons";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log-meal", label: "Log Meal", icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/recipes", label: "Recipes", icon: BookHeart },
  { href: "/community", label: "Community", icon: UsersRound },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
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
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
