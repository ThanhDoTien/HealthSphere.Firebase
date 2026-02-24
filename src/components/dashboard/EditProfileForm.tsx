'use client';

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
  age: z.coerce.number().min(1, { message: "Age is required." }),
  height: z.coerce.number().min(1, { message: "Height is required." }),
  weight: z.coerce.number().min(1, { message: "Weight is required." }),
  gender: z.string().min(1, { message: "Gender is required." }),
  goal: z.string().min(1, { message: "Health goal is required." }),
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
      goal: userProfile.goal || "",
    },
  });

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
            <Input id="age" type="number" {...register("age")} />
            {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="height">{t('signup.heightLabel')}</Label>
            <Input id="height" type="number" {...register("height")} />
            {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">{t('signup.weightLabel')}</Label>
            <Input id="weight" type="number" {...register("weight")} />
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
