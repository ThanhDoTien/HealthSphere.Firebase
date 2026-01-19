"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <div className="mb-4 flex justify-center">
            <Icons.logo className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
          <CardDescription>
            Nhập thông tin của bạn để bắt đầu hành trình sức khỏe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
             <div className="grid gap-2">
                <Label htmlFor="full-name">Họ và tên</Label>
                <Input id="full-name" placeholder="Alex Doe" required />
              </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" asChild>
                <Link href="/">Tạo tài khoản</Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Đã có tài khoản?{' '}
            <Link href="/login" className="underline">
              Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
