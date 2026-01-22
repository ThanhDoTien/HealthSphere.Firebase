import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-4xl font-bold">Chào mừng đến với HealthSphere</h1>
        <p className="mt-4 text-lg text-muted-foreground">
            Trang chủ của bạn đang được xây dựng.
        </p>
        <div className="mt-8 flex gap-4">
            <Button asChild>
                <Link href="/dashboard">Đi đến Bảng điều khiển</Link>
            </Button>
             <Button variant="outline" asChild>
                <Link href="/login">Đăng nhập</Link>
            </Button>
        </div>
    </div>
  );
}
