'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { translations, type Locale } from '@/lib/dictionaries';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function LandingHeader({
  lang,
  setLang,
  dict,
}: {
  lang: Locale;
  setLang: (lang: Locale) => void;
  dict: any;
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="font-bold">HealthSphere</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <LanguageSwitcher lang={lang} setLang={setLang} />
          <span className="h-6 border-l"></span>
          <Button variant="ghost" asChild>
            <Link href="/login">{dict['nav.signIn']}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{dict['nav.signUp']}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function RootPage() {
  const [lang, setLang] = useState<Locale>('en');
  const dict = translations[lang];
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-workout');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader lang={lang} setLang={setLang} dict={dict} />
      <main>
        <div className="container py-12 md:py-24">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
              <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Icons.zap className="mr-2 h-4 w-4" />
                {dict['hero.tag']}
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                {dict['hero.title']}
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                {dict['hero.subtitle']}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    {dict['hero.getStarted']}
                    <Icons.chevronRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline">
                  {dict['hero.learnMore']}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icons.shield className="h-5 w-5" />
                  <span>{dict['feature.secure']}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.heart className="h-5 w-5" />
                  <span>{dict['feature.personalized']}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              {heroImage && (
                 <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={600}
                    height={600}
                    className="aspect-square rounded-2xl object-cover shadow-2xl"
                    data-ai-hint={heroImage.imageHint}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
