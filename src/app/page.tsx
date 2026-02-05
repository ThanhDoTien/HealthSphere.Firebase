
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dumbbell, Moon, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Icons } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <UtensilsCrossed className="h-8 w-8 text-primary" />,
    title: "Theo dõi Dinh dưỡng",
    description: "Ghi lại bữa ăn dễ dàng — nhập thủ công hoặc chụp ảnh, AI tự động nhận dạng.",
  },
  {
    icon: <Dumbbell className="h-8 w-8 text-primary" />,
    title: "Theo dõi Luyện tập",
    description: "Theo dõi hoạt động, calo đã đốt và nhận đề xuất luyện tập phù hợp với bạn.",
  },
  {
    icon: <Moon className="h-8 w-8 text-primary" />,
    title: "Phân tích Giấc ngủ",
    description: "Hiểu rõ chu kỳ ngủ và cải thiện chất lượng giấc ngủ theo thời gian.",
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "Thông tin từ AI",
    description: "Nhận gợi ý công thức, kế hoạch luyện tập và mẹo dinh dưỡng được cá nhân hóa cho mục tiêu của bạn.",
  },
];

const visualJourney = [
  {
    title: "Chụp & Theo dõi bữa ăn của bạn",
    description: "Dễ dàng ghi lại lượng thức ăn của bạn chỉ bằng cách chụp ảnh. AI của chúng tôi sẽ lo phần còn lại.",
    imageId: "meal-1"
  },
  {
    title: "Bài tập được cá nhân hóa",
    description: "Nhận các đề xuất tập luyện phù hợp với mức độ thể chất và thiết bị có sẵn của bạn.",
    imageId: "community-post-2"
  },
  {
    title: "Khám phá các công thức nấu ăn ngon",
    description: "Khám phá một thư viện các công thức nấu ăn lành mạnh phù hợp với nhu cầu và sở thích ăn uống của bạn.",
    imageId: "recipe-1"
  }
];


export default function HomePage() {
  const heroImage = PlaceHolderImages.find((p) => p.id === 'hero-1');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8" />
          <span className="text-xl font-bold font-headline">HealthSphere</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Đăng ký</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative text-center py-20 md:py-32 px-4 bg-card">
          <div className="absolute inset-0">
             {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover opacity-20"
                    data-ai-hint={heroImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-background/60 dark:bg-background/80" />
          </div>
          <div className="relative z-10 container mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
              HealthSphere – Người Bạn Đồng Hành Cho Sức Khỏe Toàn Diện
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Theo dõi dinh dưỡng, luyện tập và giấc ngủ chỉ trong một ứng dụng — với các thông tin và gợi ý cá nhân hóa từ AI để giúp bạn đạt mục tiêu sức khỏe mỗi ngày.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex flex-wrap justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/signup">Khởi đầu hành trình khỏe mạnh ngay hôm nay</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/dashboard">Khám phá bảng điều khiển sức khỏe của bạn</Link>
                    </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Đăng ký miễn phí và bắt đầu theo dõi</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-headline">Tất cả những gì bạn cần – ở một nơi</h2>
              <p className="mt-2 text-muted-foreground">
                HealthSphere giúp việc quản lý sức khỏe trở nên đơn giản, trực quan và hiệu quả:
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardHeader className="items-center">
                    <div className="bg-primary/10 p-3 rounded-full">
                      {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Journey Section */}
        <section id="gallery" className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-headline">Hành trình sức khỏe trực quan</h2>
              <p className="mt-2 text-muted-foreground">
                HealthSphere tích hợp dễ dàng vào cuộc sống hàng ngày, giúp bạn theo dõi tiến độ và cải thiện thói quen theo cách thông minh hơn.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {visualJourney.map((item) => {
                const image = PlaceHolderImages.find((p) => p.id === item.imageId);
                return (
                  <Card key={item.imageId} className="overflow-hidden flex flex-col">
                    {image && (
                       <div className="aspect-[4/3]">
                          <Image
                              src={image.imageUrl}
                              alt={image.description}
                              width={600}
                              height={450}
                              className="object-cover w-full h-full"
                              data-ai-hint={image.imageHint}
                          />
                      </div>
                    )}
                    <CardContent className="p-6 flex-grow">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="mt-2 text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>


        {/* Quote Section */}
         <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <blockquote className="max-w-3xl mx-auto">
              <p className="text-2xl md:text-3xl font-medium text-foreground">
                “Sức khỏe là tài sản lớn nhất.”
              </p>
              <footer className="mt-4 text-lg text-muted-foreground">– Virgil</footer>
            </blockquote>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          &copy; 2024 HealthSphere. Sản phẩm thuộc về Đỗ Tiến Thành, Nguyễn Hữu Vinh, Vũ Đức Thọ, Đặng Thị Mai.
        </div>
      </footer>
    </div>
  );
}
