import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <Icons.logo className="h-16 w-16 mb-4" />
      <h1 className="text-4xl md:text-5xl font-bold mb-4">Chào mừng đến với ứng dụng của bạn</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
        Đây là điểm khởi đầu cho dự án của bạn. Hãy cho tôi biết bạn muốn xây dựng gì tiếp theo!
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="#">Bắt đầu xây dựng</Link>
        </Button>
      </div>
    </div>
  );
}
