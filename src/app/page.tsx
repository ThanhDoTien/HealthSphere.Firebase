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
    title: "Ghi lại Dinh dưỡng",
    description: "Dễ dàng ghi lại các bữa ăn của bạn bằng cách nhập liệu thủ công hoặc sử dụng tính năng nhận dạng hình ảnh do AI cung cấp.",
  },
  {
    icon: <Dumbbell className="h-8 w-8 text-primary" />,
    title: "Theo dõi Luyện tập",
    description: "Ghi lại các bài tập, theo dõi lượng calo đã đốt cháy và nhận các đề xuất tập luyện được cá nhân hóa.",
  },
  {
    icon: <Moon className="h-8 w-8 text-primary" />,
    title: "Phân tích Giấc ngủ",
    description: "Theo dõi các kiểu ngủ của bạn và nhận thông tin chi tiết để cải thiện chất lượng giấc ngủ và sức khỏe tổng thể.",
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "Thông tin chi tiết từ AI",
    description: "Tận dụng sức mạnh của AI để nhận các đề xuất, công thức nấu ăn và thông tin chi tiết về sức khỏe được cá nhân hóa.",
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
              Người Bạn Đồng Hành Sức Khỏe Cá Nhân Của Bạn
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Theo dõi dinh dưỡng, luyện tập và giấc ngủ. Nhận thông tin chi tiết do AI cung cấp để đạt được mục tiêu của bạn.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Bắt đầu ngay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Xem Bảng điều khiển</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-headline">Mọi thứ bạn cần, ở cùng một nơi</h2>
              <p className="mt-2 text-muted-foreground">
                HealthSphere giúp việc theo dõi sức khỏe của bạn trở nên đơn giản và trực quan.
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
              <h2 className="text-3xl font-bold font-headline">Hành trình trực quan đến một bạn khỏe mạnh hơn</h2>
              <p className="mt-2 text-muted-foreground">
                Xem HealthSphere tích hợp vào cuộc sống hàng ngày của bạn như thế nào.
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
                    <CardContent className="p-6 flex-grow flex flex-col">
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
                "Tài sản lớn nhất là sức khỏe."
              </p>
              <footer className="mt-4 text-lg text-muted-foreground">- Virgil</footer>
            </blockquote>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} HealthSphere. Mọi quyền được bảo lưu.
        </div>
      </footer>
    </div>
  );
}
