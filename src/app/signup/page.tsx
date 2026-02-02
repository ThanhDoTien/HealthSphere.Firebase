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
import { useState, useEffect } from 'react';
import { useAuth, useUser, initiateEmailSignUp } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = () => {
    if (email && password) {
      initiateEmailSignUp(auth, email, password);
      // The auth listener will eventually redirect, but we can push to the dashboard
      // to give the user immediate feedback.
      router.push('/dashboard');
    } else {
      alert("Vui lòng nhập email và mật khẩu.");
    }
  };

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleSignUp} className="w-full">
              Tạo tài khoản
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
