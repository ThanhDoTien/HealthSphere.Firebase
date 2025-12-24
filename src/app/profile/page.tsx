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
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Your Profile"
        description="Manage your personal information and health preferences."
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your profile details here. This information helps in personalizing your experience.
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
                <Button variant="outline">Change Photo</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Alex Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="alex.doe@example.com" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" type="number" defaultValue="70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" type="number" defaultValue="175" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-level">Activity Level</Label>
                <Select defaultValue="moderate">
                  <SelectTrigger id="activity-level">
                    <SelectValue placeholder="Select your activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="light">Lightly active (light exercise/sports 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderately active (moderate exercise/sports 3-5 days/week)</SelectItem>
                    <SelectItem value="very">Very active (hard exercise/sports 6-7 days a week)</SelectItem>
                    <SelectItem value="extra">Extra active (very hard exercise & physical job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietary-preferences">Dietary Preferences & Allergies</Label>
                <Textarea
                  id="dietary-preferences"
                  placeholder="e.g., Vegetarian, gluten-free, allergic to peanuts"
                  defaultValue="Balanced diet, trying to reduce sugar."
                />
              </div>
              <Button>Save Changes</Button>
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
