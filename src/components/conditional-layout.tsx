"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "@/components/app-layout";

export function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noLayoutRoutes = ["/login", "/signup"];

  const showLayout = !noLayoutRoutes.includes(pathname);

  if (showLayout) {
    return <AppLayout>{children}</AppLayout>;
  }

  return <>{children}</>;
}
