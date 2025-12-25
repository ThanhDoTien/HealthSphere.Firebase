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
import { BmiCalculator } from "@/components/bmi-calculator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { MessageSquare } from "lucide-react";

// Mock data store
const users = {
  "alex-doe": {
    name: "Alex Doe",
    email: "alex.doe@example.com",
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
    email: "jane.doe@example.com",
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
    email: "john.smith@example.com",
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
  
  const userAvatar = PlaceHolderImages.find((p) => p.id === userData.avatarId);
  const canEdit = isCurrentUser(userId);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={canEdit ? "Hồ sơ của bạn" : `Hồ sơ của ${userData.name}`}
        description={canEdit ? "Quản lý thông tin cá nhân và sở thích sức khỏe của bạn." : `Xem hồ sơ của ${userData.name}`}
      />
      <div className={canEdit ? "grid gap-8 md:grid-cols-3" : "grid gap-8"}>
        <div className={canEdit ? "md:col-span-2 space-y-8" : "space-y-8"}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                {canEdit ? "Cập nhật chi tiết hồ sơ của bạn ở đây. Thông tin này giúp cá nhân hóa trải nghiệm của bạn." : `Chi tiết hồ sơ của ${userData.name}.`}
              </CardDescription>
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
                   <Input id="name" defaultValue={userData.name} readOnly={!canEdit} />
                </div>
                 {canEdit && <Button variant="outline">Thay đổi ảnh</Button>}
              </div>

               <div className="space-y-2">
                  <Label htmlFor="uid">UID</Label>
                  <Input id="uid" value={userData.uid} readOnly />
                </div>

               {canEdit && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Cân nặng (kg)</Label>
                    <Input id="weight" type="number" defaultValue={userData.weight} readOnly={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Chiều cao (cm)</Label>
                    <Input id="height" type="number" defaultValue={userData.height} readOnly={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Giới tính</Label>
                    <Select defaultValue={userData.gender} disabled={!canEdit}>
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
              )}
              <div className="space-y-2">
                <Label htmlFor="activity-level">Mức độ hoạt động</Label>
                <Select defaultValue={userData.activityLevel} disabled={!canEdit}>
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
                  readOnly={!canEdit}
                />
              </div>
              {canEdit && <Button>Lưu thay đổi</Button>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bài viết của {userData.name}</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-40">
                  <MessageSquare className="h-10 w-10 mb-4" />
                  <p>Chưa có bài viết nào để hiển thị.</p>
                  {canEdit && <p className="text-sm mt-2">Hãy chia sẻ hành trình của bạn trên trang Cộng đồng!</p>}
              </div>
            </CardContent>
          </Card>
        </div>
        {canEdit && (
          <div className="space-y-8 md:col-span-1">
             <BmiCalculator />
          </div>
        )}
      </div>
    </div>
  );
}
