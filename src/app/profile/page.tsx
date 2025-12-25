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

export default function ProfilePage() {
  const userAvatar = PlaceHolderImages.find((p) => p.id === "user-avatar-1");
  const userUID = "user_1a2b3c4d5e";

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Hồ sơ của bạn"
        description="Quản lý thông tin cá nhân và sở thích sức khỏe của bạn."
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật chi tiết hồ sơ của bạn ở đây. Thông tin này giúp cá nhân hóa trải nghiệm của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {userAvatar && (
                    <AvatarImage
                      src={userAvatar.imageUrl}
                      alt="User avatar"
                      data-ai-hint={userAvatar.imageHint}
                    />
                  )}
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Button variant="outline">Thay đổi ảnh</Button>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="uid">UID</Label>
                  <Input id="uid" value={userUID} readOnly />
                </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" defaultValue="Alex Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="alex.doe@example.com" />
                </div>
              </div>
               <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weight">Cân nặng (kg)</Label>
                  <Input id="weight" type="number" defaultValue="70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Chiều cao (cm)</Label>
                  <Input id="height" type="number" defaultValue="175" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select defaultValue="male">
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
                <Select defaultValue="moderate">
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
                  defaultValue="Chế độ ăn uống cân bằng, đang cố gắng giảm đường."
                />
              </div>
              <Button>Lưu thay đổi</Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8 md:col-span-1">
          <BmiCalculator />
        </div>
      </div>
    </div>
  );
}
