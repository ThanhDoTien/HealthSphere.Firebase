import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline">HealthSphere</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Bắt đầu</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
              Người bạn đồng hành cho sức khỏe của bạn
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground">
              HealthSphere giúp bạn theo dõi dinh dưỡng, hoạt động, giấc ngủ và hơn thế nữa. Đạt được mục tiêu sức khỏe của bạn với thông tin chi tiết được hỗ trợ bởi AI.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Bắt đầu miễn phí</Link>
              </Button>
              <Button size="lg" variant="outline">
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
                 <Image 
                    src="https://picsum.photos/seed/health-app/1200/600" 
                    alt="Health app dashboard"
                    width={1200}
                    height={600}
                    className="w-full h-auto"
                    data-ai-hint="app dashboard"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
        </section>

        <section className="bg-muted">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <h3 className="text-2xl font-bold font-headline">Theo dõi mọi thứ</h3>
                        <p className="mt-2 text-muted-foreground">Ghi lại bữa ăn, bài tập, giấc ngủ và cân nặng một cách dễ dàng.</p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold font-headline">Thông tin từ AI</h3>
                        <p className="mt-2 text-muted-foreground">Nhận các đề xuất được cá nhân hóa cho công thức nấu ăn, bài tập và hơn thế nữa.</p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold font-headline">Xem tiến trình của bạn</h3>
                        <p className="mt-2 text-muted-foreground">Trực quan hóa hành trình sức khỏe của bạn bằng các biểu đồ và đồ thị chi tiết.</p>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-background border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} HealthSphere. Mọi quyền được bảo lưu.
          </div>
      </footer>
    </div>
  );
}
