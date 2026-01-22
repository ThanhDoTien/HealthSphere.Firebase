
"use client";

import { useState } from "react";
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
import { MessageSquare, Pencil } from "lucide-react";
import Link from "next/link";

// Mock data store
const users = {
  "alex-doe": {
    name: "Alex Doe",
    weight: 70,
    height: 175,
    gender: "male",
    activityLevel: "moderate",
    preferences: "Chế độ ăn uống cân bằng, đang cố gắng giảm đường.",
    avatarId: "user-avatar-1",
    uid: "user_1a2b3c4d5e"
  },
  "jane-doe": {
    name: "Jane Doe",
    weight: 60,
    height: 165,
    gender: "female",
    activityLevel: "light",
    preferences: "Ăn uống lành mạnh.",
    avatarId: "user-avatar-1",
    uid: "user_6f7g8h9i0j"
  },
  "john-smith": {
    name: "John Smith",
    weight: 85,
    height: 180,
    gender: "male",
    activityLevel: "very",
    preferences: "Động lực, Thể hình, Thảo luận",
    avatarId: "user-avatar-2",
    uid: "user_k1l2m3n4o5"
  }
};

type UserProfile = typeof users[keyof typeof users];

// In a real app, this would be a check to see if the profile
// belongs to the currently authenticated user.
const isCurrentUser = (userId: string) => userId === 'alex-doe';


export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const userData = (users as Record<string, UserProfile>)[userId] || users['alex-doe']; // Fallback to default
  
  const canEdit = isCurrentUser(userId);
  const [isEditing, setIsEditing] = useState(false);

  const userAvatar = PlaceHolderImages.find((p) => p.id === userData.avatarId);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={canEdit ? "Hồ sơ của bạn" : `Hồ sơ của ${userData.name}`}
        description={canEdit ? "Quản lý thông tin cá nhân và sở thích sức khỏe của bạn." : `Xem hồ sơ của ${userData.name}`}
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className={canEdit ? "md:col-span-3" : "md:col-span-3"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>
                        {canEdit ? "Cập nhật chi tiết hồ sơ của bạn ở đây." : `Chi tiết hồ sơ của ${userData.name}.`}
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
                  {userAvatar && (
                    <AvatarImage
                      src={userAvatar.imageUrl}
                      alt="User avatar"
                      data-ai-hint={userAvatar.imageHint}
                    />
                  )}
                  <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow w-full space-y-2">
                   <Label htmlFor="name">Họ và tên</Label>
                   <Input id="name" defaultValue={userData.name} readOnly={!isEditing} />
                </div>
                 {isEditing && <Button variant="outline">Thay đổi ảnh</Button>}
              </div>

               <div className="space-y-2">
                  <Label htmlFor="uid">UID</Label>
                  <Input id="uid" value={userData.uid} readOnly />
                </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weight">Cân nặng (kg)</Label>
                  <Input id="weight" type="number" defaultValue={userData.weight} readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Chiều cao (cm)</Label>
                  <Input id="height" type="number" defaultValue={userData.height} readOnly={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select defaultValue={userData.gender} disabled={!isEditing}>
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
                <Label htmlFor="activity-level">Mức độ hoạt động</Label>
                <Select defaultValue={userData.activityLevel} disabled={!isEditing}>
                  <SelectTrigger id="activity-level">
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
                <Label htmlFor="dietary-preferences">Sở thích ăn uống & Dị ứng</Label>
                <Textarea
                  id="dietary-preferences"
                  placeholder="ví dụ: Ăn chay, không chứa gluten, dị ứng với đậu phộng"
                  defaultValue={userData.preferences}
                  readOnly={!isEditing}
                />
              </div>
              {isEditing && (
                <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)}>Lưu thay đổi</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Hủy</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Bài viết của {userData.name}</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-40">
                  <MessageSquare className="h-10 w-10 mb-4" />
                  <p>Chưa có bài viết nào để hiển thị.</p>
                  {canEdit && <p className="text-sm mt-2">Hãy chia sẻ hành trình của bạn trên trang <Link href="/community" className="underline hover:text-primary">Cộng đồng</Link>!</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
