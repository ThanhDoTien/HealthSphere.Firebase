
"use client";

import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

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
import { useToast } from "@/components/ui/toast";
import { signUp } from "@/firebase/auth/utils";
import useMustBeLoggedOut from "@/lib/hooks/use-must-be-logged-out";
import { useTranslation } from "@/context/LanguageContext";

const SignUpFormSchema = (t: (key: string) => string) => z
  .object({
    name: z.string().min(1, { message: "Full name is required." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
    gender: z.string().min(1, { message: "Gender is required." }),
    age: z.coerce.number().min(1, { message: "Age is required." }),
    height: z.coerce.number().min(50, { message: "Height is required." }),
    weight: z.coerce.number().min(20, { message: "Weight is required." }),
    weightGoal: z.string().min(1, { message: "Weight goal is required." }),
    goal: z.string().min(1, { message: "Health goal is required." }),
    activityLevel: z.string().min(1, { message: "Activity level is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('signup.error.passwordMismatch'),
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<ReturnType<typeof SignUpFormSchema>>;

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema(t)),
    defaultValues: {
      weightGoal: "maintain",
      activityLevel: "moderate",
      gender: "male",
    }
  });

  useMustBeLoggedOut();

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      await signUp(data);
      toast({
        title: t('form.common.success'),
        description: t('signup.success'),
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('form.common.error'),
        description: error.message || t('login.error'),
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{t('signup.title')}</CardTitle>
          <CardDescription>
            {t('signup.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('signup.nameLabel')}</Label>
              <Input id="name" placeholder="John Doe" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">{t('signup.passwordConfirmLabel')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="age">{t('signup.ageLabel')}</Label>
                <Input id="age" type="number" {...register("age")} />
                {errors.age && (
                  <p className="text-sm text-destructive">
                    {errors.age.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="height">{t('signup.heightLabel')}</Label>
                <Input id="height" type="number" {...register("height")} />
                {errors.height && (
                  <p className="text-sm text-destructive">
                    {errors.height.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">{t('signup.weightLabel')}</Label>
                <Input id="weight" type="number" {...register("weight")} />
                {errors.weight && (
                  <p className="text-sm text-destructive">
                    {errors.weight.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="weightGoal">{t('signup.weightGoalLabel')}</Label>
              <Controller
                control={control}
                name="weightGoal"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('signup.weightGoalSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose">{t('signup.weightGoalLose')}</SelectItem>
                      <SelectItem value="maintain">{t('signup.weightGoalMaintain')}</SelectItem>
                      <SelectItem value="gain">{t('signup.weightGoalGain')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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
              <Input id="goal" placeholder={t('signup.goalPlaceholder')} {...register("goal")} />
              {errors.goal && (
                <p className="text-sm text-destructive">{errors.goal.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('signup.loadingButton') : t('signup.button')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t('signup.hasAccount')}{" "}
            <Link href="/login" className="underline">
              {t('signup.loginLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
