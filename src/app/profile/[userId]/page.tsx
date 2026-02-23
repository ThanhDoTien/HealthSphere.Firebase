'use client';

import { useState, useEffect } from 'react';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type UserProfile = {
  displayName?: string;
  email?: string;
  photoURL?: string;
  // Add other profile fields here as needed
};

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setEmail(userProfile.email || '');
    }
  }, [userProfile]);

  const handleSaveChanges = async () => {
    if (!userRef) return;

    setIsSaving(true);
    const payload: Partial<UserProfile> = {
      displayName,
    };

    try {
      await updateDoc(userRef, payload);
      toast({
        title: 'Thành công',
        description: 'Hồ sơ của bạn đã được cập nhật.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật hồ sơ.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return <div>Loading...</div>;
  }

  if (params.userId !== user?.uid) {
    return <div>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Hồ sơ</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Họ và tên</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
