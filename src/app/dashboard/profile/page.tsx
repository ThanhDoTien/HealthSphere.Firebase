'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import { logout } from "@/firebase/auth/utils";
import { useRouter } from "next/navigation";
import EditProfileForm from "@/components/dashboard/EditProfileForm";
import { useTranslation } from "@/context/LanguageContext";

export default function ProfilePage() {
  const { user, userProfile } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
          <CardDescription>{t('profile.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && userProfile && (
            <EditProfileForm userProfile={userProfile} userId={user.uid} />
          )}
          <div className="border-t pt-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {t('profile.logout')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
