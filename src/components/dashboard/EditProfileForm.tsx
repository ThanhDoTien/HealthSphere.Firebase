
'use client';

import { useEffect, useState } from "react";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DocumentData } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { updateUserProfile } from "@/firebase/auth/utils";
import { initializeFirebase } from "@/firebase";
import { useUser } from "@/firebase/auth/use-user";
import { updateEmail, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/context/LanguageContext";


const ProfileFormSchema = z.object({
  name: z.string().min(1, { message: "Full name is required." }),
  email: z.string().email(), // Readonly, but needed for the form
  age: z.coerce.number().min(1, { message: "Tuổi phải lớn hơn 0." }).max(120),
  height: z.coerce.number().min(50, { message: "Chiều cao tối thiểu là 50cm." }).max(300),
  weight: z.coerce.number().min(20, { message: "Cân nặng tối thiểu là 20kg." }).max(500),
  gender: z.string().min(1, { message: "Gender is required." }),
  weightGoal: z.string().min(1, { message: "Weight goal is required." }),
  goal: z.string().min(1, { message: "Health goal is required." }),
  activityLevel: z.string().min(1, { message: "Activity level is required." }),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

interface EditProfileFormProps {
  userProfile: DocumentData;
  userId: string;
}

export default function EditProfileForm({ userProfile, userId }: EditProfileFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { auth } = initializeFirebase();
  const { user } = useUser();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [photoURL, setPhotoURL] = useState<string>("");

  useEffect(() => {
    if (user?.photoURL) {
      setPhotoURL(user.photoURL);
    }
  }, [user?.photoURL]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: userProfile.name || "",
      email: userProfile.email || "",
      age: userProfile.age || 0,
      height: userProfile.height || 0,
      weight: userProfile.weight || 0,
      gender: userProfile.gender || "",
      weightGoal: userProfile.weightGoal || "maintain",
      goal: userProfile.goal || "",
      activityLevel: userProfile.activityLevel || "moderate",
    },
  });

  const height = watch("height");
  const weight = watch("weight");

  useEffect(() => {
    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      let suggestedGoal = "maintain";
      if (bmi < 18.5) {
        suggestedGoal = "gain";
      } else if (bmi >= 25) {
        suggestedGoal = "lose";
      }
      setValue("weightGoal", suggestedGoal, { shouldDirty: true, shouldValidate: true });
    }
  }, [height, weight, setValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const currentUser = auth.currentUser;
      const tasks: Promise<any>[] = [updateUserProfile(userId, data)];

      // Upload Avatar if changed
      if (avatarPreview && avatarPreview.startsWith("data:image") && currentUser) {
        setIsUploadingAvatar(true);
        const storage = getStorage();
        const storageRef = ref(storage, `users/${userId}/avatar.png`);
        const uploadTask = uploadString(storageRef, avatarPreview, 'data_url')
          .then(snapshot => getDownloadURL(snapshot.ref))
          .then(url => {
            setPhotoURL(url);
            return updateProfile(currentUser, { photoURL: url });
          })
          .catch(err => {
            console.error("Avatar Upload Failed", err);
            throw new Error("Không thể tải lên ảnh đại diện.");
          });
        tasks.push(uploadTask);
      }

      // Update Email in Auth if changed
      if (currentUser && currentUser.email !== data.email) {
        tasks.push(updateEmail(currentUser, data.email).catch(err => {
           console.error("Email Update Failed", err);
           if (err.code === "auth/requires-recent-login") {
              throw new Error("Để đổi email, vui lòng đăng xuất và đăng nhập lại trước khi thực hiện.");
           }
           throw new Error("Không thể cập nhật email. Vui lòng thử lại.");
        }));
      }

      await Promise.all(tasks);

      toast({
        title: t('form.common.success'),
        description: t('profile.updateSuccess') || "Đã cập nhật hồ sơ thành công.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('form.common.error'),
        description: error.message || t('profile.updateError'),
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
         toast({ variant: "destructive", title: "Lỗi kích thước", description: "Vui lòng chọn ảnh nhỏ hơn 5MB." });
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center justify-center space-y-4 pb-6 border-b">
         <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={avatarPreview || photoURL} className="object-cover" />
              <AvatarFallback className="text-xl font-bold">{userProfile.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-all flex items-center justify-center">
               {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </Label>
            <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
         </div>
         <p className="text-xs text-muted-foreground">Nhấn vào icon máy ảnh để thay đổi Avatar</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">{t('signup.nameLabel')}</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t('login.emailLabel')}</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
         <div className="grid gap-2">
            <Label htmlFor="age">{t('signup.ageLabel')}</Label>
            <Input id="age" type="number" min="1" max="120" {...register("age")} />
            {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="height">{t('signup.heightLabel')}</Label>
            <Input id="height" type="number" min="50" max="300" {...register("height")} />
            {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">{t('signup.weightLabel')}</Label>
            <Input id="weight" type="number" min="20" max="500" {...register("weight")} />
            {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
          </div>
          <div className="grid gap-2">
          <Label htmlFor="gender">{t('signup.genderLabel')}</Label>
            <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                >
                    <SelectTrigger>
                    <SelectValue placeholder={t('signup.genderSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="male">{t('signup.genderMale')}</SelectItem>
                    <SelectItem value="female">{t('signup.genderFemale')}</SelectItem>
                    <SelectItem value="other">{t('signup.genderOther')}</SelectItem>
                    </SelectContent>
                </Select>
                )}
            />
            {errors.gender && (
                <p className="text-sm text-destructive">
                {errors.gender.message}
                </p>
            )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>{t('signup.weightGoalLabel')}</Label>
        {height > 0 && weight > 0 ? (
          <div className="rounded-md border bg-muted/50 p-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Chỉ số BMI:</span>
                <span className={`text-sm font-bold ${(weight / ((height / 100) * (height / 100))) < 18.5 ? "text-blue-500" : (weight / ((height / 100) * (height / 100))) >= 25 ? "text-destructive" : "text-green-500"}`}>
                  {(weight / ((height / 100) * (height / 100))).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Đánh giá:</span>
                <span className={`text-sm font-bold ${(weight / ((height / 100) * (height / 100))) < 18.5 ? "text-blue-500" : (weight / ((height / 100) * (height / 100))) >= 25 ? "text-destructive" : "text-green-500"}`}>
                  {(weight / ((height / 100) * (height / 100))) < 18.5 ? "Thiếu cân" : (weight / ((height / 100) * (height / 100))) >= 25 ? "Thừa cân" : "Bình thường"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Mục tiêu gợi ý:</span>
                <span className="text-sm font-bold text-primary">
                  {(weight / ((height / 100) * (height / 100))) < 18.5 ? t('signup.weightGoalGain') : (weight / ((height / 100) * (height / 100))) >= 25 ? t('signup.weightGoalLose') : t('signup.weightGoalMaintain')}
                </span>
              </div>
            </div>
            {/* Hidden input to keep react-hook-form connected */}
            <input type="hidden" {...register("weightGoal")} />
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Vui lòng nhập Chiều cao và Cân nặng để xem gợi ý.
          </div>
        )}
        {errors.weightGoal && (
          <p className="text-sm text-destructive">{errors.weightGoal.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="activityLevel">{t('signup.activityLabel')}</Label>
        <Controller
          control={control}
          name="activityLevel"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={t('signup.activitySelect')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">{t('signup.activitySedentary')}</SelectItem>
                <SelectItem value="light">{t('signup.activityLight')}</SelectItem>
                <SelectItem value="moderate">{t('signup.activityModerate')}</SelectItem>
                <SelectItem value="active">{t('signup.activityActive')}</SelectItem>
                <SelectItem value="extra">{t('signup.activityExtra')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.activityLevel && (
          <p className="text-sm text-destructive">{errors.activityLevel.message}</p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="goal">{t('signup.goalLabel')}</Label>
        <Input id="goal" {...register("goal")} />
        {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
      </div>
      
      <Button type="submit" disabled={isSubmitting || (!isDirty && !avatarPreview) || isUploadingAvatar} className="w-full sm:w-auto mt-4 px-8 font-bold">
        {isSubmitting || isUploadingAvatar ? (
           <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('profile.savingButton')}</>
        ) : t('profile.saveButton')}
      </Button>
    </form>
  );
}
