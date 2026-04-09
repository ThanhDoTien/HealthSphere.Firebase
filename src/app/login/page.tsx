// ==========================================
// FILE: src/app/login/page.tsx
// MỤC ĐÍCH: Trang Đăng nhập (Login Page)
// TỔNG QUAN CHỨC NĂNG: Cung cấp giao diện cho người dùng đăng nhập bằng Email/Password
// hoặc thông qua tài khoản Google. Quản lý trạng thái nhập liệu, hiển thị lỗi 
// và điều hướng sau khi đăng nhập thành công.
// ==========================================

"use client"; // Đánh dấu đây là Client Component trong Next.js

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

// Nhập các UI Components cơ bản
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
import { useToast } from "@/components/ui/toast";
import { GoogleIcon } from "@/components/icons";

// Nhập các tiện ích Firebase và hooks do dự án tự xây dựng
import { signIn, signInWithGoogle } from "@/firebase/auth/utils";
import useMustBeLoggedOut from "@/lib/hooks/use-must-be-logged-out";
import { useTranslation } from "@/context/LanguageContext";

// Khai báo Schema (cấu trúc) cho Form sử dụng thư viện Zod
// Giúp tự động kiểm tra xem Email có hợp lệ không và Mật khẩu có đủ dài không.
const LoginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof LoginFormSchema>;

export default function LoginPage() {
  // Trạng thái kiểm soát việc có đang chuyển hướng hay không để hiển thị màn hình loading
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Hook để hiển thị thông báo popup (Toast)
  const { toast } = useToast();
  
  // Hook để chuyển hướng trang của Next.js
  const router = useRouter();
  
  // Hook lấy hàm dịch thuật đa ngôn ngữ (i18n)
  const { t } = useTranslation();

  // Khởi tạo React Hook Form kết hợp với Zod Schema để quản lý lỗi nhập liệu
  const {
    register, // Dùng để gắn các trường input vào Form
    handleSubmit, // Hàm bao bọc sự kiện submit form
    formState: { errors, isSubmitting }, // Chứa trạng thái lỗi và đang gửi dữ liệu
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
  });

  // Đảm bảo chỉ người CHƯA đăng nhập mới vào được trang này. 
  // Nếu đã đăng nhập, hook này sẽ tự động đẩy người dùng vào trang /dashboard.
  useMustBeLoggedOut();

  // Hàm xử lý khi người dùng nhấn "Đăng nhập" bằng Email/Password
  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Gọi tiện ích Firebase để đăng nhập
      await signIn(data.email, data.password);
      
      // Hiển thị thông báo thành công
      toast({
        title: "Success",
        description: t('login.success'),
      });
      
      // Kích hoạt UI loading và chuyển hướng sang Dashboard
      setIsRedirecting(true);
      router.push("/dashboard");
    } catch (error: any) {
      // Bắt lỗi (sai mật khẩu, email ko tồn tại...) và hiển thị Toast màu đỏ
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || t('login.error'),
      });
    }
  };

  // Hàm xử lý việc xác thực thông qua hệ thống tài khoản Google (OAuth)
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Success",
        description: t('login.googleSuccess'),
      });
      setIsRedirecting(true);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || t('login.error'),
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* KHU VỰC 1: Overlay Loading toàn màn hình khi đang đợi chuyển tiếp dữ liệu */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md transition-all duration-500">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full bg-primary/20"></div>
            <div className="absolute h-20 w-20 animate-pulse rounded-full bg-primary/40"></div>
            {/* Sử dụng Icon động Loading. Chú ý: Đây là phần không thể bỏ theo yêu cầu */}
            <Loader2 className="relative z-10 h-10 w-10 animate-spin text-primary drop-shadow-md" />
          </div>
          <p className="mt-8 animate-pulse bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            {t('login.success') || "Đang chuẩn bị dữ liệu..."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground animate-pulse delay-150">Đang đồng bộ hồ sơ sức khỏe của bạn</p>
        </div>
      )}

      {/* KHU VỰC 2: Thẻ Card hiển thị chính form đăng nhập */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            
            {/* Nhập Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")} // Liên kết React Hook Form
              />
              {/* Hiển thị lỗi báo bằng chữ màu đỏ nếu email sai format */}
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            {/* Nhập Mật khẩu */}
            <div className="grid gap-2">
              <Label htmlFor="password">{t('login.passwordLabel')}</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            
            {/* Nút gửi form chính */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('login.loadingButton') : t('login.button')}
            </Button>
          </form>

          {/* Dải phân cách "Hoặc" */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t('login.orContinueWith')}
              </span>
            </div>
          </div>

          {/* Nút tiếp tục bằng Google */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            {t('login.googleButton')}
          </Button>

          {/* Liên kết qua phần Đăng ký nếu chưa có tài khoản */}
          <div className="mt-4 text-center text-sm">
            {t('login.noAccount')}{" "}
            <Link href="/signup" className="underline">
              {t('login.signupLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
