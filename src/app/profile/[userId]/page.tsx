
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Pencil, Loader2 } from "lucide-react";
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


type UserProfile = {
  id: string;
  username: string;
  email: string;
  heightCm?: number;
  weightKg?: number;
  gender?: string;
  activityLevel?: string;
  dietaryPreferences?: string;
  calorieGoal?: number;
  stepsGoal?: number;
  sleepGoal?: number;
};


export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userProfileRef = useMemoFirebase(() => (db && userId ? doc(db, 'users', userId) : null), [db, userId]);
  const { data: userProfile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  const canEdit = !isAuthLoading && authUser?.uid === userId;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof UserProfile) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (userProfileRef) {
        const payload: { [key: string]: any } = {
            username: formData.username,
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            dietaryPreferences: formData.dietaryPreferences,
        };

        const height = parseFloat(String(formData.heightCm));
        if (!isNaN(height)) {
            payload.heightCm = height;
        } else {
            payload.heightCm = null;
        }

        const weight = parseFloat(String(formData.weightKg));
        if (!isNaN(weight)) {
            payload.weightKg = weight;
        } else {
            payload.weightKg = null;
        }

        try {
            await updateDoc(userProfileRef, payload);
            toast({
                title: 'Thành công!',
                description: 'Hồ sơ của bạn đã được cập nhật.',
            });
            setIsEditing(false);
        } catch (e: any) {
            console.error('Lỗi cập nhật hồ sơ:', e);
            toast({
                variant: 'destructive',
                title: 'Ôi, đã có lỗi xảy ra.',
                description: e.message || 'Không thể cập nhật hồ sơ của bạn.',
            });
        }
    }
  };

  const userAvatar = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');
  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Alert variant="destructive">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>Không thể tải hồ sơ. Vui lòng thử lại.</AlertDescription>
            </Alert>
        </div>
     )
  }
  
  if (!userProfile) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Alert>
                <AlertTitle>Không tìm thấy hồ sơ</AlertTitle>
                <AlertDescription>Không thể tìm thấy hồ sơ cho người dùng này.</AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={canEdit ? "Hồ sơ của bạn" : `Hồ sơ của ${userProfile.username}`}
        description={canEdit ? "Quản lý thông tin cá nhân và sở thích sức khỏe của bạn." : `Xem hồ sơ của ${userProfile.username}`}
      />
      <div className="grid gap-8">
        <div className={"md:col-span-3"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>
                        {canEdit ? "Cập nhật chi tiết hồ sơ của bạn ở đây." : `Chi tiết hồ sơ của ${userProfile.username}.`}
                    </CardDescription>
                </div>
                {canEdit && !isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Cập nhật thông tin
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  {authUser?.photoURL ? (
                    <AvatarImage src={authUser.photoURL} alt="User avatar" />
                  ) : userAvatar ? (
                    <AvatarImage
                      src={userAvatar.imageUrl}
                      alt="User avatar"
                      data-ai-hint={userAvatar.imageHint}
                    />
                  ): null}
                  <AvatarFallback>{formData.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-grow w-full space-y-2">
                   <Label htmlFor="username">Họ và tên</Label>
                   <Input id="username" value={formData.username || ''} onChange={handleInputChange} readOnly={!isEditing} />
                </div>
                 {isEditing && <Button variant="outline">Thay đổi ảnh</Button>}
              </div>

               <div className="space-y-2">
                  <Label htmlFor="id">UID</Label>
                  <Input id="id" value={userProfile.id} readOnly />
                </div>
              
              <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userProfile.email} readOnly />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Cân nặng (kg)</Label>
                  <Input id="weightKg" type="number" value={formData.weightKg || ''} onChange={handleInputChange} readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heightCm">Chiều cao (cm)</Label>
                  <Input id="heightCm" type="number" value={formData.heightCm || ''} onChange={handleInputChange} readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select value={formData.gender || ''} onValueChange={handleSelectChange('gender')} disabled={!isEditing}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityLevel">Mức độ hoạt động</Label>
                <Select value={formData.activityLevel || ''} onValueChange={handleSelectChange('activityLevel')} disabled={!isEditing}>
                  <SelectTrigger id="activityLevel">
                    <SelectValue placeholder="Chọn mức độ hoạt động của bạn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Ít vận động (ít hoặc không tập thể dục)</SelectItem>
                    <SelectItem value="light">Hoạt động nhẹ (tập thể dục/thể thao nhẹ 1-3 ngày/tuần)</SelectItem>
                    <SelectItem value="moderate">Hoạt động vừa phải (tập thể dục/thể thao vừa phải 3-5 ngày/tuần)</SelectItem>
                    <SelectItem value="very">Rất năng động (tập thể dục/thể thao nặng 6-7 ngày một tuần)</SelectItem>
                    <SelectItem value="extra">Cực kỳ năng động (tập thể dục rất nặng và công việc thể chất)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietaryPreferences">Sở thích ăn uống & Dị ứng</Label>
                <Textarea
                  id="dietaryPreferences"
                  placeholder="ví dụ: Ăn chay, không chứa gluten, dị ứng với đậu phộng"
                  value={formData.dietaryPreferences || ''}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
              </div>
              {isEditing && (
                <div className="flex gap-2">
                    <Button onClick={handleSaveChanges}>Lưu thay đổi</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Hủy</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    