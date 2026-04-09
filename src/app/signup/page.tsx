// ==========================================
// FILE: src/app/signup/page.tsx
// MỤC ĐÍCH: Trang Đăng ký Tài khoản (Sign Up Page)
// TỔNG QUAN CHỨC NĂNG: Thu thập thông tin cá nhân (tên, email, mật khẩu, giới tính,
// tuổi, chiều cao, cân nặng, mục tiêu sức khỏe) từ người dùng mới.
// Tự động tính BMI và gợi ý mục tiêu cân nặng (tăng/giảm/giữ) dựa trên chỉ số.
// Sau khi đăng ký thành công, tạo hồ sơ trên Firebase và chuyển hướng tới Dashboard.
// ==========================================

"use client"; // Client Component do cần quản lý trạng thái form

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

// Schema xác thực dữ liệu form đăng ký
// Nhận hàm t() để hỗ trợ thông báo lỗi đa ngôn ngữ
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
  // Kiểm tra chéo: Mật khẩu nhập lại phải khớp với mật khẩu gốc
  .refine((data) => data.password === data.confirmPassword, {
    message: t('signup.error.passwordMismatch'),
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<ReturnType<typeof SignUpFormSchema>>;

export default function SignUpPage() {
  // Trạng thái chuyển hướng sau đăng ký thành công
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema(t)),
    defaultValues: {
      weightGoal: "maintain",
      activityLevel: "moderate",
      gender: "male",
    }
  });

  // Theo dõi giá trị chiều cao và cân nặng theo thời gian thực
  // để tự động tính BMI mỗi khi người dùng thay đổi
  const height = watch("height");
  const weight = watch("weight");

  // Hook tự động tính BMI và gợi ý mục tiêu cân nặng
  // BMI < 18.5 → Thiếu cân → Gợi ý "Tăng cân"
  // BMI >= 25  → Thừa cân  → Gợi ý "Giảm cân"
  // Còn lại   → Bình thường → Gợi ý "Duy trì"
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
      // Tự động cập nhật trường weightGoal trên form
      setValue("weightGoal", suggestedGoal, { shouldValidate: true });
    }
  }, [height, weight, setValue]);

  useMustBeLoggedOut();

  // Hàm xử lý khi người dùng nhấn "Đăng ký"
  const onSubmit = async (data: SignUpFormValues) => {
    try {
      // Gọi hàm signUp() từ firebase/auth/utils.ts để tạo tài khoản + hồ sơ
      await signUp(data);
      toast({
        title: t('form.common.success'),
        description: t('signup.success'),
      });
      setIsRedirecting(true);
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
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-500">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full bg-primary/20"></div>
            <div className="absolute h-20 w-20 animate-pulse rounded-full bg-primary/40"></div>
            <Loader2 className="relative z-10 h-10 w-10 animate-spin text-primary drop-shadow-md" />
          </div>
          <p className="mt-8 animate-pulse bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            {t('signup.success') || "Tạo tài khoản thành công!"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground animate-pulse delay-150">Đang thiết lập khu vực cá nhân của bạn</p>
        </div>
      )}
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
