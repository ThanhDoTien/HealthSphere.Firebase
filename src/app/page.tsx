'use client';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { Logo } from "@/components/Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, BarChart2, BrainCircuit } from "lucide-react";
import imageData from '@/app/lib/placeholder-images.json';

export default function HomePage() {
  const { t, setLocale } = useTranslation();

  const features = [
    {
      icon: BarChart2,
      title: t('home.features.track.title'),
      description: t('home.features.track.description'),
      image: imageData.feature_track,
    },
    {
      icon: BrainCircuit,
      title: t('home.features.ai.title'),
      description: t('home.features.ai.description'),
      image: imageData.feature_ai,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold">HealthSphere</span>
          </Link>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">{t('header.toggleLanguage')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale('en')}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('vi')}>Tiếng Việt</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" asChild>
              <Link href="/login">{t('home.login')}</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">{t('home.signup')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 text-center sm:py-32">
          <div className="container relative z-10 mx-auto px-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-primary">Health</span>Sphere
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t('home.subtitle')}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">{t('home.signup')}</Link>
              </Button>
            </div>
          </div>
           <div className="absolute inset-0 z-0 opacity-20">
              <Image
                src={imageData.home_hero.src}
                alt="Healthy lifestyle"
                fill
                className="object-cover"
                priority
                data-ai-hint={imageData.home_hero.hint}
              />
               <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {t('home.intro.title')}
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
                    {t('home.intro.description')}
                </p>
            </div>
        </section>

        {/* Features Section */}
        <section className="border-t py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-none grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:max-w-5xl">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center">
                   <div className="relative h-64 w-full overflow-hidden rounded-lg shadow-lg">
                     <Image
                      src={feature.image.src}
                      alt={feature.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      data-ai-hint={feature.image.hint}
                    />
                   </div>
                  <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-muted/50 py-16 sm:py-24">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {t('home.cta.title')}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                    {t('home.cta.subtitle')}
                </p>
                <div className="mt-8">
                     <Button size="lg" asChild>
                        <Link href="/signup">{t('home.cta.button')}</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            {t('home.footer.copyright')}
        </div>
      </footer>
    </div>
  );
}
