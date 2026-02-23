'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { logout } from "@/firebase/auth/utils";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, userProfile } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>View and manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Name</h3>
              <p className="text-muted-foreground">{userProfile?.name}</p>
            </div>
             <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-muted-foreground">{userProfile?.email}</p>
            </div>
             <div>
              <h3 className="font-medium">Health Goal</h3>
              <p className="text-muted-foreground">{userProfile?.goal}</p>
            </div>
           <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
