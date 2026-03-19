'use client';

import Header from "@/components/Header";
import { useUser } from "@/firebase/auth/use-user";
import useMustBeLoggedIn from "@/lib/hooks/use-must-be-logged-in";
import { Loader2 } from "lucide-react";
import AiChatBubble from "@/components/dashboard/AiChatBubble";

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
      <Header />
      <main className="flex-1 relative">
        {children}
        <AiChatBubble />
      </main>
    </div>
  );
}
