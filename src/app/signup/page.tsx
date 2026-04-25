// ==========================================
// FILE: src/app/signup/page.tsx
// MỤC ĐÍCH: Trang Đăng ký Tài khoản (Sign Up Page) - 2 Bước
// TỔNG QUAN CHỨC NĂNG: 
// Bước 1: Thông tin cơ bản (Tên, Email, Mật khẩu).
// Bước 2: Thông tin sức khỏe (Giới tính, Tuổi, Chỉ số cơ thể).
// Cho phép Skip bước 2 nếu người dùng chưa muốn nhập.
// ==========================================

"use client";

import { useState } from "react";
import { Loader2, ArrowRight, ArrowLeft, ShieldCheck, HeartPulse } from "lucide-react";
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
import { cn } from "@/lib/utils";

// Schema xác thực dữ liệu
const SignUpFormSchema = (t: (key: string) => string) => z
  .object({
    name: z.string().min(1, { message: t('signup.error.nameRequired') || "Họ và tên là bắt buộc" }),
    email: z.string().email({ message: t('signup.error.emailInvalid') || "Email không hợp lệ" }),
    password: z.string().min(6, { message: t('signup.error.passwordShort') || "Mật khẩu ít nhất 6 ký tự" }),
    confirmPassword: z.string(),
    // Các trường bước 2 làm optional để hỗ trợ "Skip"
    gender: z.string().optional().default("male"),
    age: z.coerce.number().optional().default(0),
    height: z.coerce.number().optional().default(0),
    weight: z.coerce.number().optional().default(0),
    weightGoal: z.string().optional().default("maintain"),
    goal: z.string().optional().default(""),
    activityLevel: z.string().optional().default("moderate"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('signup.error.passwordMismatch') || "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<ReturnType<typeof SignUpFormSchema>>;

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpFormSchema(t)),
    defaultValues: {
      weightGoal: "maintain",
      activityLevel: "moderate",
      gender: "male",
      age: undefined,
      height: undefined,
      weight: undefined,
    }
  });

  useMustBeLoggedOut();

  // Kiểm tra tính hợp lệ của Bước 1 trước khi sang Bước 2
  const nextStep = async () => {
    const isValid = await trigger(["name", "email", "password", "confirmPassword"]);
    if (isValid) setStep(2);
  };

  const prevStep = () => setStep(1);

  const onSubmit = async (data: SignUpFormValues) => {
    try {
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
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -ml-64 -mb-64" />

      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative">
             <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
             <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
          </div>
          <p className="mt-8 text-2xl font-black tracking-tight text-primary animate-bounce">
            {t('signup.success')}
          </p>
          <p className="mt-2 text-slate-500 font-medium">Đang chuẩn bị không gian sức khỏe của bạn...</p>
        </div>
      )}

      <Card className="w-full max-w-[480px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="pt-10 pb-6 text-center space-y-4">
          <div className="flex justify-center mb-2">
             <div className="flex items-center space-x-1">
                {[1, 2].map((s) => (
                  <div 
                    key={s} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      step === s ? "w-10 bg-primary" : "w-1.5 bg-slate-200"
                    )} 
                  />
                ))}
             </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
              {step === 1 ? t('signup.title') : "Hồ sơ sức khỏe"}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium px-6">
              {step === 1 
                ? t('signup.description') 
                : "Giúp chúng tôi hiểu rõ về bạn hơn để đưa ra những lời khuyên chính xác nhất."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-bold ml-1">{t('signup.nameLabel')}</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    {...register("name")} 
                    className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                  />
                  {errors.name && <p className="text-sm text-red-500 font-medium ml-1">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-bold ml-1">{t('login.emailLabel')}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    {...register("email")} 
                    className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                  />
                  {errors.email && <p className="text-sm text-red-500 font-medium ml-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" title="password" className="text-slate-700 font-bold ml-1">{t('login.passwordLabel')}</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      {...register("password")} 
                      className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                    />
                    {errors.password && <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" title="confirm" className="text-slate-700 font-bold ml-1">{t('signup.passwordConfirmLabel')}</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      {...register("confirmPassword")} 
                      className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-500 font-medium ml-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <Button 
                  type="button" 
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4" 
                  onClick={nextStep}
                >
                  {t('form.common.next')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="flex items-center justify-center space-x-2 py-2">
                   <ShieldCheck className="h-4 w-4 text-slate-400" />
                   <span className="text-xs text-slate-400 font-medium">Bảo mật thông tin của bạn là ưu tiên hàng đầu</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-8 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold ml-1">{t('signup.genderLabel')}</Label>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 transition-all px-5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-xl">
                            <SelectItem value="male">{t('signup.genderMale')}</SelectItem>
                            <SelectItem value="female">{t('signup.genderFemale')}</SelectItem>
                            <SelectItem value="other">{t('signup.genderOther')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold ml-1">{t('signup.ageLabel')}</Label>
                    <Input 
                      type="number" 
                      placeholder="25"
                      {...register("age")} 
                      className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold ml-1">{t('signup.heightLabel')} (cm)</Label>
                    <Input 
                      type="number" 
                      placeholder="170"
                      {...register("height")} 
                      className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-bold ml-1">{t('signup.weightLabel')} (kg)</Label>
                    <Input 
                      type="number" 
                      placeholder="65"
                      {...register("weight")} 
                      className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold ml-1">{t('signup.activityLabel')}</Label>
                  <Controller
                    control={control}
                    name="activityLevel"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 transition-all px-5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="sedentary">{t('signup.activitySedentary')}</SelectItem>
                          <SelectItem value="light">{t('signup.activityLight')}</SelectItem>
                          <SelectItem value="moderate">{t('signup.activityModerate')}</SelectItem>
                          <SelectItem value="active">{t('signup.activityActive')}</SelectItem>
                          <SelectItem value="extra">{t('signup.activityExtra')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold ml-1">{t('signup.goalLabel')}</Label>
                  <Input 
                    placeholder={t('signup.goalPlaceholder')} 
                    {...register("goal")} 
                    className="h-13 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-base px-5" 
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={prevStep} 
                    className="h-14 w-14 rounded-2xl hover:bg-slate-100 text-slate-500 transition-all shrink-0"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Button>
                  
                  <div className="flex gap-2 flex-grow">
                    <Button 
                      type="submit" 
                      variant="outline" 
                      className="flex-1 h-14 rounded-2xl font-bold border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]" 
                      disabled={isSubmitting}
                    >
                      {t('form.common.skip')}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : t('form.common.finish')}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 py-1">
                   <HeartPulse className="h-4 w-4 text-primary opacity-60" />
                   <span className="text-xs text-slate-400 font-medium">Bổ sung thông tin giúp thuật toán AI phân tích tốt hơn</span>
                </div>
              </div>
            )}
          </form>
          
          {step === 1 && (
            <div className="mt-8 text-center text-sm text-slate-500 font-medium">
              {t('signup.hasAccount')}{" "}
              <Link href="/login" className="font-black text-primary hover:text-blue-600 transition-colors">
                {t('signup.loginLink')}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
