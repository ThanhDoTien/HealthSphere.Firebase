"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import useMustBeLoggedIn from "@/lib/hooks/use-must-be-logged-in";
import { logout } from "@/firebase/auth/utils";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  useMustBeLoggedIn();
  const { user, userProfile } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="text-2xl font-bold">
            Hello, {userProfile?.name || "User"}!
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </header>
        <main>
          <Card>
            <CardHeader>
              <CardTitle>Welcome to your Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is your personal health dashboard. More features coming soon!</p>
              {user && <p className="mt-4 text-sm text-muted-foreground">User ID: {user.uid}</p>}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
