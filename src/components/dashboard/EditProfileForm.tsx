
'use client';

import { useEffect } from "react";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DocumentData } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { updateUserProfile } from "@/firebase/auth/utils";
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
      await updateUserProfile(userId, data);
      toast({
        title: t('form.common.success'),
        description: t('profile.updateSuccess'),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('form.common.error'),
        description: error.message || t('profile.updateError'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">{t('signup.nameLabel')}</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t('login.emailLabel')}</Label>
          <Input id="email" type="email" {...register("email")} readOnly disabled />
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
      
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? t('profile.savingButton') : t('profile.saveButton')}
      </Button>
    </form>
  );
}
