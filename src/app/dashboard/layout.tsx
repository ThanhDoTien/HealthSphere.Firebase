'use client';

import BottomNav from "@/components/BottomNav";
import { useUser } from "@/firebase/auth/use-user";
import useMustBeLoggedIn from "@/lib/hooks/use-must-be-logged-in";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useMustBeLoggedIn();
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
