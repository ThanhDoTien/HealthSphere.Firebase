// ==========================================
// FILE: src/app/dashboard/profile/page.tsx
// MỤC ĐÍCH: Trang Hồ sơ Cá nhân (User Profile Page)
// TỔNG QUAN: Cho phép người dùng xem và chỉnh sửa thông tin cá nhân
// (tên, chiều cao, cân nặng, mục tiêu, mức độ vận động).
// ==========================================

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase/auth/use-user";
import EditProfileForm from "@/components/dashboard/EditProfileForm";
import { useTranslation } from "@/context/LanguageContext";

export default function ProfilePage() {
  const { user, userProfile } = useUser();
  const { t } = useTranslation();

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
        </CardContent>
      </Card>
    </div>
  );
}
